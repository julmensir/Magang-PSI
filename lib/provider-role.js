// ============================================================
// PROVIDER ROLE SYSTEM
// Setiap provider AI punya role: chat, embedding, enrichment, query-rewriter
// 1 provider bisa punya >1 role
// ============================================================

const VALID_ROLES = ['chat', 'embedding', 'enrichment', 'query-rewriter'];

/**
 * Validasi & normalisasi role array
 */
export function normalizeRoles(roles) {
    if (!Array.isArray(roles)) return ['chat']; // default
    const cleaned = roles
        .map(r => String(r).toLowerCase().trim())
        .filter(r => VALID_ROLES.includes(r));
    return cleaned.length > 0 ? [...new Set(cleaned)] : ['chat'];
}

/**
 * Ambil provider yang enabled + punya role tertentu + punya apiKey valid
 * @param {Array} providersConfig - PROVIDERS_CONFIG dari index.js
 * @param {Object} PROVIDERS - PROVIDERS registry dari providers.js
 * @param {String} role - 'chat' | 'embedding' | 'enrichment' | 'query-rewriter'
 * @returns {Array} - Array provider yang match
 */
export function getProvidersByRole(providersConfig, PROVIDERS, role) {
    if (!Array.isArray(providersConfig) || !role) return [];

    return providersConfig.filter(p => {
        if (!p || p.enabled === false) return false;
        if (!p.apiKey || String(p.apiKey).trim().length < 5) return false;

        const roles = normalizeRoles(p.roles || ['chat']);

        // Kalau role 'chat' dan provider tidak punya roles field, anggap chat
        if (role === 'chat' && !p.roles) return true;

        return roles.includes(role);
    });
}

/**
 * Dapatkan 1 provider terbaik untuk role tertentu (yang pertama)
 */
export function getFirstProviderByRole(providersConfig, PROVIDERS, role) {
    const list = getProvidersByRole(providersConfig, PROVIDERS, role);
    return list.length > 0 ? list[0] : null;
}

/**
 * Cek apakah ada provider untuk role tertentu
 */
export function hasProviderForRole(providersConfig, PROVIDERS, role) {
    return getProvidersByRole(providersConfig, PROVIDERS, role).length > 0;
}

/**
 * Statistik role: berapa provider untuk tiap role
 */
export function getRoleStats(providersConfig, PROVIDERS) {
    const stats = {};
    for (const role of VALID_ROLES) {
        stats[role] = getProvidersByRole(providersConfig, PROVIDERS, role).length;
    }
    return stats;
}

export { VALID_ROLES };