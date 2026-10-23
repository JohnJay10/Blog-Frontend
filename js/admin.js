import { Auth } from './auth.js';
import { request, escapeHTML, safeImageUrl } from './api.js';

const state = {
    userPage: 1,
    blogPage: 1,
    userPages: 1,
    blogPages: 1,
};

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init(true);
    if (!Auth.user || Auth.user.role !== 'admin') {
        window.location.replace(Auth.user ? 'index.html' : 'login.html');
        return;
    }

    document.getElementById('author-form').addEventListener('submit', createAuthor);
    document.addEventListener('click', handleDashboardClick);
    await Promise.all([loadUsers(), loadBlogs()]);
});

function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

async function loadUsers(page = state.userPage) {
    const table = document.getElementById('users-table');
    const status = document.getElementById('users-status');
    status.textContent = '';
    table.innerHTML = '<tr><td colspan="5">Loading members...</td></tr>';
    try {
        const response = await request(`/admin/users?page=${page}&limit=50`);
        const users = response.data || [];
        state.userPage = response.pagination.page;
        state.userPages = response.pagination.pages;
        document.getElementById('member-count').textContent = response.pagination.total.toLocaleString();
        document.getElementById('author-count').textContent = Number(response.roleCounts?.author || 0).toLocaleString();
        table.innerHTML = users.length ? users.map((user) => {
            const isCurrentUser = String(user._id) === String(Auth.user.id);
            return `<tr>
                <td data-label="Member"><strong>${escapeHTML(user.username)}</strong>${isCurrentUser ? '<span class="admin-you">You</span>' : ''}</td>
                <td data-label="Email">${escapeHTML(user.email)}</td>
                <td data-label="Role"><span class="role-pill role-${escapeHTML(user.role)}">${escapeHTML(user.role)}</span></td>
                <td data-label="Joined">${formatDate(user.createdAt)}</td>
                <td data-label="Actions">${isCurrentUser
                    ? '<span class="table-muted">Current account</span>'
                    : `<button class="table-action danger-action" type="button" data-delete-user="${escapeHTML(user._id)}" data-name="${escapeHTML(user.username)}">Delete</button>`}</td>
            </tr>`;
        }).join('') : '<tr><td colspan="5">No members yet.</td></tr>';
        renderPagination('users-pagination', state.userPage, state.userPages, 'users');
    } catch (error) {
        console.error('Error loading admin users:', error);
        table.innerHTML = '<tr><td colspan="5">Members could not be loaded.</td></tr>';
        status.textContent = error.message || 'Unable to load members.';
    }
}

async function loadBlogs(page = state.blogPage) {
    const table = document.getElementById('blogs-table');
    const status = document.getElementById('blogs-status');
    status.textContent = '';
    table.innerHTML = '<tr><td colspan="6">Loading stories...</td></tr>';
    try {
        const response = await request(`/admin/blogs?page=${page}&limit=50`);
        const blogs = response.data || [];
        state.blogPage = response.pagination.page;
        state.blogPages = response.pagination.pages;
        document.getElementById('story-count').textContent = response.pagination.total.toLocaleString();
        table.innerHTML = blogs.length ? blogs.map((blog) => {
            const image = safeImageUrl(blog.image);
            return `<tr>
                <td data-label="Story"><div class="admin-story-cell">${image ? `<img src="${escapeHTML(image)}" alt="" loading="lazy">` : ''}<a href="article.html?id=${encodeURIComponent(blog._id)}">${escapeHTML(blog.title)}</a></div></td>
                <td data-label="Author">${escapeHTML(blog.author?.username || 'Legacy / unknown')}</td>
                <td data-label="Category">${escapeHTML(blog.category || 'Stories')}</td>
                <td data-label="Reads">${Number(blog.views || 0).toLocaleString()}</td>
                <td data-label="Published">${formatDate(blog.createdAt)}</td>
                <td data-label="Actions"><div class="table-actions"><a class="table-action" href="article.html?id=${encodeURIComponent(blog._id)}">View</a><a class="table-action" href="edit.html?id=${encodeURIComponent(blog._id)}">Edit</a><button class="table-action danger-action" type="button" data-delete-blog="${escapeHTML(blog._id)}" data-name="${escapeHTML(blog.title)}">Delete</button></div></td>
            </tr>`;
        }).join('') : '<tr><td colspan="6">No stories have been published yet.</td></tr>';
        table.querySelectorAll('.admin-story-cell img').forEach((image) => {
            image.addEventListener('error', () => image.remove());
        });
        renderPagination('blogs-pagination', state.blogPage, state.blogPages, 'blogs');
    } catch (error) {
        console.error('Error loading admin stories:', error);
        table.innerHTML = '<tr><td colspan="6">Stories could not be loaded.</td></tr>';
        status.textContent = error.message || 'Unable to load stories.';
    }
}

function renderPagination(containerId, page, pages, section) {
    const container = document.getElementById(containerId);
    if (pages <= 1) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `
        <span>Page ${page} of ${pages}</span>
        <div>
            <button type="button" data-page-section="${section}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Previous</button>
            <button type="button" data-page-section="${section}" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next</button>
        </div>`;
}

async function createAuthor(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById('author-status');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = '';
    status.classList.remove('status-success');
    try {
        await request('/admin/authors', {
            method: 'POST',
            body: JSON.stringify({
                username: form.elements.username.value.trim(),
                email: form.elements.email.value.trim(),
                password: form.elements.password.value,
            }),
        });
        form.reset();
        status.textContent = 'Author account created. Share the sign-in details with them privately.';
        status.classList.add('status-success');
        state.userPage = 1;
        await loadUsers(1);
    } catch (error) {
        status.classList.remove('status-success');
        status.textContent = error.message || 'The author account could not be created.';
    } finally {
        button.disabled = false;
    }
}

async function handleDashboardClick(event) {
    const reloadButton = event.target.closest('[data-reload]');
    if (reloadButton) {
        if (reloadButton.dataset.reload === 'users') await loadUsers();
        if (reloadButton.dataset.reload === 'blogs') await loadBlogs();
        return;
    }

    const pageButton = event.target.closest('[data-page-section]');
    if (pageButton && !pageButton.disabled) {
        const page = Number(pageButton.dataset.page);
        if (pageButton.dataset.pageSection === 'users') await loadUsers(page);
        if (pageButton.dataset.pageSection === 'blogs') await loadBlogs(page);
        return;
    }

    const userButton = event.target.closest('[data-delete-user]');
    if (userButton) {
        const username = userButton.dataset.name;
        if (!window.confirm(`Delete ${username} and their posts, comments, and likes? This cannot be undone.`)) return;
        userButton.disabled = true;
        try {
            await request(`/admin/users/${encodeURIComponent(userButton.dataset.deleteUser)}`, { method: 'DELETE' });
            await Promise.all([loadUsers(), loadBlogs()]);
        } catch (error) {
            userButton.disabled = false;
            document.getElementById('users-status').textContent = error.message || 'The member could not be deleted.';
        }
        return;
    }

    const blogButton = event.target.closest('[data-delete-blog]');
    if (blogButton) {
        const title = blogButton.dataset.name;
        if (!window.confirm(`Delete “${title}” and its comments? This cannot be undone.`)) return;
        blogButton.disabled = true;
        try {
            await request(`/blogs/${encodeURIComponent(blogButton.dataset.deleteBlog)}`, { method: 'DELETE' });
            await loadBlogs();
        } catch (error) {
            blogButton.disabled = false;
            document.getElementById('blogs-status').textContent = error.message || 'The story could not be deleted.';
        }
    }
}
