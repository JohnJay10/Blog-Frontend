import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) {
        console.error('Navigation links container not found');
        return;
    }

    if (Auth.isAuthenticated()) {

        const role = Auth.user?.role;
        let roleLinks = '';
        if (role === 'author' || role === 'admin') {
            roleLinks += `<li><a href="create.html">Create Blog</a></li>`;
        }
        if (role === 'admin') {
            roleLinks += `<li><a href="admin.html">Admin Panel</a></li>`;
        }
        navLinks.innerHTML = `
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="create.html">Create</a></li>
                ${roleLinks}
                <li><span>Welcome, ${Auth.user.username}</span></li>
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
                <li><a href="index.html">Home</a></li>
                <li><a href="login.html" class="btn-primary">Login</a></li>
                <li><a href="register.html" class="btn-primary">Register</a></li>
            </ul>
        `;
    }
})
