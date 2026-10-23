import { Auth } from './auth.js';
import { request } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('create-form');
    const status = document.getElementById('form-status');
    const imageInput = document.getElementById('image');
    const preview = document.getElementById('image-preview');
    const previewImage = document.getElementById('image-preview-img');
    let previewUrl = null;

    imageInput.addEventListener('change', () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const file = imageInput.files[0];
        if (!file) {
            preview.hidden = true;
            previewImage.removeAttribute('src');
            return;
        }
        previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        preview.hidden = false;
    });
    document.getElementById('remove-image').addEventListener('click', () => {
        imageInput.value = '';
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        preview.hidden = true;
        previewImage.removeAttribute('src');
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        status.textContent = '';
        try {
            const formData = new FormData();
            formData.append('title', document.getElementById('title').value.trim());
            formData.append('body', document.getElementById('body').value.trim());
            formData.append('category', document.getElementById('category').value);
            if (imageInput.files[0]) formData.append('image', imageInput.files[0]);
            const response = await request('/blogs', {
                method: 'POST',
                body: formData,
            });
            window.location.href = `article.html?id=${encodeURIComponent(response.data._id)}`;
        } catch (error) {
            status.textContent = error.message || 'Your story could not be published. Please try again.';
            submitButton.disabled = false;
        }
    });
});
