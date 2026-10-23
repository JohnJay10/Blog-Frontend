import { Auth } from './auth.js';
import { request, escapeHTML, safeImageUrl } from './api.js';

const params = new URLSearchParams(window.location.search);
const postId = params.get('id');
const container = document.getElementById('article-container');

document.addEventListener('DOMContentLoaded', async () => {
    if (!postId) {
        container.innerHTML = '<a class="article-back" href="index.html">← Back to stories</a><p class="error-message">This story could not be found.</p>';
        return;
    }

    await Auth.init(true);
    await loadArticle();
});

function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function authorName(post) {
    return post.author?.username ? escapeHTML(post.author.username) : 'Guest writer';
}

function canManage(post) {
    const authorId = post.author?._id || post.author;
    return Auth.user && (Auth.user.role === 'admin' || (authorId && String(authorId) === String(Auth.user.id)));
}

async function loadArticle() {
    try {
        const response = await request(`/blogs/${encodeURIComponent(postId)}`);
        const post = response.data;
        document.title = `${post.title} — Commonplace`;
        const coverUrl = safeImageUrl(post.image);
        const liked = Boolean(Auth.user && post.likes?.some((id) => String(id) === String(Auth.user.id)));
        const manageActions = canManage(post)
            ? `<div class="article-actions"><a class="article-action" href="edit.html?id=${encodeURIComponent(post._id)}">Edit story</a><button class="article-action" id="delete-btn" type="button">Delete</button></div>`
            : '';

        container.innerHTML = `
            <a class="article-back" href="index.html">← Back to stories</a>
            <article>
                <header class="article-header">
                    <span class="post-category">${escapeHTML(post.category || 'Stories')}</span>
                    <h1>${escapeHTML(post.title)}</h1>
                    <div class="article-meta">
                        <span>By ${authorName(post)}</span>
                        <span>${formatDate(post.createdAt)}</span>
                        <span>${Number(post.views || 0).toLocaleString()} reads</span>
                    </div>
                </header>
                ${coverUrl ? `<figure class="article-cover"><img id="article-cover-image" src="${escapeHTML(coverUrl)}" alt="${escapeHTML(post.title)}"></figure>` : ''}
                <div class="article-body">${escapeHTML(post.body).split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('')}</div>
                <div class="article-tools">
                    <button class="engagement-button${liked ? ' is-liked' : ''}" id="like-btn" type="button" aria-pressed="${liked}" ${Auth.user ? '' : 'disabled'}>♥ <span id="like-count">${Number(post.likes?.length || 0).toLocaleString()}</span> <span>Like</span></button>
                    ${manageActions}
                </div>
                <section class="comments-section" aria-labelledby="comments-heading">
                    <h2 class="comments-heading" id="comments-heading">A good story starts a conversation</h2>
                    ${Auth.user
                        ? `<form class="comment-form" id="comment-form"><label class="sr-only" for="comment-body">Write a comment</label><textarea id="comment-body" name="body" maxlength="2000" placeholder="Share a thoughtful response..." required></textarea><p class="form-status" id="comment-status" role="status"></p><button type="submit">Post comment</button></form>`
                        : '<p class="comment-login"><a href="login.html">Sign in</a> to leave a comment or like this story.</p>'}
                    <div class="comment-list" id="comment-list" aria-live="polite"><p class="loading-message">Loading the conversation...</p></div>
                </section>
            </article>
        `;

        const coverImage = document.getElementById('article-cover-image');
        if (coverImage) {
            coverImage.addEventListener('error', () => coverImage.closest('.article-cover').remove());
        }
        const likeButton = document.getElementById('like-btn');
        if (Auth.user) likeButton.addEventListener('click', toggleLike);
        if (canManage(post)) document.getElementById('delete-btn').addEventListener('click', deletePost);
        if (Auth.user) document.getElementById('comment-form').addEventListener('submit', submitComment);
        await loadComments();
    } catch (error) {
        console.error('Error loading story:', error);
        container.innerHTML = `<a class="article-back" href="index.html">← Back to stories</a><p class="error-message">${escapeHTML(error.message || 'This story could not be loaded.')}</p>`;
    }
}

async function toggleLike() {
    const button = document.getElementById('like-btn');
    button.disabled = true;
    try {
        const response = await request(`/blogs/${encodeURIComponent(postId)}/like`, { method: 'POST' });
        button.classList.toggle('is-liked', response.data.liked);
        button.setAttribute('aria-pressed', String(response.data.liked));
        document.getElementById('like-count').textContent = Number(response.data.likes).toLocaleString();
    } catch (error) {
        console.error('Error updating like:', error);
        window.alert(error.message || 'Your like could not be saved. Please try again.');
    } finally {
        button.disabled = false;
    }
}

async function loadComments() {
    const list = document.getElementById('comment-list');
    try {
        const response = await request(`/blogs/${encodeURIComponent(postId)}/comments`);
        const comments = response.data || [];
        list.innerHTML = comments.length
            ? comments.map((comment) => `
                <article class="comment-item">
                    <div class="comment-meta"><span class="comment-author">${escapeHTML(comment.author?.username || 'Community member')}</span><time class="comment-date" datetime="${escapeHTML(comment.createdAt)}">${formatDate(comment.createdAt)}</time></div>
                    <p class="comment-body">${escapeHTML(comment.body)}</p>
                </article>
            `).join('')
            : '<p class="sidebar-muted">Be the first to share a thoughtful response.</p>';
    } catch (error) {
        console.error('Error loading comments:', error);
        list.innerHTML = '<p class="error-message">The conversation could not be loaded right now.</p>';
    }
}

async function submitComment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById('comment-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const body = document.getElementById('comment-body').value.trim();
    if (!body) {
        status.textContent = 'Write a comment before posting.';
        return;
    }
    submitButton.disabled = true;
    status.textContent = '';
    try {
        await request(`/blogs/${encodeURIComponent(postId)}/comments`, {
            method: 'POST',
            body: JSON.stringify({ body }),
        });
        form.reset();
        await loadComments();
    } catch (error) {
        status.textContent = error.message || 'Your comment could not be posted. Please try again.';
    } finally {
        submitButton.disabled = false;
    }
}

async function deletePost() {
    if (!window.confirm('Delete this story? This action cannot be undone.')) return;
    try {
        await request(`/blogs/${encodeURIComponent(postId)}`, { method: 'DELETE' });
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error deleting story:', error);
        window.alert(error.message || 'The story could not be deleted. Please try again.');
    }
}
