import { Auth } from './auth.js';


document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);

    if (Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('login-form');
    const status = document.getElementById('auth-status');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        status.textContent = '';
        try {
            await Auth.login(
                document.getElementById('username').value,
                document.getElementById('password').value
            );
            window.location.href = 'index.html';
        } catch (error) {
            status.textContent = error.message || 'Sign in failed. Please try again.';
            submitButton.disabled = false;
        }
    });
});