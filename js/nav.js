import { Auth } from './auth.js';
import { escapeHTML } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) {
        console.error('Navigation links container not found');
        return;
    }

    if (Auth.isAuthenticated()) {
        const adminLink = Auth.user.role === 'admin'
            ? '<li><a href="admin.html">Admin dashboard</a></li>'
            : '';

        navLinks.innerHTML = `
            <ul>
                <li><a href="index.html">Discover</a></li>
                <li><a href="create.html" class="btn-primary">Write a story</a></li>
                ${adminLink}
                <li><span class="nav-user">Hi, ${escapeHTML(Auth.user.username)}</span></li>
                <li><a href="#" id="logout-link">Logout</a></li>
            </ul>
        `;

        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
            window.location.href = 'index.html';
        });
    } else {

        navLinks.innerHTML = `
            <ul>
                <li><a href="index.html">Discover</a></li>
                <li><a href="login.html">Sign in</a></li>
                <li><a href="register.html" class="btn-primary">Join the community</a></li>
            </ul>
        `;
    }
})
