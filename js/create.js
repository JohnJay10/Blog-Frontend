import { request } from "./api.js";
import {Auth} from "./auth.js";



document.addEventListener('DOMContentLoaded', () => {

    // Strictly check if the user is authenticated before showing the form

    const userRole = Auth.user ? Auth.user.role : null;
    if (!Auth.isAuthenticated() || (userRole !== 'admin' && userRole !== 'author')) {
        alert('You must be logged in to create a post.');
        window.location.href = 'login.html';
        return;
    }

    // Show the form if the user is authenticated

    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }

    //Handle form submission

    const form = document.getElementById('create-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const body = document.getElementById('body').value;

        try {
            const response = await request('/blogs', {
                method: 'POST',
                body: JSON.stringify({ title, body })
            });

            window.location.href = `index.html?id=${response.data._id}`; // Redirect to feed page after successful creation
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post. Please try again.');
        }
    });
});
