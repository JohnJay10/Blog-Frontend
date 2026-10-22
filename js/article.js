import { request } from './api.js';

let postId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('id');

    if (!postId) {
        window.location.href = 'index.html'; // Redirect to feed page if no ID is provided
        return;
    }

    // Load the post data to pre-fill the form

    loadArticle(postId);

    
    async function loadArticle(id) {
        const container = document.getElementById('article-container');
        try {
            const response = await request(`/blogs/${id}`);
            const post = response.data;

            container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1>${post.title}</h1>

                <div>
                    <a href="edit.html?id=${post._id}" class="btn-edit">Edit</a>
                    <div class="btn-delete" id="delete-btn">Delete</div>
                </div>
            </div>
            <p style="margin-top:1.5rem; white-space: prewrap;">${post.body}</p>
            `;

            document.getElementById('delete-btn').addEventListener('click', deletePost);
            
        } catch (error) {
            container.innerHTML = '<p>Error loading article. Please try again later.</p>';
            console.error('Error loading article:', error);
        }
    }

    // Handle delete button click
    async function deletePost() {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                 await request(`/blogs/${postId}`, {
                    method: 'DELETE'
                }); 
                alert('Post deleted successfully!');
                window.location.href = 'index.html'; // Redirect to feed page after deletion
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Error deleting post. Please try again.');
            }
        }
    }

});