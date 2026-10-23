import { Auth } from './auth.js';
import { request, safeImageUrl } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const postId = new URLSearchParams(window.location.search).get('id');
    const form = document.getElementById('edit-form');
    const status = document.getElementById('form-status');
    const imageInput = document.getElementById('image');
    if (!postId) {
        status.textContent = 'No story was selected to edit.';
        form.hidden = true;
        return;
    }

    await Auth.init(true);
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await request(`/blogs/${encodeURIComponent(postId)}`);
        const post = response.data;
        const authorId = post.author?._id || post.author;
        const canEdit = Auth.user.role === 'admin' || (authorId && String(authorId) === String(Auth.user.id));
        if (!canEdit) {
            form.hidden = true;
            status.textContent = 'You can only edit stories you have written.';
            return;
        }

        document.getElementById('title').value = post.title;
        document.getElementById('body').value = post.body;
        const category = post.category || 'Stories';
        document.getElementById('category').value = category;
        if (!document.getElementById('category').value) {
            document.getElementById('category').value = 'Stories';
        }
        const currentImage = safeImageUrl(post.image || '');
        const preview = document.getElementById('image-preview');
        const previewImage = document.getElementById('image-preview-img');
        const removeCoverOption = document.getElementById('remove-cover-option');
        let previewUrl = null;
        if (currentImage) {
            previewImage.src = currentImage;
            preview.hidden = false;
            removeCoverOption.hidden = false;
            previewImage.addEventListener('error', () => {
                preview.hidden = true;
                removeCoverOption.hidden = true;
            }, { once: true });
        }
        imageInput.addEventListener('change', () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const file = imageInput.files[0];
            if (!file) {
                previewImage.src = currentImage;
                preview.hidden = !currentImage;
                return;
            }
            document.getElementById('remove-cover').checked = false;
            previewUrl = URL.createObjectURL(file);
            previewImage.src = previewUrl;
            preview.hidden = false;
            removeCoverOption.hidden = true;
        });
        document.getElementById('remove-cover').addEventListener('change', (event) => {
            if (event.target.checked) {
                imageInput.value = '';
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                previewUrl = null;
                preview.hidden = true;
                return;
            }
            previewImage.src = currentImage;
            preview.hidden = !currentImage;
        });
        document.getElementById('remove-image').addEventListener('click', () => {
            imageInput.value = '';
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = null;
            previewImage.src = currentImage;
            preview.hidden = !currentImage;
            removeCoverOption.hidden = Boolean(currentImage);
            document.getElementById('remove-cover').checked = false;
        });
    } catch (error) {
        form.hidden = true;
        status.textContent = error.message || 'This story could not be loaded.';
        return;
    }

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
            else if (document.getElementById('remove-cover').checked) formData.append('removeImage', 'true');
            await request(`/blogs/${encodeURIComponent(postId)}`, {
                method: 'PUT',
                body: formData,
            });
            window.location.href = `article.html?id=${encodeURIComponent(postId)}`;
        } catch (error) {
            status.textContent = error.message || 'Your story could not be saved. Please try again.';
            submitButton.disabled = false;
        }
    });
});
