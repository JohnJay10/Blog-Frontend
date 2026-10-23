import { request } from './api.js';

const TOKEN_KEY = 'token';
const LOGIN_PAGE = 'login.html';
let initPromise = null;

export const Auth = {
    user: null,

    async init(allowGuest = false) {
        if (initPromise) {
            return initPromise;
        }

        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            Auth.user = null;
            if (!allowGuest) Auth.redirectToLogin();
            return null;
        }

        initPromise = (async () => {
            try {
                const response = await request('/auth/me');
                Auth.user = response.data;
                return Auth.user;
            } catch (error) {
                if (error.status === 401 || error.status === 403) {
                    localStorage.removeItem(TOKEN_KEY);
                } else {
                    console.error('Error fetching user data:', error);
                }
                Auth.user = null;
                if (!allowGuest) Auth.redirectToLogin();
                return null;
            } finally {
                initPromise = null;
            }
        })();

        return initPromise;
    },

    async register(username, password, email) {
        const response = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email }),
        });
        localStorage.setItem(TOKEN_KEY, response.data.token);
        return Auth.init(true);
    },

    async login(email, password) {
        const response = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(TOKEN_KEY, response.data.token);
        return Auth.init(true);
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        Auth.user = null;
        Auth.redirectToLogin();
    },

    isAuthenticated() {
        return Auth.user !== null;
    },

    redirectToLogin() {
        window.location.href = LOGIN_PAGE;
    },
};
