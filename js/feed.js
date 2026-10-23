import { request, escapeHTML, safeImageUrl } from './api.js';

const state = { sort: 'latest', category: 'All stories', query: '' };
const postList = document.getElementById('post-list');

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    document.getElementById('search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        state.query = document.getElementById('search-input').value.trim();
        loadPosts();
    });
    document.getElementById('category-filters').addEventListener('click', (event) => {
        const button = event.target.closest('[data-category]');
        if (!button) return;
        state.category = button.dataset.category;
        document.querySelectorAll('.category-chip').forEach((chip) => {
            const isActive = chip === button;
            chip.classList.toggle('is-active', isActive);
            chip.setAttribute('aria-pressed', String(isActive));
        });
        loadPosts();
    });
    document.querySelector('.sort-tabs').addEventListener('click', (event) => {
        const button = event.target.closest('[data-sort]');
        if (!button) return;
        state.sort = button.dataset.sort;
        document.querySelectorAll('.sort-tab').forEach((tab) => {
            const isActive = tab === button;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
        loadPosts();
    });

    loadFeatured();
    loadPosts();
    loadTrending();
});

function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function getAuthor(post) {
    return post.author && post.author.username ? escapeHTML(post.author.username) : 'Guest writer';
}

function imageMarkup(url, className, alt) {
    const safeUrl = safeImageUrl(url);
    return safeUrl
        ? `<img class="${className}" src="${escapeHTML(safeUrl)}" alt="${escapeHTML(alt)}" loading="lazy">`
        : '';
}

function renderFeatured(post) {
    const container = document.getElementById('featured-post');
    if (!post) {
        container.innerHTML = '<p class="featured-placeholder">No stories yet. Be the first to share one.</p>';
        return;
    }
    const excerpt = post.body.length > 190 ? `${post.body.slice(0, 190).trim()}…` : post.body;
    container.className = 'featured-card';
    container.innerHTML = `
        <div class="featured-copy">
            <span class="featured-category">${escapeHTML(post.category || 'Stories')}</span>
            <h2>${escapeHTML(post.title)}</h2>
            <p>${escapeHTML(excerpt)}</p>
            <div class="featured-meta"><span>By ${getAuthor(post)}</span><span>${formatDate(post.createdAt)}</span><span>${Number(post.views || 0).toLocaleString()} reads</span></div>
            <a class="featured-link" href="article.html?id=${encodeURIComponent(post._id)}">Read the story <span aria-hidden="true">↗</span></a>
        </div>
        <a class="featured-image" href="article.html?id=${encodeURIComponent(post._id)}" aria-label="Read ${escapeHTML(post.title)}">
            ${imageMarkup(post.image, '', post.title)}
        </a>
    `;
    const image = container.querySelector('.featured-image img');
    if (image) image.addEventListener('error', () => image.remove());
}

async function loadFeatured() {
    try {
        const response = await request('/blogs?sort=latest&limit=1');
        const posts = response.data || [];
        renderFeatured(posts[0]);
    } catch (error) {
        console.error('Error loading featured story:', error);
        const container = document.getElementById('featured-post');
        container.className = 'featured-placeholder';
        container.textContent = 'Featured stories are temporarily unavailable.';
    }
}

function renderPost(post) {
    const excerpt = post.body.length > 170 ? `${post.body.slice(0, 170).trim()}…` : post.body;
    const minutes = Math.max(1, Math.ceil(post.body.trim().split(/\s+/).length / 220));
    const image = imageMarkup(post.image, '', post.title);
    return `
        <article class="post-card">
            <a class="post-card-image" href="article.html?id=${encodeURIComponent(post._id)}" aria-label="Read ${escapeHTML(post.title)}">${image}</a>
            <div class="post-card-copy">
                <span class="post-category">${escapeHTML(post.category || 'Stories')}</span>
                <h3><a href="article.html?id=${encodeURIComponent(post._id)}">${escapeHTML(post.title)}</a></h3>
                <p class="post-excerpt">${escapeHTML(excerpt)}</p>
                <div class="post-meta">
                    <span>${getAuthor(post)}</span>
                    <span>${formatDate(post.createdAt)}</span>
                    <span>${minutes} min read</span>
                    <span>♥ ${Number(post.likes?.length || 0).toLocaleString()}</span>
                    <span>◌ ${Number(post.commentCount || 0).toLocaleString()}</span>
                </div>
            </div>
        </article>
    `;
}

async function loadPosts() {
    postList.innerHTML = '<p class="loading-message">Finding stories for you...</p>';
    const params = new URLSearchParams({ sort: state.sort, limit: '30' });
    if (state.category !== 'All stories') params.set('category', state.category);
    if (state.query) params.set('q', state.query);
    try {
        const response = await request(`/blogs?${params.toString()}`);
        const posts = response.data || [];
        if (!posts.length) {
            postList.innerHTML = '<p class="empty-message">No stories match that search yet. Try another topic or be the first to write about it.</p>';
            return;
        }
        const featured = document.querySelector('.featured-card');
        const featuredId = featured?.querySelector('.featured-link')?.href
            ? new URL(featured.querySelector('.featured-link').href).searchParams.get('id')
            : null;
        const visiblePosts = posts.filter((post) => (
            state.query || state.category !== 'All stories' || post._id !== featuredId
        ));
        postList.innerHTML = visiblePosts.length
            ? visiblePosts.map(renderPost).join('')
            : '<p class="empty-message">You’re all caught up. Check back soon for more stories.</p>';
        postList.querySelectorAll('.post-card-image img').forEach((image) => {
            image.addEventListener('error', () => image.remove());
        });
    } catch (error) {
        console.error('Error loading stories:', error);
        postList.innerHTML = `<p class="error-message">${escapeHTML(error.message || 'Stories could not be loaded. Please try again.')}</p>`;
    }
}

async function loadTrending() {
    const container = document.getElementById('trending-list');
    try {
        const response = await request('/blogs?sort=popular&limit=4');
        const posts = response.data || [];
        container.innerHTML = posts.length
            ? posts.map((post, index) => `
                <article class="trending-item">
                    <span class="trending-number">0${index + 1}</span>
                    <div>
                        <a href="article.html?id=${encodeURIComponent(post._id)}">${escapeHTML(post.title)}</a>
                        <span>${Number(post.views || 0).toLocaleString()} reads · ${escapeHTML(post.category || 'Stories')}</span>
                    </div>
                </article>
            `).join('')
            : '<p class="sidebar-muted">Your most-read stories will show up here.</p>';
    } catch (error) {
        console.error('Error loading trending stories:', error);
        container.innerHTML = '<p class="sidebar-muted">Trending stories are temporarily unavailable.</p>';
    }
}
