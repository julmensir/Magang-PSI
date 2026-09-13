// Service Worker SIVT AI
const CACHE_NAME = 'sivt-ai-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Install: cache aset dasar
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('[SW] Gagal cache beberapa aset:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first untuk API & HTML, cache-first untuk aset statis
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Jangan cache request API
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Jangan cache CDN eksternal
    if (url.origin !== self.location.origin) {
        return;
    }

    // Jangan cache upload
    if (url.pathname.startsWith('/uploads/')) {
        return;
    }

    // Network-first untuk HTML
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first untuk aset lain
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});