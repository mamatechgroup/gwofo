// Manage Posts – Full CRUD connected to backend via api.js
// Requires api.js to be loaded first

class ManagePosts {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = { status: 'all', category: 'all' };
        this.editingPostId = null;
        this._featuredImageB64 = null;  // base64 of featured image
        this._authorImageB64   = null;  // base64 of author avatar

        this.modal        = document.getElementById('postModal');
        this.form         = this.modal ? this.modal.querySelector('.crud-form') : null;
        this.modalTitle   = this.modal ? this.modal.querySelector('.modal-header h2') : null;
        this.submitBtn    = this.form  ? this.form.querySelector('.btn-submit')  : null;

        this.init();
    }

    init() {
        this.loadPosts();
        this.setupEventListeners();
        this.checkQueryParams();
    }

    // ─── Data Loading ─────────────────────────────────────────────────────────

    async loadPosts() {
        try {
            this.showLoading();
            const result = await Posts.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.posts = result.data;
                this.applyFilters();
                this.updateStats();
                this.updateCategoryDistribution();
            } else {
                this.showError('Failed to load posts');
            }
        } catch (err) {
            console.error('Error loading posts:', err);
            this.showError('Error connecting to server');
        }
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────

    setupEventListeners() {
        // Status filter
        const statusFilter = document.querySelector('[title="Filter Posts by Status"]');
        if (statusFilter) statusFilter.addEventListener('change', e => {
            this.currentFilter.status = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        // Category filter
        const categoryFilter = document.querySelector('[title="Filter Posts by Category"]');
        if (categoryFilter) categoryFilter.addEventListener('change', e => {
            this.currentFilter.category = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        // Search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.addEventListener('input', e => this.search(e.target.value));

        // Select-all
        const selectAll = document.querySelector('.select-all');
        if (selectAll) selectAll.addEventListener('change', e => {
            document.querySelectorAll('.select-item').forEach(cb => cb.checked = e.target.checked);
        });

        // Open "Add New Post" modal
        const addBtn = document.querySelector('[data-modal="postModal"]');
        if (addBtn) addBtn.addEventListener('click', () => this.openModal());

        // Close modal buttons
        if (this.modal) {
            this.modal.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
            const cancelBtn = this.modal.querySelector('.btn-cancel');
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
            // Close on overlay click
            this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
        }

        // Form submission (create / update)
        if (this.form) this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.savePost();
        });

        // Image preview (featured)
        const imageInput = document.getElementById('postImage');
        if (imageInput) imageInput.addEventListener('change', e => this.previewFeaturedImage(e));
        const removeImg = document.querySelector('.remove-image');
        if (removeImg) removeImg.addEventListener('click', () => this.clearImagePreview());

        // Author avatar preview
        const authorImgInput = document.getElementById('postAuthorImage');
        if (authorImgInput) authorImgInput.addEventListener('change', e => this.previewAuthorImage(e));
        const removeAuthorImg = document.getElementById('removeAuthorImage');
        if (removeAuthorImg) removeAuthorImg.addEventListener('click', () => this.clearAuthorImagePreview());

        // Bulk actions
        const bulkApply = document.querySelector('.bulk-apply');
        if (bulkApply) bulkApply.addEventListener('click', () => this.applyBulkAction());

        // Pagination
        const prevPage = document.querySelector('.pagination-btn[aria-label="Previous page"]');
        const nextPage = document.querySelector('.pagination-btn[aria-label="Next page"]');
        if (prevPage) prevPage.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.render(); } });
        if (nextPage) nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredPosts.length / this.itemsPerPage);
            if (this.currentPage < totalPages) { this.currentPage++; this.render(); }
        });
    }

    // ─── Filter / Search ──────────────────────────────────────────────────────

    applyFilters() {
        this.filteredPosts = this.posts.filter(post => {
            const statusOk   = this.currentFilter.status   === 'all' || post.status   === this.currentFilter.status;
            const categoryOk = this.currentFilter.category === 'all' || post.category === this.currentFilter.category;
            return statusOk && categoryOk;
        });
        this.render();
    }

    search(query) {
        if (!query.trim()) {
            this.filteredPosts = [...this.posts];
        } else {
            const q = query.toLowerCase();
            this.filteredPosts = this.posts.filter(p =>
                p.title.toLowerCase().includes(q) ||
                (p.content || '').toLowerCase().includes(q) ||
                (p.author_name || '').toLowerCase().includes(q)
            );
        }
        this.currentPage = 1;
        this.render();
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        const tbody = document.querySelector('#postsTable tbody');
        if (!tbody) return;

        const start    = (this.currentPage - 1) * this.itemsPerPage;
        const end      = start + this.itemsPerPage;
        const pageData = this.filteredPosts.slice(start, end);

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="padding:40px;text-align:center;color:#6b7280;">
                        <i class="fas fa-inbox" style="font-size:2em;display:block;margin-bottom:8px;"></i>
                        No posts found
                    </td>
                </tr>`;
            this.updatePagination();
            return;
        }

        tbody.innerHTML = pageData.map(p => this.createRow(p)).join('');

        tbody.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', () => this.editPost(btn.dataset.id)));
        tbody.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', () => this.deletePost(btn.dataset.id)));
        tbody.querySelectorAll('.btn-view').forEach(btn =>
            btn.addEventListener('click', () => window.open(`/single.html?id=${btn.dataset.id}`, '_blank')));

        this.updatePagination();
    }

    createRow(post) {
        const date = new Date(post.published_date || post.created_at);
        const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const catLabels = { news: 'News', updates: 'Updates', stories: 'Success Stories', events: 'Events' };
        const catLabel  = catLabels[post.category] || post.category;

        const imgUrl = post.featured_image || post.image_url;
        const thumb = this.isValidImageUrl(imgUrl)
            ? `<img src="${imgUrl}" alt="" class="post-thumb">`
            : `<div class="post-thumb-placeholder"><i class="fas fa-image"></i></div>`;

        return `
            <tr>
                <td><input type="checkbox" class="select-item" data-id="${post.id}" aria-label="Select post"></td>
                <td>
                    <div class="post-preview">
                        ${thumb}
                        <div>
                            <strong>${this.esc(post.title)}</strong>
                            <small class="text-muted">${this.esc((post.excerpt || post.content || '').substring(0, 60))}…</small>
                        </div>
                    </div>
                </td>
                <td><span class="category-badge ${post.category}">${catLabel}</span></td>
                <td>${this.esc(post.author_name || 'Admin')}</td>
                <td>${dateStr}</td>
                <td>${post.views_count || 0}</td>
                <td><span class="status-badge status-${post.status}">${post.status}</span></td>
                <td class="action-buttons">
                    <button class="btn-view" data-id="${post.id}" title="View Post"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" data-id="${post.id}" title="Edit Post"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${post.id}" title="Delete Post"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    }

    updatePagination() {
        const total      = this.filteredPosts.length;
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const start      = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const end        = Math.min(this.currentPage * this.itemsPerPage, total);

        const info = document.querySelector('.pagination-info');
        if (info) info.textContent = `Showing ${start}–${end} of ${total} posts`;

        const prevBtn = document.querySelector('.pagination-btn[aria-label="Previous page"]');
        const nextBtn = document.querySelector('.pagination-btn[aria-label="Next page"]');
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    // ─── Modal Open/Close ─────────────────────────────────────────────────────

    openModal(post = null) {
        if (!this.modal || !this.form) return;

        this.editingPostId = post ? post.id : null;
        this._featuredImageB64 = null;
        this._authorImageB64   = null;

        if (this.modalTitle) this.modalTitle.textContent = post ? 'Edit Post' : 'Add New Post';
        if (this.submitBtn)  this.submitBtn.textContent  = post ? 'Update Post' : 'Save Post';

        // Reset then populate
        this.form.reset();
        this.clearImagePreview();
        this.clearAuthorImagePreview();

        if (post) {
            document.getElementById('postTitle').value    = post.title       || '';
            document.getElementById('postCategory').value = post.category    || 'news';
            document.getElementById('postAuthor').value   = post.author_name || '';
            document.getElementById('postExcerpt').value  = post.excerpt     || '';
            document.getElementById('postContent').value  = post.content     || '';
            document.getElementById('postStatus').value   = post.status      || 'draft';
            const dateInput = document.getElementById('postDate');
            if (dateInput && post.published_date) {
                dateInput.value = post.published_date.slice(0, 16);
            }
            // Preload featured image
            if (post.featured_image && this.isValidImageUrl(post.featured_image)) {
                const preview = document.getElementById('imagePreview');
                const img     = document.getElementById('previewImage');
                if (preview && img) {
                    img.src = post.featured_image;
                    preview.style.display = 'block';
                }
                this._featuredImageB64 = post.featured_image;
            }
            // Preload author avatar
            if (post.author_image && this.isValidImageUrl(post.author_image)) {
                const preview = document.getElementById('authorImagePreview');
                const img     = document.getElementById('previewAuthorImage');
                if (preview && img) {
                    img.src = post.author_image;
                    preview.style.display = 'block';
                }
                this._authorImageB64 = post.author_image;
            }
        }

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editingPostId = null;
        this._featuredImageB64 = null;
        this._authorImageB64   = null;
        if (this.form) this.form.reset();
    }

    // ─── CRUD Operations ──────────────────────────────────────────────────────

    async savePost() {
        if (!this.form) return;

        const data = {
            title:          document.getElementById('postTitle')?.value.trim(),
            category:       document.getElementById('postCategory')?.value,
            author_name:    document.getElementById('postAuthor')?.value.trim(),
            excerpt:        document.getElementById('postExcerpt')?.value.trim(),
            content:        document.getElementById('postContent')?.value.trim(),
            status:         document.getElementById('postStatus')?.value,
            published_date: document.getElementById('postDate')?.value || null,
            featured_image: this._featuredImageB64 || null,
            author_image:   this._authorImageB64   || null
        };

        if (!data.title || !data.content) {
            this.showNotification('Title and Content are required', 'error');
            return;
        }

        if (this.submitBtn) this.submitBtn.disabled = true;

        try {
            let result;
            if (this.editingPostId) {
                result = await Posts.update(this.editingPostId, data);
            } else {
                result = await Posts.create(data);
            }

            if (result.success) {
                this.showNotification(this.editingPostId ? 'Post updated!' : 'Post created!', 'success');
                this.closeModal();
                await this.loadPosts();
            } else {
                this.showNotification(result.error || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save post error:', err);
            this.showNotification('Server error — please try again', 'error');
        } finally {
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    editPost(postId) {
        const post = this.posts.find(p => p.id == postId);
        if (post) this.openModal(post);
    }

    async deletePost(postId) {
        const post = this.posts.find(p => p.id == postId);
        if (!confirm(`Delete "${post?.title || 'this post'}"? This cannot be undone.`)) return;

        try {
            const result = await Posts.delete(postId);
            if (result.success) {
                this.posts = this.posts.filter(p => p.id != postId);
                this.applyFilters();
                this.updateStats();
                this.updateCategoryDistribution();
                this.showNotification('Post deleted', 'success');
            } else {
                this.showNotification(result.error || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            this.showNotification('Server error', 'error');
        }
    }

    // ─── Bulk Actions ─────────────────────────────────────────────────────────

    async applyBulkAction() {
        const actionSelect = document.querySelector('.bulk-action-select');
        const action = actionSelect?.value;
        if (!action) return;

        const selected = [...document.querySelectorAll('.select-item:checked')].map(cb => cb.dataset.id);
        if (selected.length === 0) {
            this.showNotification('No posts selected', 'error');
            return;
        }

        if (action === 'delete') {
            if (!confirm(`Delete ${selected.length} post(s)? This cannot be undone.`)) return;
        }

        let successCount = 0;
        for (const id of selected) {
            try {
                let result;
                if (action === 'delete') {
                    result = await Posts.delete(id);
                } else {
                    result = await Posts.update(id, { status: action === 'publish' ? 'published' : action });
                }
                if (result.success) successCount++;
            } catch (_) { /* continue */ }
        }

        this.showNotification(`${successCount}/${selected.length} posts updated`, 'success');
        await this.loadPosts();
        if (actionSelect) actionSelect.value = '';
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    updateStats() {
        const stats = {
            total:     this.posts.length,
            published: this.posts.filter(p => p.status === 'published').length,
            draft:     this.posts.filter(p => p.status === 'draft').length,
            archived:  this.posts.filter(p => p.status === 'archived').length
        };

        const items = document.querySelectorAll('.stat-item');
        if (items[0]) items[0].querySelector('.stat-number').textContent = stats.total;
        if (items[1]) items[1].querySelector('.stat-number').textContent = stats.published;
        if (items[2]) items[2].querySelector('.stat-number').textContent = stats.draft;
        if (items[3]) items[3].querySelector('.stat-number').textContent = stats.archived;
    }

    updateCategoryDistribution() {
        const cats = { news: 0, stories: 0, events: 0, updates: 0 };
        this.posts.forEach(p => { if (cats[p.category] !== undefined) cats[p.category]++; });

        const total = this.posts.length || 1;
        const catItems = document.querySelectorAll('.category-item');
        const keys = ['news', 'stories', 'events', 'updates'];

        catItems.forEach((item, i) => {
            const key   = keys[i];
            if (!key) return;
            const count = cats[key];
            const pct   = Math.round((count / total) * 100);

            const fill  = item.querySelector('.category-fill');
            if (fill) {
                fill.className = `category-fill`;
                fill.style.width = pct + '%';
            }
            const countEl = item.querySelector('.category-count');
            if (countEl) countEl.textContent = `${count} post${count !== 1 ? 's' : ''}`;
        });
    }

    // ─── Image Helpers ────────────────────────────────────────────────────────

    previewFeaturedImage(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const preview = document.getElementById('imagePreview');
            const img     = document.getElementById('previewImage');
            if (preview && img) {
                img.src = ev.target.result;
                preview.style.display = 'block';
            }
            this._featuredImageB64 = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    previewAuthorImage(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const preview = document.getElementById('authorImagePreview');
            const img     = document.getElementById('previewAuthorImage');
            if (preview && img) {
                img.src = ev.target.result;
                preview.style.display = 'block';
            }
            this._authorImageB64 = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        const input   = document.getElementById('postImage');
        if (preview) preview.style.display = 'none';
        if (input)   input.value = '';
        this._featuredImageB64 = null;
    }

    clearAuthorImagePreview() {
        const preview = document.getElementById('authorImagePreview');
        const input   = document.getElementById('postAuthorImage');
        if (preview) preview.style.display = 'none';
        if (input)   input.value = '';
        this._authorImageB64 = null;
    }

    // ─── Query Param Auto-Open ────────────────────────────────────────────────

    checkQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const id     = params.get('id');

        if (action === 'add') {
            // Wait for posts to load, then open modal
            const tryOpen = () => {
                this.openModal();
            };
            setTimeout(tryOpen, 600);
        } else if (action === 'edit' && id) {
            const tryEdit = () => {
                const post = this.posts.find(p => String(p.id) === String(id));
                if (post) {
                    this.openModal(post);
                } else {
                    // Retry after posts are loaded
                    setTimeout(() => {
                        const p2 = this.posts.find(p => String(p.id) === String(id));
                        if (p2) this.openModal(p2);
                    }, 1200);
                }
            };
            setTimeout(tryEdit, 600);
        }
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    showLoading() {
        const tbody = document.querySelector('#postsTable tbody');
        if (tbody) tbody.innerHTML = `
            <tr><td colspan="8" style="padding:40px;text-align:center;">
                <div class="loading-spinner"></div><p>Loading posts…</p>
            </td></tr>`;
    }

    showError(message) {
        const tbody = document.querySelector('#postsTable tbody');
        if (tbody) tbody.innerHTML = `
            <tr><td colspan="8" style="padding:40px;text-align:center;color:#ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size:2em;display:block;margin-bottom:8px;"></i>
                <p>${message}</p>
                <button class="btn-secondary" onclick="location.reload()">Retry</button>
            </td></tr>`;
    }

    showNotification(message, type = 'info') {
        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText = `
            position:fixed;top:20px;right:20px;z-index:10000;
            padding:14px 20px;border-radius:8px;font-size:14px;font-weight:500;
            color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.2);
            background:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }

    isValidImageUrl(url) {
        if (!url) return false;
        const clean = url.trim();
        return clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/');
    }

    esc(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

document.addEventListener('DOMContentLoaded', () => new ManagePosts());
