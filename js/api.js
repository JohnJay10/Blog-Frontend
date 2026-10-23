const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : 'https://blog-backend-69aa.onrender.com/api';

export async function request(endpoint, options = {}) {
    const headers = new Headers(options.headers || {});
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (!headers.has('Content-Type') && options.body && !isFormData) {
        headers.set('Content-Type', 'application/json');
    }
    const token = localStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', 'Bearer ' + token);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    let data;
    try {
        data = await response.json();
    } catch (error) {
        if (response.ok) {
            throw new Error('The server returned an unreadable response.');
        }
        data = {};
    }

    if (!response.ok) {
        const requestError = new Error(data.message || 'An error occurred while processing the request.');
        requestError.status = response.status;
        throw requestError;
    }
    return data;
}

export function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character]));
}

export function safeImageUrl(value = '') {
    if (value.startsWith('/uploads/')) {
        return new URL(value, new URL(API_BASE).origin).href;
    }
    try {
        const url = new URL(value);
        return !url.username && !url.password && (url.protocol === 'http:' || url.protocol === 'https:')
            ? url.href
            : '';
    } catch {
        return '';
    }
}
