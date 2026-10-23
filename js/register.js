import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);

    if (Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('register-form');
    const status = document.getElementById('auth-status');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        status.textContent = '';
        try {
            await Auth.register(
                document.getElementById('username').value,
                document.getElementById('password').value,
                document.getElementById('email').value
            );
            window.location.href = 'index.html';
        } catch (error) {
            status.textContent = error.message || 'Account creation failed. Please try again.';
            submitButton.disabled = false;
        }
    });
});