import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);

    if (Auth.isAuthenticated()) {
        window.location.href = 'index.html';
    }

    document.getElementById('register-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            await Auth.register(
                document.getElementById('username').value,
                document.getElementById('password').value,
                document.getElementById('email').value
            );
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    });
});