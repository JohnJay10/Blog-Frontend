import {request, escapeHTML} from './api.js';


document.addEventListener('DOMContentLoaded', loadPosts);


async function loadPosts() {
    const container = document.getElementById('post-list');

    try {
        const res = await request('/blogs');

        const posts = Array.isArray(res) ? res : res.data; // Adjust based on your API response structure

        if (posts.length === 0) {
        container.innerHTML = '<p>No posts available.</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post">
            <h2>${escapeHTML(post.title)}</h2>
            <p>${escapeHTML(post.body)}</p>
            <div>
                <a href="article.html?id=${post._id}" class="btn-edit">Read Article</a>
                
            </div>
        </div>
    `).join('');
}   catch (error) {
    console.error('Error loading posts:', error);
    container.innerHTML = '<p>Error loading posts. Please try again later.</p>';
}
}