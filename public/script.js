let currentUser = null;
let adminToken = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('chatPage').style.display = 'flex';
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'none';
    await loadPublicConfig();
});

async function loadPublicConfig() {
    try {
        const res = await fetch('/api/config/public');
        const cfg = await res.json();

        document.getElementById('headerTitle').textContent = cfg.aiName;
        document.getElementById('headerTagline').innerHTML =
            `<i class="fas fa-robot me-1"></i>${cfg.tagline}`;

        const logoIcon = document.getElementById('logoIcon');
        if (cfg.logoUrl) {
            logoIcon.innerHTML = `<img src="${cfg.logoUrl}" alt="logo" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            logoIcon.textContent = cfg.logoText || 'S';
        }

        // Welcome message
        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML = `
          <div class="bubble bubble-bot">
            <div class="bot-name"><i class="fas fa-robot" style="color: var(--primary);"></i> ${cfg.aiName}</div>
            <div>${(cfg.welcomeMessage || '').replace(/\n/g, '<br>')}</div>
            <div class="bubble-time">Online</div>
          </div>
        `;

        // Quick buttons
        const qb = document.getElementById('quickButtons');
        qb.innerHTML = '';
        (cfg.quickButtons || []).forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'btn-quick';
            btn.innerHTML = `<i class="fas fa-circle-question me-1"></i> ${b.label}`;
            btn.onclick = () => sendQuickQuestion(b.question);
            qb.appendChild(btn);
        });
    } catch (err) {
        console.error('Gagal load config:', err);
    }
}

// ============================================================
// CHAT
// ============================================================
function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
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
        botName.innerHTML = `<i class="fas fa-robot" style="color: var(--primary);"></i> SIVT AI`;
        bubble.appendChild(botName);
        const t = document.createElement('div');
        t.textContent = text;
        bubble.appendChild(t);
    } else {
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
    botName.innerHTML = `<i class="fas fa-robot" style="color: var(--primary);"></i> SIVT AI`;
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
    return textNode;
}

async function getBotResponse(question) {
    const botTextEl = addEmptyBotMessage();
    let fullText = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversation: [{ role: 'user', text: question }]
            })
        });

        if (!response.ok || !response.body) {
            throw new Error('Server tidak merespons.');
        }

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

                if (obj.delta) {
                    fullText += obj.delta;
                    botTextEl.innerHTML = formatText(fullText);
                    document.getElementById('chatBox').scrollTop =
                        document.getElementById('chatBox').scrollHeight;
                } else if (obj.error) {
                    botTextEl.textContent = 'Error: ' + obj.error;
                }
            }
        }
    } catch (err) {
        botTextEl.textContent = 'Maaf, terjadi kesalahan: ' + err.message;
    }
}

function formatText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function resetChat() {
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
            loadAdminConfig();
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
    try {
        await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch (_) {}
    currentUser = null;
    adminToken = null;
    document.getElementById('adminPage').style.display = 'none';
    document.getElementById('chatPage').style.display = 'flex';
    document.getElementById('loginPage').style.display = 'none';
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
// ADMIN — LOAD CONFIG
// ============================================================
async function loadAdminConfig() {
    try {
        const res = await adminFetch('/api/admin/config');
        const cfg = await res.json();

        // Umum
        document.getElementById('cfg-aiName').value = cfg.aiName || '';
        document.getElementById('cfg-tagline').value = cfg.tagline || '';
        document.getElementById('cfg-logoUrl').value = cfg.logoUrl || '';
        document.getElementById('cfg-logoText').value = cfg.logoText || '';
        document.getElementById('cfg-welcomeMessage').value = cfg.welcomeMessage || '';

        // Kontak
        document.getElementById('cfg-contact-address').value = cfg.contactInfo?.address || '';
        document.getElementById('cfg-contact-phone').value = cfg.contactInfo?.phone || '';
        document.getElementById('cfg-contact-whatsapp').value = cfg.contactInfo?.whatsapp || '';
        document.getElementById('cfg-contact-email').value = cfg.contactInfo?.email || '';
        document.getElementById('cfg-contact-hours').value = cfg.contactInfo?.hours || '';

        // Prompt
        document.getElementById('cfg-systemInstruction').value = cfg.systemInstruction || '';

        // API Keys
        renderApiKeys(cfg.apiKeys || []);

        // Models
        renderModels(cfg.models || []);

        // Knowledge
        renderKnowledgeFiles(cfg.knowledgeFiles || [], cfg.knowledgeChunks || 0);
    } catch (err) {
        alert('Gagal load config: ' + err.message);
    }
}

function renderApiKeys(keys) {
    const el = document.getElementById('apiKeysList');
    if (keys.length === 0) {
        el.innerHTML = '<div class="text-muted text-center py-3">Belum ada API key</div>';
        return;
    }
    let html = '<table class="table table-sm table-hover"><thead><tr><th>#</th><th>Key</th><th>Aksi</th></tr></thead><tbody>';
    keys.forEach(k => {
        html += `<tr>
            <td>${k.index + 1}</td>
            <td><code>${k.masked}</code></td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="testKey(${k.index})"><i class="fas fa-vial"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeKey(${k.index})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    el.innerHTML = html;
}

async function addApiKey() {
    const key = document.getElementById('newApiKey').value.trim();
    if (!key) return;
    const status = document.getElementById('addKeyStatus');
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menambahkan...';

    try {
        const res = await adminFetch('/api/admin/keys/add', {
            method: 'POST',
            body: JSON.stringify({ key })
        });
        const data = await res.json();
        if (data.success) {
            status.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Ditambahkan. Total: ' + data.total + '</span>';
            document.getElementById('newApiKey').value = '';
            loadAdminConfig();
        } else {
            status.innerHTML = '<span class="text-danger">' + data.message + '</span>';
        }
    } catch (err) {
        status.innerHTML = '<span class="text-danger">' + err.message + '</span>';
    }
}

async function removeKey(index) {
    if (!confirm('Hapus API key ini?')) return;
    try {
        const res = await adminFetch('/api/admin/keys/remove', {
            method: 'POST',
            body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (data.success) loadAdminConfig();
        else alert(data.message);
    } catch (err) {
        alert(err.message);
    }
}

async function testKey(index) {
    const btns = document.querySelectorAll('#apiKeysList button');
    const btn = btns[index * 2];
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await adminFetch('/api/admin/keys/test', {
            method: 'POST',
            body: JSON.stringify({ index })
        });
        const data = await res.json();
        alert(data.success ? '✅ ' + data.message : '❌ ' + data.message);
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.innerHTML = original;
        btn.disabled = false;
    }
}

// ============================================================
// MODELS
// ============================================================
let modelList = [];

function renderModels(models) {
    modelList = [...models];
    const el = document.getElementById('modelsList');
    el.innerHTML = '';
    modelList.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'input-group mb-2';
        div.innerHTML = `
            <span class="input-group-text">${i + 1}</span>
            <input type="text" class="form-control" value="${m}" data-index="${i}" onchange="updateModel(${i}, this.value)">
            <button class="btn btn-outline-danger" onclick="removeModel(${i})"><i class="fas fa-trash"></i></button>
        `;
        el.appendChild(div);
    });
}

function updateModel(i, val) {
    modelList[i] = val;
}

function addModel() {
    modelList.push('gemini-flash-latest');
    renderModels(modelList);
}

function removeModel(i) {
    modelList.splice(i, 1);
    renderModels(modelList);
}

async function saveModels() {
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST',
            body: JSON.stringify({ models: modelList })
        });
        const data = await res.json();
        if (data.success) alert('✅ Model disimpan');
        else alert('❌ ' + data.message);
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// GENERAL CONFIG
// ============================================================
async function saveGeneral() {
    const updates = {
        aiName: document.getElementById('cfg-aiName').value.trim(),
        tagline: document.getElementById('cfg-tagline').value.trim(),
        logoUrl: document.getElementById('cfg-logoUrl').value.trim(),
        logoText: document.getElementById('cfg-logoText').value.trim(),
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
            method: 'POST',
            body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Pengaturan disimpan');
            loadPublicConfig();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) {
        alert(err.message);
    }
}

async function savePrompt() {
    const systemInstruction = document.getElementById('cfg-systemInstruction').value;
    try {
        const res = await adminFetch('/api/admin/config', {
            method: 'POST',
            body: JSON.stringify({ systemInstruction })
        });
        const data = await res.json();
        if (data.success) alert('✅ Prompt disimpan');
        else alert('❌ ' + data.message);
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// KNOWLEDGE
// ============================================================
function renderKnowledgeFiles(files, chunks) {
    const el = document.getElementById('knowledgeFilesList');
    if (files.length === 0) {
        el.innerHTML = '<div class="text-muted text-center py-3">Belum ada file pengetahuan</div>';
        return;
    }
    let html = `<p class="small text-muted">Total ${chunks} chunk aktif</p>`;
    html += '<table class="table table-sm"><thead><tr><th>Nama</th><th>Ukuran</th><th>Aksi</th></tr></thead><tbody>';
    files.forEach(f => {
        html += `<tr>
            <td>${f.name}</td>
            <td>${(f.size / 1024).toFixed(1)} KB</td>
            <td><button class="btn btn-sm btn-outline-danger" onclick="deleteKnowledge('${f.name}')"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    html += '</tbody></table>';
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
            method: 'POST',
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) loadAdminConfig();
        else alert(data.message);
    } catch (err) {
        alert(err.message);
    }
}

async function reloadKnowledge() {
    try {
        const res = await adminFetch('/api/admin/knowledge/reload', { method: 'POST' });
        const data = await res.json();
        alert(`✅ Reload selesai. Total ${data.chunks} chunk.`);
        loadAdminConfig();
    } catch (err) {
        alert(err.message);
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
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
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
        if (document.getElementById('loginPage').style.display === 'flex') hideLogin();
    }
});

// Animasi typing dots
const style = document.createElement('style');
style.textContent = `
  .typing-dots span {
    display: inline-block; width: 8px; height: 8px; margin: 0 3px;
    border-radius: 50%; background: #0d47a1;
    animation: bounce 1.2s infinite ease-in-out both;
  }
  .typing-dots span:nth-child(1) { animation-delay: -0.24s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.12s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);