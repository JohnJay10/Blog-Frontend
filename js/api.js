const API_BASE = 'http://localhost:3000/api';

export async function request(endpoint, options = {}) {
    options.headers =  options.headers || {};
    options.headers['Content-Type'] = 'application/json';

    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data ={};
        console.error('Error parsing JSON:', error);
    }

    if (!response.ok) {
        throw new Error(data.message || 'An error occurred while processing the request.');
    }
    return data;
}

export function escapeHTML(str) {
    return str.replace(/[&<>"']/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[tag]));
}