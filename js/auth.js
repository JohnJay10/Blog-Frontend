import { request } from './api.js';

const TOKEN_KEY = 'token';
const LOGIN_PAGE = 'login.html';

export const Auth = {
    user: null,

  
    async init(allowGuest = false) {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            Auth.user = null;
            if (!allowGuest) Auth.redirectToLogin();
            return null;
        }

        try {
            const response = await request('/auth/me', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            Auth.user = response.data;
            return Auth.user;
        } catch (error) {
            console.error('Error fetching user data:', error);

      
            const status = error?.status ?? error?.response?.status;
            if (status === undefined || status === 401 || status === 403) {
                localStorage.removeItem(TOKEN_KEY);
            }

            Auth.user = null;
            if (!allowGuest) Auth.redirectToLogin();
            return null;
        }
    },

    //Register a new user, store the token, then load the user

    async register(username, password, email) {
        try {
            const response = await request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password, email }),
            });
            localStorage.setItem(TOKEN_KEY, response.data.token);
            return await Auth.init(true); // we're on the register page, don't redirect
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    },

    // Authenticate, store the token, then load the user
    async login(email, password) {
        try {
            const response = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            localStorage.setItem(TOKEN_KEY, response.data.token);
            return await Auth.init(true); // we're on the login page, don't redirect
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Clear the token and user data, then send the user to login
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