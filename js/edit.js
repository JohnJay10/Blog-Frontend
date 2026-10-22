import { request } from './api.js';


let postId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('id');

    if (!postId) {
        window.location.href = 'index.html'; // Redirect to feed page if no ID is provided
        return;
    }

    //Load the post data to pre-fill the form
    try {
        const response = await request(`/blogs/${postId}`);
        document.getElementById('title').value = response.data.title;
        document.getElementById('body').value = response.data.body;
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Error loading post. Please try again.');
    }

    // Handle form submission for editing the post
    const form = document.getElementById('edit-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('title').value;
            const body = document.getElementById('body').value;

            try {
               const response = await request(`/blogs/${postId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title, body }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                    
                );

                if (response.success) {
                    alert('Post updated successfully!');
                    window.location.href = `article.html?id=${postId}`;
                } else {
                    alert('Failed to update post. Please try again.');
                }
            } catch (error) {
                console.error('Error updating post:', error);
                alert('Error updating post. Please try again.');
            }
        });
    }


});



        