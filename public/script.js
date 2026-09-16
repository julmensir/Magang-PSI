// ============================================================
// SIVT AI — Frontend Script (Ultimate Version - Final)
// ============================================================

let currentUser = null;
let adminToken = null;
let chatSessionId = null;
let currentPage = 'dashboard';
let currentTheme = null;
let currentUnansweredFilter = 'pending';
let currentLearningFilter = 'pending';
let currentFeedbackFilter = 'all';
let currentProviderMode = 'builtin';

// ============================================================
// LOGO SIZES
// ============================================================
const LOGO_SIZES = {
    small:  { chat: 36, login: 80,  sidebar: 36 },
    medium: { chat: 44, login: 90,  sidebar: 44 },
    large:  { chat: 56, login: 110, sidebar: 56 },
    xlarge: { chat: 72, login: 130, sidebar: 72 }
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('chatPage').style.display = 'flex';
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'none';

    chatSessionId = localStorage.getItem('sivt_sessionId') || null;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) showPage(page);
        });
    });

    document.addEventListener('click', (e) => {
        const wrap = document.querySelector('.notif-wrapper');
        const dropdown = document.getElementById('notifDropdown');
        if (wrap && dropdown && !wrap.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    initChatInput();
    await loadPublicConfig();
    await checkAdminSession();
});

// ============================================================
// CEK SESSION ADMIN
// ============================================================
async function checkAdminSession() {
    try {
        const res = await fetch('/api/admin/check', {
            credentials: 'include',
            headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
        });
        const data = await res.json();
        if (data.authenticated) {
            adminToken = data.token;
            currentUser = { username: data.username };
            document.getElementById('adminUsername').textContent = data.username;
            document.getElementById('chatPage').style.display = 'none';
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('adminPage').style.display = 'block';
            await loadAdminConfig();
            showPage('dashboard');
            setInterval(loadNotificationsBadge, 30000);
            console.log('[AUTH] Session dipulihkan:', data.username);
        }
    } catch (err) {
        console.warn('[AUTH] Cek session gagal:', err.message);
    }
}

// ============================================================
// AUTO-EXPAND TEXTAREA
// ============================================================
function initChatInput() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    function autoResize() {
        input.style.height = 'auto';
        const maxH = 140;
        input.style.height = Math.min(input.scrollHeight, maxH) + 'px';
    }

    input.addEventListener('input', autoResize);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    window.resetChatInputHeight = function() {
        input.style.height = 'auto';
        input.style.height = '44px';
    };
}

// ============================================================
// TEMA WARNA
// ============================================================
function applyTheme(theme) {
    if (!theme) return;
    currentTheme = theme;
    const root = document.documentElement;
    if (theme.primary) root.style.setProperty('--primary', theme.primary);
    if (theme.primaryDark) root.style.setProperty('--primary-dark', theme.primaryDark);
    if (theme.primaryLight) root.style.setProperty('--primary-light', theme.primaryLight);
    if (theme.accent) root.style.setProperty('--accent', theme.accent);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && theme.primary) meta.setAttribute('content', theme.primary);

    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && theme.sidebarStart && theme.sidebarEnd) {
        sidebar.style.background = `linear-gradient(180deg, ${theme.sidebarStart} 0%, ${theme.sidebarEnd} 100%)`;
    }

    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader && theme.primary) {
        chatHeader.style.background = theme.primary;
    }
}

function previewTheme() {
    const theme = {
        primary: document.getElementById('theme-primary').value,
        primaryDark: document.getElementById('theme-primaryDark').value,
        accent: document.getElementById('theme-accent').value,
        sidebarStart: document.getElementById('theme-sidebarStart').value,
        sidebarEnd: document.getElementById('theme-sidebarEnd').value
    };
    Object.keys(theme).forEach(k => {
        const el = document.getElementById(`theme-${k}-text`);
        if (el) el.value = theme[k];
    });
    applyTheme(theme);
}

function syncColorFromText(key) {
    const textEl = document.getElementById(`theme-${key}-text`);
    const colorEl = document.getElementById(`theme-${key}`);
    if (!textEl || !colorEl) return;
    const val = textEl.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(val)) {
        colorEl.value = val;
        previewTheme();
    }
}

const PRESETS = {
    default: { primary: '#0d47a1', primaryDark: '#0a3a8a', accent: '#ec4899', sidebarStart: '#0a3a8a', sidebarEnd: '#0d47a1' },
    dark:    { primary: '#1f2937', primaryDark: '#111827', accent: '#6366f1', sidebarStart: '#111827', sidebarEnd: '#1f2937' },
    green:   { primary: '#059669', primaryDark: '#047857', accent: '#f59e0b', sidebarStart: '#047857', sidebarEnd: '#059669' },
    purple:  { primary: '#7c3aed', primaryDark: '#6d28d9', accent: '#ec4899', sidebarStart: '#6d28d9', sidebarEnd: '#7c3aed' },
    red:     { primary: '#dc2626', primaryDark: '#b91c1c', accent: '#f59e0b', sidebarStart: '#b91c1c', sidebarEnd: '#dc2626' },
    teal:    { primary: '#0d9488', primaryDark: '#0f766e', accent: '#f97316', sidebarStart: '#0f766e', sidebarEnd: '#0d9488' },
    orange:  { primary: '#ea580c', primaryDark: '#c2410c', accent: '#0891b2', sidebarStart: '#c2410c', sidebarEnd: '#ea580c' }
};

function applyPreset(name) {
    const p = PRESETS[name];
    if (!p) return;
    document.getElementById('theme-primary').value = p.primary;
    document.getElementById('theme-primaryDark').value = p.primaryDark;
    document.getElementById('theme-accent').value = p.accent;
    document.getElementById('theme-sidebarStart').value = p.sidebarStart;
    document.getElementById('theme-sidebarEnd').value = p.sidebarEnd;
    previewTheme();
}

function loadThemeToForm() {
    if (!currentTheme) return;
    document.getElementById('theme-primary').value = currentTheme.primary || '#0d47a1';
    document.getElementById('theme-primaryDark').value = currentTheme.primaryDark || '#0a3a8a';
    document.getElementById('theme-accent').value = currentTheme.accent || '#ec4899';
    document.getElementById('theme-sidebarStart').value = currentTheme.sidebarStart || '#0a3a8a';
    document.getElementById('theme-sidebarEnd').value = currentTheme.sidebarEnd || '#0d47a1';
    previewTheme();
}

async function saveTheme() {
    const theme = {
        primary: document.getElementById('theme-primary').value,
        primaryDark: document.getElementById('theme-primaryDark').value,
        primaryLight: document.getElementById('theme-primary').value,
        accent: document.getElementById('theme-accent').value,
        sidebarStart: document.getElementById('theme-sidebarStart').value,
        sidebarEnd: document.getElementById('theme-sidebarEnd').value
    };
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST', body: JSON.stringify({ theme })
        });
        const data = await res.json();
        if (data.success) {
            currentTheme = theme;
            alert('✅ Tema disimpan');
        } else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

function resetTheme() {
    if (!confirm('Reset tema ke default?')) return;
    applyPreset('default');
}

// ============================================================
// LOGO SIZE
// ============================================================
function applyLogoSize(size) {
    const s = LOGO_SIZES[size] || LOGO_SIZES.medium;
    const logoIcon = document.getElementById('logoIcon');
    const loginLogo = document.getElementById('loginLogo');
    const sidebarLogo = document.getElementById('sidebarLogo');
    if (logoIcon) { logoIcon.style.width = s.chat + 'px'; logoIcon.style.height = s.chat + 'px'; }
    if (loginLogo) { loginLogo.style.width = s.login + 'px'; loginLogo.style.height = s.login + 'px'; }
    if (sidebarLogo) { sidebarLogo.style.width = s.sidebar + 'px'; sidebarLogo.style.height = s.sidebar + 'px'; }
}

async function changeLogoSize(size) {
    applyLogoSize(size);
    try {
        await adminFetch('/api/admin/config', {
            method: 'POST', body: JSON.stringify({ logoSize: size })
        });
    } catch (err) { console.error(err); }
}

// ============================================================
// LOAD PUBLIC CONFIG
// ============================================================
async function loadPublicConfig() {
    try {
        const res = await fetch('/api/config/public');
        const cfg = await res.json();

        document.getElementById('headerTitle').textContent = cfg.aiName;
        document.getElementById('headerTagline').innerHTML =
            `<i class="fas fa-robot me-1"></i>${cfg.tagline}`;

        const logoHtml = cfg.logoUrl
            ? `<img src="${cfg.logoUrl}" alt="logo">`
            : '<i class="fas fa-robot"></i>';

        document.getElementById('logoIcon').innerHTML = logoHtml;
        document.getElementById('loginLogo').innerHTML = logoHtml;
        document.getElementById('sidebarLogo').innerHTML = logoHtml;
        document.getElementById('loginTitle').textContent = cfg.aiName;
        document.getElementById('sidebarAiName').textContent = cfg.aiName;

        applyLogoSize(cfg.logoSize || 'medium');

        if (cfg.theme) {
            currentTheme = cfg.theme;
            applyTheme(cfg.theme);
            loadThemeToForm();
        }

        if (cfg.logoUrl) {
            let fav = document.querySelector('link[rel="icon"]');
            if (!fav) {
                fav = document.createElement('link');
                fav.rel = 'icon';
                document.head.appendChild(fav);
            }
            fav.href = cfg.logoUrl;
        }

        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML = `
          <div class="bubble bubble-bot">
            <div class="bot-name"><i class="fas fa-robot"></i> ${cfg.aiName}</div>
            <div>${(cfg.welcomeMessage || '').replace(/\n/g, '<br>')}</div>
            <div class="bubble-time">Online</div>
          </div>
        `;

        const qb = document.getElementById('quickButtons');
        qb.innerHTML = '';
        (cfg.quickButtons || []).forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'btn-quick';
            btn.innerHTML = `<i class="fas fa-circle-question me-1"></i> ${b.label}`;
            btn.onclick = () => sendQuickQuestion(b.question);
            qb.appendChild(btn);
        });
    } catch (err) { console.error('Gagal load config:', err); }
}

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
function showPage(page) {
    currentPage = page;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === 'page-' + page);
    });

    const titles = {
        dashboard: 'Dashboard',
        general: 'Umum', logo: 'Logo & Branding', theme: 'Warna Tema',
        providers: 'Provider AI', prompt: 'Prompt AI',
        knowledge: 'Pengetahuan',
        unanswered: 'Pertanyaan Tak Terjawab',
        learning: 'Auto-Learning',
        feedback: 'Feedback & Akurasi',
        memory: 'Memori AI',
        sessions: 'Percakapan',
        notifications: 'Notifikasi',
        backup: 'Backup',
        security: 'Keamanan'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    loadCurrentPage();

    if (window.innerWidth < 992) {
        document.getElementById('adminSidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }
}

function loadCurrentPage() {
    const page = currentPage;
    if (page === 'dashboard') loadDashboard();
    if (page === 'notifications') loadNotifications();
    if (page === 'sessions') loadSessions();
    if (page === 'backup') loadBackups();
    if (page === 'memory') loadMemoryList();
    if (page === 'theme') loadThemeToForm();
    if (page === 'unanswered') loadUnanswered();
    if (page === 'learning') loadLearningQueue();
    if (page === 'feedback') loadFeedback();
}

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

// ============================================================
// FORMAT TEKS AI → HTML RAPI (TANPA **)
// ============================================================
function formatText(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    let html = div.innerHTML;

    html = html.replace(/\*\*(.+?)\*\*/g, '$1');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
    html = html.replace(/^#{1,6}\s+/gm, '');
    html = html.replace(/`([^`]+)`/g, '$1');

    const lines = html.split('\n');
    const out = [];
    let listOpen = false;
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();

        if (line === '') {
            if (listOpen) {
                out.push(`</${listType}>`);
                listOpen = false;
                listType = null;
            }
            out.push('<div class="spacer"></div>');
            continue;
        }

        const bulletMatch = line.match(/^[•\-\*]\s+(.+)$/);
        if (bulletMatch) {
            if (!listOpen || listType !== 'ul') {
                if (listOpen) out.push(`</${listType}>`);
                out.push('<ul class="ai-list">');
                listOpen = true;
                listType = 'ul';
            }
            out.push(`<li>${bulletMatch[1]}</li>`);
            continue;
        }

        const numMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numMatch) {
            if (!listOpen || listType !== 'ol') {
                if (listOpen) out.push(`</${listType}>`);
                out.push('<ol class="ai-list">');
                listOpen = true;
                listType = 'ol';
            }
            out.push(`<li>${numMatch[2]}</li>`);
            continue;
        }

        if (listOpen) {
            out.push(`</${listType}>`);
            listOpen = false;
            listType = null;
        }
        out.push(`<p>${line}</p>`);
    }

    if (listOpen) out.push(`</${listType}>`);

    return out.join('');
}

// ============================================================
// CHAT
// ============================================================
function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    if (window.resetChatInputHeight) window.resetChatInputHeight();
    addMessage(msg, 'user');
    getBotResponse(msg);
}

function sendQuickQuestion(q) {
    addMessage(q, 'user');
    getBotResponse(q);
}

function addMessage(text, sender) {
    const chatBox = document.getElementById('chatBox');
    const bubble = document.createElement('div');
    bubble.className = `bubble bubble-${sender}`;
    if (sender === 'bot') {
        const botName = document.createElement('div');
        botName.className = 'bot-name';
        botName.innerHTML = `<i class="fas fa-robot"></i> SIVT AI`;
        bubble.appendChild(botName);
        const t = document.createElement('div');
        t.textContent = text;
        bubble.appendChild(t);
    } else {
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.textContent = text;
    }
    const time = document.createElement('div');
    time.className = 'bubble-time';
    time.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(time);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
    return bubble;
}

function addEmptyBotMessage() {
    const chatBox = document.getElementById('chatBox');
    const bubble = document.createElement('div');
    bubble.className = 'bubble bubble-bot';
    const botName = document.createElement('div');
    botName.className = 'bot-name';
    botName.innerHTML = `<i class="fas fa-robot"></i> SIVT AI`;
    bubble.appendChild(botName);
    const textNode = document.createElement('div');
    textNode.className = 'stream-text';
    textNode.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    bubble.appendChild(textNode);
    const time = document.createElement('div');
    time.className = 'bubble-time';
    time.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(time);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
    return { bubble, textNode };
}

async function getBotResponse(question) {
    const { bubble, textNode: botTextEl } = addEmptyBotMessage();
    let fullText = '';
    let pendingSuggestions = null;
    let sourceInfo = '';
    let metaInfo = { provider: null, model: null, source: null };
    let isError = false;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: question, sessionId: chatSessionId })
        });
        if (!response.ok || !response.body) throw new Error('Server tidak merespons.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop();
            for (const line of parts) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                let obj;
                try { obj = JSON.parse(jsonStr); } catch (_) { continue; }

                if (obj.sessionId) {
                    chatSessionId = obj.sessionId;
                    localStorage.setItem('sivt_sessionId', chatSessionId);
                }

                if (obj.meta) {
                    if (obj.meta.source === 'memory') {
                        sourceInfo = '<i class="fas fa-brain"></i> dijawab dari memori';
                        metaInfo.source = 'memory';
                    } else if (obj.meta.source === 'redirect') {
                        sourceInfo = '<i class="fas fa-shield-alt"></i> pertanyaan di luar topik';
                        metaInfo.source = 'redirect';
                    } else if (obj.meta.provider) {
                        sourceInfo = `<i class="fas fa-cloud"></i> ${obj.meta.provider} — ${obj.meta.model}`;
                        metaInfo.provider = obj.meta.provider;
                        metaInfo.model = obj.meta.model;
                        metaInfo.source = 'ai';
                    }
                }

                if (obj.delta) {
                    fullText += obj.delta;
                    botTextEl.innerHTML = formatText(fullText);
                    document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
                } else if (obj.needSuggestions) {
                    pendingSuggestions = obj.suggestions;
                } else if (obj.error) {
                    isError = true;
                    botTextEl.textContent = 'Error: ' + obj.error;
                }
            }
        }

        if (sourceInfo && fullText.length > 0) {
            const note = document.createElement('div');
            note.style.cssText = 'font-size: 10px; color: var(--primary); margin-top: 6px; opacity: 0.8;';
            note.innerHTML = sourceInfo;
            bubble.appendChild(note);
        }

        if (!isError && fullText.length > 20 && metaInfo.source !== 'redirect') {
            addFeedbackButtons(bubble, question, fullText, metaInfo);
        }

        if (pendingSuggestions && Array.isArray(pendingSuggestions) && pendingSuggestions.length > 0) {
            showSuggestions(pendingSuggestions);
        }
    } catch (err) {
        isError = true;
        botTextEl.textContent = 'Maaf, terjadi kesalahan: ' + err.message;
    }
}

// ============================================================
// FEEDBACK BUTTONS
// ============================================================
function addFeedbackButtons(bubble, question, answer, meta) {
    const fb = document.createElement('div');
    fb.className = 'feedback-buttons';
    fb.innerHTML = `
        <span class="fb-label">Bermanfaat?</span>
        <button class="fb-btn fb-good" title="Jawaban bagus">
            <i class="fas fa-thumbs-up"></i>
        </button>
        <button class="fb-btn fb-bad" title="Jawaban kurang tepat">
            <i class="fas fa-thumbs-down"></i>
        </button>
    `;

    fb.dataset.question = question;
    fb.dataset.answer = answer.slice(0, 500);

    fb.querySelector('.fb-good').onclick = (e) => sendFeedback(e.target.closest('button'), 'good', fb, meta);
    fb.querySelector('.fb-bad').onclick = (e) => sendFeedback(e.target.closest('button'), 'bad', fb, meta);

    bubble.appendChild(fb);
}

async function sendFeedback(btn, rating, container, meta) {
    const question = container.dataset.question;
    const answer = container.dataset.answer;

    try {
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                answer,
                rating,
                sessionId: chatSessionId,
                provider: meta.provider,
                model: meta.model,
                source: meta.source
            })
        });

        container.innerHTML = rating === 'good'
            ? '<span class="fb-thanks fb-thanks-good"><i class="fas fa-check-circle"></i> Terima kasih!</span>'
            : '<span class="fb-thanks fb-thanks-bad"><i class="fas fa-clipboard-check"></i> Kami akan perbaiki</span>';

        console.log(`[FEEDBACK] ${rating} untuk: "${question.slice(0, 50)}"`);
    } catch (err) {
        console.error('Feedback error:', err);
        container.innerHTML = '<span class="fb-thanks" style="color:var(--danger);">Gagal kirim</span>';
    }
}

function showSuggestions(suggestions) {
    const chatBox = document.getElementById('chatBox');
    const wrap = document.createElement('div');
    wrap.className = 'suggestions-wrap';
    const title = document.createElement('div');
    title.className = 'suggestions-title';
    title.innerHTML = '<i class="fas fa-lightbulb me-1"></i> Mungkin kamu mau tanya salah satu ini:';
    wrap.appendChild(title);
    const list = document.createElement('div');
    list.className = 'suggestions-list';
    suggestions.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = text;
        chip.onclick = () => { addMessage(text, 'user'); getBotResponse(text); };
        list.appendChild(chip);
    });
    wrap.appendChild(list);
    chatBox.appendChild(wrap);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function resetChat() {
    chatSessionId = null;
    localStorage.removeItem('sivt_sessionId');
    loadPublicConfig();
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function showLogin() {
    document.getElementById('chatPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
}

function hideLogin() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('chatPage').style.display = 'flex';
}

async function doLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    errorEl.style.display = 'none';

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            adminToken = data.token;
            currentUser = { username };
            document.getElementById('adminUsername').textContent = username;
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('chatPage').style.display = 'none';
            document.getElementById('adminPage').style.display = 'block';
            await loadAdminConfig();
            showPage('dashboard');
            setInterval(loadNotificationsBadge, 30000);
        } else {
            errorEl.textContent = data.message || 'Login gagal';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Error: ' + err.message;
        errorEl.style.display = 'block';
    }
}

async function doLogout() {
    if (!confirm('Logout dari admin?')) return;
    try { await adminFetch('/api/admin/logout', { method: 'POST' }); } catch (_) {}
    currentUser = null; adminToken = null;
    document.getElementById('adminPage').style.display = 'none';
    document.getElementById('chatPage').style.display = 'flex';
    document.getElementById('loginPage').style.display = 'none';
}

function showChat() {
    document.getElementById('adminPage').style.display = 'none';
    document.getElementById('chatPage').style.display = 'flex';
}

function adminFetch(url, opts = {}) {
    return fetch(url, {
        ...opts,
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            ...(opts.headers || {})
        }
    });
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
    try {
        const res = await adminFetch('/api/admin/dashboard/stats');
        const data = await res.json();

        document.getElementById('dashAiName').textContent = data.aiName || 'SIVT AI';

        const uptime = data.uptime || 0;
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        document.getElementById('dashUptime').textContent = h > 0 ? `${h}j ${m}m` : `${m}m`;

        document.getElementById('statProviders').textContent = data.providers.total;
        document.getElementById('statProvidersSub').textContent =
            `${data.providers.active} aktif, ${data.providers.inactive} off`;

        document.getElementById('statKnowledge').textContent = data.knowledge.chunks;
        document.getElementById('statKnowledgeSub').textContent =
            `${data.knowledge.files} file, ${data.knowledge.topics} topik`;

        document.getElementById('statMemory').textContent = data.memory.total;
        document.getElementById('statMemorySub').textContent =
            `${data.memory.totalHits} total hit`;

        document.getElementById('statSessions').textContent = data.sessions.total;
        document.getElementById('statSessionsSub').textContent =
            `${data.sessions.messages} pesan`;

        document.getElementById('statUnanswered').textContent = data.unanswered.pending;
        document.getElementById('statUnansweredSub').textContent =
            `${data.unanswered.resolved} sudah dijawab`;

        document.getElementById('statNotif').textContent = data.notifications.unread;
        document.getElementById('statNotifSub').textContent =
            `dari ${data.notifications.total} total`;

        const statFeedback = document.getElementById('statFeedback');
        if (statFeedback && data.feedback) {
            statFeedback.textContent = data.feedback.satisfactionRate + '%';
            document.getElementById('statFeedbackSub').textContent =
                `${data.feedback.good} 👍 / ${data.feedback.bad} 👎`;
        }

        const statAccuracy = document.getElementById('statAccuracy');
        if (statAccuracy && data.analytics) {
            statAccuracy.textContent = data.analytics.accuracyRate + '%';
            document.getElementById('statAccuracySub').textContent =
                `${data.analytics.totalRefusals} penolakan`;
        }

        renderChart(data.sessions.daily);
        renderProviderStatus(data.providers.list);
        renderLearningHighlight(data.learning);
    } catch (err) {
        console.error('Gagal load dashboard:', err);
    }
}

function renderChart(daily) {
    const el = document.getElementById('chartWrap');
    if (!el) return;
    if (!daily || daily.length === 0) {
        el.innerHTML = '<div class="empty-state">Belum ada data</div>';
        return;
    }
    const max = Math.max(...daily.map(d => d.sessions), 1);
    let html = '<div class="chart-bars">';
    daily.forEach(d => {
        const height = (d.sessions / max) * 100;
        html += `
            <div class="chart-bar-wrap" title="${d.date}: ${d.sessions} sesi">
                <div class="chart-bar-value">${d.sessions}</div>
                <div class="chart-bar" style="height: ${Math.max(height, 5)}%"></div>
                <div class="chart-bar-label">${d.day}</div>
            </div>
        `;
    });
    html += '</div>';
    el.innerHTML = html;
}

function renderProviderStatus(list) {
    const el = document.getElementById('providerStatusList');
    if (!el) return;
    if (!list || list.length === 0) {
        el.innerHTML = '<div class="empty-state">Belum ada provider</div>';
        return;
    }
    let html = '';
    list.forEach(p => {
        const badge = p.enabled
            ? '<span class="badge badge-success">✓</span>'
            : '<span class="badge badge-secondary">✗</span>';
        html += `
            <div class="provider-status-item">
                <div class="provider-status-name">
                    ${badge} <strong>${p.name}</strong>
                </div>
                <div class="provider-status-meta">${p.models} model</div>
            </div>
        `;
    });
    el.innerHTML = html;
}

function renderLearningHighlight(learning) {
    const el = document.getElementById('learningHighlight');
    if (!el || !learning) return;
    if (learning.pending === 0) {
        el.innerHTML = '<div class="empty-state">Tidak ada pertanyaan pending ✅</div>';
        return;
    }
    el.innerHTML = `
        <div class="learning-highlight-content">
            <div class="learning-stat-big">${learning.pending}</div>
            <div class="learning-stat-label">Pertanyaan perlu diperhatikan</div>
            <div class="learning-stat-breakdown">
                ${learning.urgent > 0 ? `<span class="badge badge-danger">${learning.urgent} urgent</span>` : ''}
                ${learning.high > 0 ? `<span class="badge badge-warning">${learning.high} tinggi</span>` : ''}
                ${learning.medium > 0 ? `<span class="badge badge-primary">${learning.medium} sedang</span>` : ''}
            </div>
            <button class="btn-primary-lg" style="margin-top:14px;" onclick="showPage('learning')">
                <i class="fas fa-arrow-right"></i> Lihat Learning Queue
            </button>
        </div>
    `;
}

// ============================================================
// NOTIFIKASI DROPDOWN
// ============================================================
function toggleNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    const isOpen = dropdown.classList.contains('show');
    if (isOpen) {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
        loadNotificationsDropdown();
    }
}

async function loadNotificationsBadge() {
    try {
        const res = await adminFetch('/api/admin/notifications');
        const data = await res.json();
        const badge = document.getElementById('notifBadge');
        if (data.unread > 0) {
            badge.textContent = data.unread > 99 ? '99+' : data.unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) { /* silent */ }
}

async function loadNotificationsDropdown() {
    const body = document.getElementById('notifBody');
    body.innerHTML = '<div class="notif-empty"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>';
    try {
        const res = await adminFetch('/api/admin/notifications');
        const data = await res.json();

        const badge = document.getElementById('notifBadge');
        if (data.unread > 0) {
            badge.textContent = data.unread > 99 ? '99+' : data.unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        if (!data.items || data.items.length === 0) {
            body.innerHTML = '<div class="notif-empty">Belum ada notifikasi</div>';
            return;
        }

        let html = '';
        data.items.slice(0, 10).forEach(n => {
            const date = timeAgo(n.timestamp);
            const icon = n.level === 'danger' ? 'exclamation-triangle' :
                         (n.level === 'warning' ? 'exclamation-circle' : 'info-circle');
            html += `
                <div class="notif-dropdown-item notif-${n.level} ${n.read ? 'notif-read' : ''}">
                    <div class="notif-dropdown-icon"><i class="fas fa-${icon}"></i></div>
                    <div class="notif-dropdown-content">
                        <div class="notif-dropdown-title">${n.title}</div>
                        <div class="notif-dropdown-msg">${n.message.slice(0, 80)}</div>
                        <div class="notif-dropdown-time">${date}</div>
                    </div>
                </div>
            `;
        });
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = '<div class="notif-empty text-danger">Gagal memuat</div>';
    }
}

function timeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Baru saja';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} menit lalu`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} jam lalu`;
    const day = Math.floor(hour / 24);
    return `${day} hari lalu`;
}

// ============================================================
// LOAD ADMIN CONFIG
// ============================================================
async function loadAdminConfig() {
    try {
        const res = await adminFetch('/api/admin/config');
        const cfg = await res.json();

        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        setVal('cfg-aiName', cfg.aiName);
        setVal('cfg-tagline', cfg.tagline);
        setVal('cfg-welcomeMessage', cfg.welcomeMessage);
        setVal('cfg-contact-address', cfg.contactInfo?.address);
        setVal('cfg-contact-phone', cfg.contactInfo?.phone);
        setVal('cfg-contact-whatsapp', cfg.contactInfo?.whatsapp);
        setVal('cfg-contact-email', cfg.contactInfo?.email);
        setVal('cfg-contact-hours', cfg.contactInfo?.hours);
        setVal('cfg-systemInstruction', cfg.systemInstruction);

        const cb = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
        cb('memoryEnabled', cfg.memoryEnabled !== false);
        cb('convEnabled', cfg.conversationHistoryEnabled !== false);

        setVal('memoryMinScore', cfg.memoryMinScore || 60);
        setVal('memorySaveThreshold', cfg.memorySaveThreshold || 40);
        setVal('convSize', cfg.conversationHistorySize || 10);
        setVal('rateLimitPerSession', cfg.rateLimitPerSession || 20);

        updateLogoPreview(cfg.logoUrl);
        const sizeRadio = document.querySelector(`input[name="logoSize"][value="${cfg.logoSize || 'medium'}"]`);
        if (sizeRadio) sizeRadio.checked = true;

        const setBadge = (id, v) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = v;
                el.style.display = v > 0 ? 'inline-flex' : 'none';
            }
        };

        setBadge('badgeProviders', (cfg.providers || []).length);
        setBadge('badgeKnowledge', cfg.knowledgeChunks || 0);
        setBadge('badgeMemory', cfg.memoryCount || 0);
        setBadge('badgeSessions', cfg.sessionCount || 0);

        const badgeUnanswered = document.getElementById('badgeUnanswered');
        if (badgeUnanswered) {
            badgeUnanswered.textContent = cfg.pendingUnanswered || 0;
            badgeUnanswered.style.display = (cfg.pendingUnanswered || 0) > 0 ? 'inline-flex' : 'none';
        }

        const badgeLearning = document.getElementById('badgeLearning');
        if (badgeLearning) {
            badgeLearning.textContent = cfg.pendingLearning || 0;
            badgeLearning.style.display = (cfg.pendingLearning || 0) > 0 ? 'inline-flex' : 'none';
        }

        renderProviders(cfg.providers || []);
        renderKnowledgeFiles(cfg.knowledgeFiles || [], cfg.knowledgeChunks || 0);
    } catch (err) { console.error('Gagal load config:', err); }
}

// ============================================================
// PROVIDER MODE SWITCH (BUILT-IN vs CUSTOM)
// ============================================================
function switchProviderMode(mode) {
    currentProviderMode = mode;
    document.querySelectorAll('#page-providers .filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    const builtIn = document.getElementById('providerMode-builtin');
    const custom = document.getElementById('providerMode-custom');
    if (builtIn) builtIn.style.display = mode === 'builtin' ? 'block' : 'none';
    if (custom) custom.style.display = mode === 'custom' ? 'block' : 'none';
}

// ============================================================
// PROVIDERS LIST
// ============================================================
function renderProviders(providers) {
    const el = document.getElementById('providersList');
    if (!el) return;
    if (providers.length === 0) {
        el.innerHTML = '<div class="empty-state">Belum ada provider. Tambahkan API key di atas.</div>';
        return;
    }

    let html = '<div class="table-wrap"><table class="data-table"><thead><tr>';
    html += '<th>#</th><th>Provider</th><th>Model</th><th>API Key</th><th>Status</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';

    providers.forEach(p => {
        const statusBadge = p.enabled
            ? '<span class="badge badge-success">✓ Aktif</span>'
            : '<span class="badge badge-secondary">✗ Off</span>';

        const customTag = p.isCustom
            ? ' <span class="badge badge-warning" style="font-size:9px;">CUSTOM</span>'
            : '';

        html += `<tr>
            <td>${p.index + 1}</td>
            <td><strong>${p.displayName}</strong>${customTag}</td>
            <td style="font-size:11px"><code>${(p.models || []).join(', ')}</code></td>
            <td><code>${p.masked}</code></td>
            <td>${statusBadge}</td>
            <td style="white-space:nowrap">
                <button class="btn-icon-sm btn-info" onclick="testProvider(${p.index})" title="Test Koneksi"><i class="fas fa-vial"></i></button>
                <button class="btn-icon-sm btn-primary" onclick="editProviderModels(${p.index}, '${(p.models || []).join(',')}')" title="Edit Model"><i class="fas fa-edit"></i></button>
                <button class="btn-icon-sm btn-warning" onclick="editProviderKey(${p.index})" title="Edit API Key"><i class="fas fa-key"></i></button>
                <button class="btn-icon-sm btn-secondary" onclick="toggleProvider(${p.index})" title="On/Off"><i class="fas fa-power-off"></i></button>
                <button class="btn-icon-sm btn-danger" onclick="removeProvider(${p.index})" title="Hapus"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
}


// ============================================================
// ADD PROVIDER (Support Built-in & Custom)
// ============================================================
async function addProvider() {
    const isCustom = currentProviderMode === 'custom';

    let payload;
    if (isCustom) {
        const name = document.getElementById('customProviderName').value.trim();
        const displayName = document.getElementById('customProviderDisplay').value.trim();
        const endpoint = document.getElementById('customProviderEndpoint').value.trim();
        const apiKey = document.getElementById('customProviderKey').value.trim();
        const modelsRaw = document.getElementById('customProviderModels').value.trim();

        if (!name) return alert('Nama provider wajib diisi');
        if (!endpoint) return alert('Custom Endpoint wajib diisi');
        if (!apiKey) return alert('API Key wajib diisi');

        const models = modelsRaw ? modelsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (models.length === 0) return alert('Minimal 1 model wajib diisi');

        payload = { name, apiKey, models, customEndpoint: endpoint, displayName };
    } else {
        const name = document.getElementById('newProviderName').value;
        const apiKey = document.getElementById('newProviderKey').value.trim();
        const modelsRaw = document.getElementById('newProviderModels').value.trim();

        if (!apiKey) return alert('API key harus diisi');

        const models = modelsRaw ? modelsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        payload = { name, apiKey, models };
    }

    const status = document.getElementById('addProviderStatus');
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menambahkan...';

    try {
        const res = await adminFetch('/api/admin/providers/add', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            status.innerHTML = '<span class="text-success">✅ Ditambahkan. Total: ' + data.total + '</span>';
            document.getElementById('newProviderKey').value = '';
            document.getElementById('newProviderModels').value = '';
            document.getElementById('customProviderName').value = '';
            document.getElementById('customProviderDisplay').value = '';
            document.getElementById('customProviderEndpoint').value = '';
            document.getElementById('customProviderKey').value = '';
            document.getElementById('customProviderModels').value = '';
            loadAdminConfig();
        } else {
            status.innerHTML = '<span class="text-danger">' + data.message + '</span>';
        }
    } catch (err) {
        status.innerHTML = '<span class="text-danger">' + err.message + '</span>';
    }
}

// ============================================================
// EDIT API KEY
// ============================================================
async function editProviderKey(index) {
    const input = prompt('Masukkan API key baru untuk provider ini:');
    if (!input || input.trim().length < 5) return alert('API key tidak valid');

    try {
        const res = await adminFetch('/api/admin/providers/update-key', {
            method: 'POST',
            body: JSON.stringify({ index, apiKey: input.trim() })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ API key diperbarui');
            loadAdminConfig();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) { alert(err.message); }
}

// ============================================================
// EDIT MODEL PROVIDER
// ============================================================
async function editProviderModels(index, currentModels) {
    const input = prompt('Edit model provider (pisah dengan koma):', currentModels);
    if (input === null) return;
    const models = input.split(',').map(s => s.trim()).filter(Boolean);
    if (models.length === 0) return alert('Minimal 1 model');

    try {
        const res = await adminFetch('/api/admin/providers/update-models', {
            method: 'POST', body: JSON.stringify({ index, models })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Model diperbarui');
            loadAdminConfig();
        } else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

// ============================================================
// REMOVE / TOGGLE / TEST PROVIDER
// ============================================================
async function removeProvider(index) {
    if (!confirm('Hapus provider ini?')) return;
    try {
        const res = await adminFetch('/api/admin/providers/remove', {
            method: 'POST', body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (data.success) loadAdminConfig(); else alert(data.message);
    } catch (err) { alert(err.message); }
}

async function toggleProvider(index) {
    try {
        const res = await adminFetch('/api/admin/providers/toggle', {
            method: 'POST', body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (data.success) {
            loadAdminConfig();
            loadNotificationsBadge();
        } else alert(data.message);
    } catch (err) { alert(err.message); }
}

async function testProvider(index) {
    try {
        const res = await adminFetch('/api/admin/providers/test', {
            method: 'POST', body: JSON.stringify({ index })
        });
        const data = await res.json();
        alert(data.success ? '✅ ' + data.message : '❌ ' + data.message);
    } catch (err) { alert('Error: ' + err.message); }
}

// ============================================================
// UNANSWERED QUESTIONS
// ============================================================
function filterUnanswered(filter) {
    currentUnansweredFilter = filter;
    document.querySelectorAll('#page-unanswered .filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    loadUnanswered();
}

async function loadUnanswered() {
    const el = document.getElementById('unansweredList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        const res = await adminFetch(`/api/admin/unanswered?filter=${currentUnansweredFilter}`);
        const data = await res.json();

        document.getElementById('filterPendingCount').textContent = data.pending;
        document.getElementById('filterResolvedCount').textContent = data.resolved;
        document.getElementById('filterAllCount').textContent = data.total;

        const badge = document.getElementById('badgeUnanswered');
        if (badge) {
            badge.textContent = data.pending;
            badge.style.display = data.pending > 0 ? 'inline-flex' : 'none';
        }

        if (!data.items || data.items.length === 0) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle" style="font-size:32px; color:var(--success); margin-bottom:8px;"></i><br>Tidak ada pertanyaan yang cocok dengan filter.</div>';
            return;
        }

        let html = '';
        data.items.forEach(u => {
            const date = new Date(u.lastAsked).toLocaleString('id-ID');
            const isResolved = u.resolved;
            const countBadge = u.count > 1
                ? `<span class="badge badge-warning">Ditanya ${u.count}x</span>`
                : '';

            const safeQuestion = u.question.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/'/g, "\\'");

            html += `
                <div class="unanswered-item ${isResolved ? 'unanswered-resolved' : ''}">
                    <div class="unanswered-head">
                        <div class="unanswered-icon">
                            <i class="fas fa-${isResolved ? 'check-circle' : 'question-circle'}"></i>
                        </div>
                        <div class="unanswered-question">${u.question}</div>
                        <div class="unanswered-badges">
                            ${countBadge}
                            ${isResolved ? '<span class="badge badge-success">✓ Sudah</span>' : '<span class="badge badge-danger">Belum</span>'}
                        </div>
                    </div>
                    <div class="unanswered-meta">
                        <i class="fas fa-clock"></i> Terakhir ditanya: ${date}
                    </div>
                    <div class="unanswered-actions">
                        ${!isResolved ? `
                            <button class="btn-primary-lg btn-sm" onclick="openAnswerModal('${u.id}', '${safeQuestion}', 'unanswered')">
                                <i class="fas fa-plus-circle"></i> Tambah Jawaban
                            </button>
                            <button class="btn-secondary btn-sm" onclick="markUnansweredResolved('${u.id}')">
                                <i class="fas fa-check"></i> Tandai Sudah
                            </button>
                        ` : ''}
                        <button class="btn-danger-outline btn-sm" onclick="deleteUnanswered('${u.id}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal load: ${err.message}</div>`;
    }
}

async function markUnansweredResolved(id) {
    try {
        const res = await adminFetch('/api/admin/unanswered/resolve', {
            method: 'POST', body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) { loadUnanswered(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

async function deleteUnanswered(id) {
    if (!confirm('Hapus pertanyaan ini dari daftar?')) return;
    try {
        const res = await adminFetch('/api/admin/unanswered/delete', {
            method: 'POST', body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) { loadUnanswered(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

async function clearResolvedUnanswered() {
    if (!confirm('Hapus semua pertanyaan yang sudah dijawab?')) return;
    try {
        const res = await adminFetch('/api/admin/unanswered/clear', {
            method: 'POST', body: JSON.stringify({ onlyResolved: true })
        });
        const data = await res.json();
        if (data.success) { loadUnanswered(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

// ============================================================
// LEARNING QUEUE
// ============================================================
function filterLearning(filter) {
    currentLearningFilter = filter;
    document.querySelectorAll('#page-learning .filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    loadLearningQueue();
}

async function loadLearningQueue() {
    const el = document.getElementById('learningList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        const res = await adminFetch(`/api/admin/learning/queue?filter=${currentLearningFilter}`);
        const data = await res.json();

        const stats = data.stats || {};

        const setText = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        setText('learningTotal', stats.total || 0);
        setText('learningPending', stats.pending || 0);
        setText('learningResolved', stats.resolved || 0);
        setText('learningUrgent', stats.urgent || 0);

        const setCount = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        setCount('learningFilterPendingCount', stats.pending || 0);
        setCount('learningFilterUrgentCount', stats.urgent || 0);
        setCount('learningFilterHighCount', (stats.urgent || 0) + (stats.high || 0));
        setCount('learningFilterAllCount', stats.total || 0);

        const badge = document.getElementById('badgeLearning');
        if (badge) {
            badge.textContent = stats.pending || 0;
            badge.style.display = (stats.pending || 0) > 0 ? 'inline-flex' : 'none';
        }

        if (!data.items || data.items.length === 0) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle" style="font-size:32px; color:var(--success); margin-bottom:8px;"></i><br>Tidak ada antrian belajar. AI Anda sudah pintar! 🎉</div>';
            return;
        }

        let html = '';
        data.items.forEach(item => {
            const date = new Date(item.lastAsked).toLocaleString('id-ID');
            const priorityClass = `priority-${item.priority}`;
            const priorityLabel = {
                urgent: '🚨 URGENT',
                high: '⚠️ TINGGI',
                medium: '📌 SEDANG',
                normal: 'ℹ️ NORMAL'
            }[item.priority] || 'NORMAL';

            const variants = (item.variants || []).slice(0, 3).map(v =>
                `<div class="variant-item"><i class="fas fa-quote-right"></i> ${v}</div>`
            ).join('');

            const safeQuestion = (item.original || item.question)
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/'/g, "\\'");

            html += `
                <div class="learning-item ${priorityClass} ${item.resolved ? 'learning-resolved' : ''}">
                    <div class="learning-head">
                        <div class="learning-priority">${priorityLabel}</div>
                        <div class="learning-count">
                            <i class="fas fa-fire"></i> ${item.count}x ditanya
                        </div>
                    </div>
                    <div class="learning-question">
                        <i class="fas fa-question-circle"></i> ${item.question}
                    </div>
                    ${variants ? `
                        <div class="learning-variants">
                            <div class="variant-label">Variasi pertanyaan:</div>
                            ${variants}
                        </div>
                    ` : ''}
                    <div class="learning-meta">
                        <i class="fas fa-clock"></i> Pertama: ${new Date(item.firstAsked).toLocaleDateString('id-ID')}
                        • Terakhir: ${date}
                    </div>
                    <div class="unanswered-actions">
                        ${!item.resolved ? `
                            <button class="btn-primary-lg btn-sm" onclick="openAnswerModal('${item.id}', '${safeQuestion}', 'learning')">
                                <i class="fas fa-plus-circle"></i> Tambah ke Pengetahuan
                            </button>
                            <button class="btn-secondary btn-sm" onclick="resolveLearning('${item.id}')">
                                <i class="fas fa-check"></i> Tandai Selesai
                            </button>
                        ` : `
                            <span class="badge badge-success">✓ Sudah ditangani</span>
                        `}
                        <button class="btn-danger-outline btn-sm" onclick="deleteLearning('${item.id}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal load: ${err.message}</div>`;
    }
}

async function resolveLearning(id) {
    try {
        const res = await adminFetch('/api/admin/learning/resolve', {
            method: 'POST', body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) { loadLearningQueue(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

async function deleteLearning(id) {
    if (!confirm('Hapus pertanyaan ini dari antrian belajar?')) return;
    try {
        const res = await adminFetch('/api/admin/learning/delete', {
            method: 'POST', body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) { loadLearningQueue(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

async function clearResolvedLearning() {
    if (!confirm('Hapus semua pertanyaan yang sudah diselesaikan?')) return;
    try {
        const res = await adminFetch('/api/admin/learning/clear-resolved', { method: 'POST' });
        const data = await res.json();
        if (data.success) { loadLearningQueue(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

async function clearAllLearning() {
    if (!confirm('⚠️ HAPUS SEMUA antrian belajar?')) return;
    if (!confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
        const res = await adminFetch('/api/admin/learning/clear-all', { method: 'POST' });
        const data = await res.json();
        if (data.success) { loadLearningQueue(); loadAdminConfig(); }
    } catch (err) { alert(err.message); }
}

// ============================================================
// FEEDBACK
// ============================================================
function filterFeedback(filter) {
    currentFeedbackFilter = filter;
    document.querySelectorAll('#page-feedback .filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    loadFeedback();
}

async function loadFeedback() {
    try {
        const statsRes = await adminFetch('/api/admin/feedback/stats');
        const stats = await statsRes.json();

        const setText = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        setText('fbTotal', stats.feedback?.total || 0);
        setText('fbGood', stats.feedback?.good || 0);
        setText('fbBad', stats.feedback?.bad || 0);
        setText('fbSatisfaction', (stats.feedback?.satisfactionRate || 0) + '%');

        setText('anTotalChats', stats.analytics?.totalChats || 0);
        setText('anTotalAnswers', stats.analytics?.totalAnswers || 0);
        setText('anRefusals', stats.analytics?.totalRefusals || 0);
        setText('anAccuracy', (stats.analytics?.accuracyRate || 0) + '%');
        setText('anMemoryHits', stats.analytics?.totalMemoryHits || 0);
        setText('anRagHits', stats.analytics?.totalRagHits || 0);
        setText('anOutOfScope', stats.analytics?.totalOutOfScope || 0);

        renderFeedbackChart(stats.dailyStats);
    } catch (err) {
        console.error('Gagal load feedback stats:', err);
    }

    const el = document.getElementById('feedbackList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        let endpoint = '/api/admin/feedback/list';
        if (currentFeedbackFilter === 'good') endpoint = '/api/admin/feedback/good';
        if (currentFeedbackFilter === 'bad') endpoint = '/api/admin/feedback/bad';

        const res = await adminFetch(endpoint);
        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            el.innerHTML = '<div class="empty-state">Belum ada feedback.</div>';
            return;
        }

        let html = '';
        data.items.forEach(f => {
            const date = new Date(f.timestamp).toLocaleString('id-ID');
            const icon = f.rating === 'good' ? 'thumbs-up' : 'thumbs-down';
            const badgeClass = f.rating === 'good' ? 'badge-success' : 'badge-danger';

            html += `
                <div class="feedback-item feedback-${f.rating}">
                    <div class="feedback-head">
                        <div class="feedback-icon">
                            <i class="fas fa-${icon}"></i>
                        </div>
                        <div class="feedback-question">${f.question}</div>
                        <span class="badge ${badgeClass}">${f.rating === 'good' ? '👍 Bagus' : '👎 Kurang'}</span>
                    </div>
                    <div class="feedback-answer">
                        <div class="feedback-label">Jawaban AI:</div>
                        <div class="feedback-answer-text">${f.answer}</div>
                    </div>
                    <div class="feedback-meta">
                        <i class="fas fa-clock"></i> ${date}
                        ${f.provider ? ` • <i class="fas fa-cloud"></i> ${f.provider}` : ''}
                        ${f.source ? ` • <i class="fas fa-tag"></i> ${f.source}` : ''}
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal load: ${err.message}</div>`;
    }
}

function renderFeedbackChart(dailyStats) {
    const el = document.getElementById('feedbackChart');
    if (!el || !dailyStats) return;

    const days = Object.keys(dailyStats).sort().slice(-7);
    if (days.length === 0) {
        el.innerHTML = '<div class="empty-state">Belum ada data</div>';
        return;
    }

    const max = Math.max(...days.map(d => dailyStats[d].chats || 0), 1);
    let html = '<div class="chart-bars">';
    days.forEach(day => {
        const stats = dailyStats[day];
        const total = stats.chats || 0;
        const good = stats.good || 0;
        const bad = stats.bad || 0;
        const height = (total / max) * 100;

        html += `
            <div class="chart-bar-wrap" title="${day}: ${total} chat">
                <div class="chart-bar-value">${total}</div>
                <div class="chart-bar chart-bar-multi" style="height: ${Math.max(height, 5)}%">
                    <div class="bar-good" style="height: ${total > 0 ? (good/total)*100 : 0}%"></div>
                    <div class="bar-bad" style="height: ${total > 0 ? (bad/total)*100 : 0}%"></div>
                </div>
                <div class="chart-bar-label">${day.slice(5)}</div>
            </div>
        `;
    });
    html += '</div>';
    html += '<div class="chart-legend">' +
            '<span class="legend-item"><span class="legend-dot legend-good"></span> Bagus</span>' +
            '<span class="legend-item"><span class="legend-dot legend-bad"></span> Kurang</span>' +
            '</div>';
    el.innerHTML = html;
}

async function clearFeedback() {
    if (!confirm('Hapus semua data feedback?')) return;
    try {
        await adminFetch('/api/admin/feedback/clear', { method: 'POST', body: JSON.stringify({}) });
        loadFeedback();
    } catch (err) { alert(err.message); }
}

async function clearAnalytics() {
    if (!confirm('Reset semua data analytics?')) return;
    try {
        await adminFetch('/api/admin/feedback/clear', { method: 'POST', body: JSON.stringify({ analytics: true }) });
        loadFeedback();
    } catch (err) { alert(err.message); }
}

// ============================================================
// MODAL ANSWER
// ============================================================
function openAnswerModal(id, question, source) {
    document.getElementById('modal-id').value = id;
    document.getElementById('modal-question').value = question;
    document.getElementById('modal-answer').value = '';
    document.getElementById('modal-category').value = '';
    document.getElementById('modal-source').value = source;
    document.getElementById('answerModal').classList.add('show');
    setTimeout(() => document.getElementById('modal-answer').focus(), 100);
}

function closeAnswerModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('answerModal').classList.remove('show');
}

async function submitAnswerToKnowledge() {
    const id = document.getElementById('modal-id').value;
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value.trim();
    const category = document.getElementById('modal-category').value.trim();
    const source = document.getElementById('modal-source').value;

    if (!answer) return alert('Jawaban tidak boleh kosong');
    if (answer.length < 20) return alert('Jawaban minimal 20 karakter');

    const endpoint = source === 'learning'
        ? '/api/admin/learning/add-to-knowledge'
        : '/api/admin/unanswered/add-to-knowledge';

    try {
        const res = await adminFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({ id, question, answer, category })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ ' + data.message);
            closeAnswerModal();
            if (source === 'learning') loadLearningQueue();
            else loadUnanswered();
            loadAdminConfig();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) { alert(err.message); }
}

// ============================================================
// LOGO
// ============================================================
function updateLogoPreview(url) {
    const box = document.getElementById('logoPreviewBox');
    if (!box) return;
    if (url) {
        box.innerHTML = `<img src="${url}" alt="Logo">`;
    } else {
        box.innerHTML = `<div class="logo-placeholder">
            <i class="fas fa-image"></i>
            <span>Belum ada logo</span>
        </div>`;
    }
}

async function uploadLogo() {
    const fileInput = document.getElementById('logoFile');
    const status = document.getElementById('logoStatus');
    if (!fileInput.files[0]) return;

    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';

    try {
        const res = await fetch('/api/admin/logo/upload', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            status.innerHTML = '<span class="text-success">✅ Logo diupload!</span>';
            updateLogoPreview(data.logoUrl);
            await loadPublicConfig();
            loadAdminConfig();
        } else {
            status.innerHTML = '<span class="text-danger">❌ ' + data.message + '</span>';
        }
    } catch (err) {
        status.innerHTML = '<span class="text-danger">' + err.message + '</span>';
    }
    fileInput.value = '';
}

async function deleteLogo() {
    if (!confirm('Hapus logo?')) return;
    const status = document.getElementById('logoStatus');
    try {
        const res = await adminFetch('/api/admin/logo/delete', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            status.innerHTML = '<span class="text-success">✅ Logo dihapus</span>';
            updateLogoPreview('');
            await loadPublicConfig();
            loadAdminConfig();
        } else {
            status.innerHTML = '<span class="text-danger">❌ ' + data.message + '</span>';
        }
    } catch (err) {
        status.innerHTML = '<span class="text-danger">' + err.message + '</span>';
    }
}

// ============================================================
// GENERAL
// ============================================================
async function saveGeneral() {
    const updates = {
        aiName: document.getElementById('cfg-aiName').value.trim(),
        tagline: document.getElementById('cfg-tagline').value.trim(),
        welcomeMessage: document.getElementById('cfg-welcomeMessage').value,
        contactInfo: {
            address: document.getElementById('cfg-contact-address').value.trim(),
            phone: document.getElementById('cfg-contact-phone').value.trim(),
            whatsapp: document.getElementById('cfg-contact-whatsapp').value.trim(),
            email: document.getElementById('cfg-contact-email').value.trim(),
            hours: document.getElementById('cfg-contact-hours').value.trim()
        }
    };
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST', body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Pengaturan disimpan');
            await loadPublicConfig();
        } else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

async function savePrompt() {
    const systemInstruction = document.getElementById('cfg-systemInstruction').value;
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST', body: JSON.stringify({ systemInstruction })
        });
        const data = await res.json();
        if (data.success) alert('✅ Prompt disimpan'); else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

// ============================================================
// KNOWLEDGE
// ============================================================
function renderKnowledgeFiles(files, chunks) {
    const el = document.getElementById('knowledgeFilesList');
    if (!el) return;
    if (files.length === 0) {
        el.innerHTML = '<div class="empty-state">Belum ada file pengetahuan</div>';
        return;
    }
    let html = `<p class="text-muted small">Total ${chunks} chunk aktif</p>`;
    html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>Nama</th><th>Ukuran</th><th>Aksi</th></tr></thead><tbody>';
    files.forEach(f => {
        html += `<tr>
            <td>${f.name}</td>
            <td>${(f.size / 1024).toFixed(1)} KB</td>
            <td><button class="btn-icon-sm btn-danger" onclick="deleteKnowledge('${f.name}')"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
}

async function uploadKnowledge() {
    const fileInput = document.getElementById('knowledgeFile');
    if (!fileInput.files[0]) return alert('Pilih file dulu');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    const status = document.getElementById('uploadStatus');
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';
    try {
        const res = await fetch('/api/admin/knowledge/upload', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            status.innerHTML = '<span class="text-success">✅ ' + data.message + '</span>';
            fileInput.value = '';
            loadAdminConfig();
        } else {
            status.innerHTML = '<span class="text-danger">❌ ' + data.message + '</span>';
        }
    } catch (err) {
        status.innerHTML = '<span class="text-danger">' + err.message + '</span>';
    }
}

async function deleteKnowledge(name) {
    if (!confirm(`Hapus file ${name}?`)) return;
    try {
        const res = await adminFetch('/api/admin/knowledge/delete', {
            method: 'POST', body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) loadAdminConfig(); else alert(data.message);
    } catch (err) { alert(err.message); }
}

async function reloadKnowledge() {
    try {
        const res = await adminFetch('/api/admin/knowledge/reload', { method: 'POST' });
        const data = await res.json();
        alert(`✅ Reload selesai. Total ${data.chunks} chunk.`);
        loadAdminConfig();
    } catch (err) { alert(err.message); }
}

// ============================================================
// MEMORY
// ============================================================
async function loadMemoryList() {
    const el = document.getElementById('memoryList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const res = await adminFetch('/api/admin/memory');
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
            el.innerHTML = '<div class="empty-state">Belum ada memori.</div>';
            return;
        }
        let html = '';
        data.items.forEach((m, i) => {
            const date = new Date(m.timestamp).toLocaleString('id-ID');
            html += `
                <div class="memory-item">
                    <div class="memory-head">
                        <span class="memory-date"><i class="fas fa-clock"></i> ${date}</span>
                        <span class="badge badge-primary">Hit: ${m.hit}</span>
                        <button class="btn-icon-sm btn-danger" onclick="deleteMemory(${i})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="memory-question"><i class="fas fa-question-circle"></i> ${m.question}</div>
                    <div class="memory-answer">${m.answer}</div>
                </div>
            `;
        });
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal load: ${err.message}</div>`;
    }
}

async function deleteMemory(index) {
    if (!confirm('Hapus memori ini?')) return;
    try {
        const res = await adminFetch('/api/admin/memory/delete', {
            method: 'POST', body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (data.success) { loadMemoryList(); loadAdminConfig(); }
        else alert(data.message);
    } catch (err) { alert(err.message); }
}

async function clearMemory() {
    if (!confirm('HAPUS SEMUA MEMORI AI?')) return;
    if (!confirm('Yakin?')) return;
    try {
        const res = await adminFetch('/api/admin/memory/clear', { method: 'POST' });
        const data = await res.json();
        if (data.success) { alert('✅ Semua memori dihapus'); loadMemoryList(); loadAdminConfig(); }
        else alert(data.message);
    } catch (err) { alert(err.message); }
}

async function reloadMemory() {
    try {
        const res = await adminFetch('/api/admin/memory/reload', { method: 'POST' });
        const data = await res.json();
        alert(`✅ Reload selesai. Total ${data.total} memori.`);
        loadMemoryList();
        loadAdminConfig();
    } catch (err) { alert(err.message); }
}

async function saveMemorySettings() {
    const updates = {
        memoryEnabled: document.getElementById('memoryEnabled').checked,
        memoryMinScore: parseInt(document.getElementById('memoryMinScore').value) || 60,
        memorySaveThreshold: parseInt(document.getElementById('memorySaveThreshold').value) || 40
    };
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST', body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) alert('✅ Pengaturan memori disimpan'); else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

async function saveConversationSettings() {
    const updates = {
        conversationHistoryEnabled: document.getElementById('convEnabled').checked,
        conversationHistorySize: parseInt(document.getElementById('convSize').value) || 10,
        rateLimitPerSession: parseInt(document.getElementById('rateLimitPerSession').value) || 20
    };
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST', body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) alert('✅ Pengaturan konteks disimpan'); else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

// ============================================================
// SESSIONS
// ============================================================
async function loadSessions() {
    const el = document.getElementById('sessionsList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const res = await adminFetch('/api/admin/sessions');
        const data = await res.json();
        if (!data.sessions || data.sessions.length === 0) {
            el.innerHTML = '<div class="empty-state">Tidak ada sesi aktif.</div>';
            return;
        }
        let html = '<div class="table-wrap"><table class="data-table"><thead><tr><th>Mulai</th><th>Aktif Terakhir</th><th>Pesan</th><th>Pesan Terakhir</th></tr></thead><tbody>';
        data.sessions.forEach(s => {
            const c = new Date(s.createdAt).toLocaleString('id-ID');
            const l = new Date(s.lastActivity).toLocaleString('id-ID');
            html += `<tr>
                <td>${c}</td>
                <td>${l}</td>
                <td>${s.messageCount}</td>
                <td style="font-size:12px">${s.lastMessage || '-'}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal: ${err.message}</div>`;
    }
}

async function clearSessions() {
    if (!confirm('Hapus semua sesi percakapan?')) return;
    try {
        const res = await adminFetch('/api/admin/sessions/clear', { method: 'POST' });
        const data = await res.json();
        if (data.success) { loadSessions(); loadAdminConfig(); }
        else alert(data.message);
    } catch (err) { alert(err.message); }
}

// ============================================================
// NOTIFICATIONS (full page)
// ============================================================
async function loadNotifications() {
    const el = document.getElementById('notificationsList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const res = await adminFetch('/api/admin/notifications');
        const data = await res.json();

        await loadNotificationsBadge();

        if (!data.items || data.items.length === 0) {
            el.innerHTML = '<div class="empty-state">Tidak ada notifikasi.</div>';
            return;
        }
        let html = '';
        data.items.forEach(n => {
            const date = new Date(n.timestamp).toLocaleString('id-ID');
            const icon = n.level === 'danger' ? 'exclamation-triangle' :
                         (n.level === 'warning' ? 'exclamation-circle' : 'info-circle');
            html += `
                <div class="notif-item notif-${n.level} ${n.read ? 'notif-read' : ''}">
                    <div class="notif-head">
                        <span class="notif-icon"><i class="fas fa-${icon}"></i></span>
                        <span class="notif-title">${n.title}</span>
                        ${!n.read ? '<span class="badge badge-primary">BARU</span>' : ''}
                    </div>
                    <div class="notif-msg">${n.message}</div>
                    <div class="notif-date">${date}</div>
                </div>
            `;
        });
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal: ${err.message}</div>`;
    }
}

async function markAllRead() {
    try {
        await adminFetch('/api/admin/notifications/read', { method: 'POST', body: JSON.stringify({}) });
        loadNotifications();
        loadNotificationsBadge();
        loadNotificationsDropdown();
    } catch (err) { alert(err.message); }
}

async function clearNotifications() {
    if (!confirm('Hapus semua notifikasi?')) return;
    try {
        await adminFetch('/api/admin/notifications/clear', { method: 'POST' });
        loadNotifications();
        loadNotificationsBadge();
        loadNotificationsDropdown();
    } catch (err) { alert(err.message); }
}

// ============================================================
// BACKUP
// ============================================================
async function runBackupNow() {
    const el = document.getElementById('backupsList');
    if (el) el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Membuat backup...</div>';
    try {
        const res = await adminFetch('/api/admin/backup', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            alert('✅ ' + data.message);
            if (el) loadBackups();
        } else alert('❌ ' + data.message);
    } catch (err) { alert(err.message); }
}

async function loadBackups() {
    const el = document.getElementById('backupsList');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const res = await adminFetch('/api/admin/backups');
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
            el.innerHTML = '<div class="empty-state">Belum ada backup.</div>';
            return;
        }
        let html = '<div class="table-wrap"><table class="data-table"><thead><tr><th>Nama File</th><th>Tanggal</th><th>Ukuran</th></tr></thead><tbody>';
        data.items.forEach(b => {
            const d = new Date(b.created).toLocaleString('id-ID');
            const size = (b.size / 1024).toFixed(1) + ' KB';
            html += `<tr><td><code>${b.name}</code></td><td>${d}</td><td>${size}</td></tr>`;
        });
        html += '</tbody></table></div>';
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = `<div class="empty-state text-danger">Gagal: ${err.message}</div>`;
    }
}

// ============================================================
// SECURITY
// ============================================================
async function changePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const status = document.getElementById('passwordStatus');
    if (!oldPassword || !newPassword) {
        status.innerHTML = '<span class="text-danger">Isi semua field</span>';
        return;
    }
    if (newPassword.length < 8) {
        status.innerHTML = '<span class="text-danger">Password minimal 8 karakter</span>';
        return;
    }
    try {
        const res = await adminFetch('/api/admin/change-password', {
            method: 'POST', body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            status.innerHTML = '<span class="text-success">✅ ' + data.message + '</span>';
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
        } else {
            status.innerHTML = '<span class="text-danger">❌ ' + data.message + '</span>';
        }
    } catch (err) {
        status.innerHTML = '<span class="text-danger">' + err.message + '</span>';
    }
}

// ============================================================
// KEYBOARD SHORTCUT
// ============================================================
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (document.getElementById('loginPage')?.style.display === 'flex') hideLogin();
        document.getElementById('answerModal')?.classList.remove('show');
    }
});