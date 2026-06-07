// Manage Subscriptions – Full CRUD using api.js Newsletter helpers

class ManageSubscriptions {
    constructor() {
        this.subscriptions = [];
        this.filtered      = [];
        this.currentPage   = 1;
        this.itemsPerPage  = 20;
        this.currentFilter = { status: 'all' };

        this.init();
    }

    init() {
        this.loadSubscriptions();
        this.setupEventListeners();
    }

    // ─── Load ─────────────────────────────────────────────────────────────────

    async loadSubscriptions() {
        try {
            this.showLoading();
            const result = await Newsletter.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.subscriptions = result.data;
                this.applyFilters();
                this.updateStats();
            } else {
                this.showError('Failed to load subscriptions');
            }
        } catch (err) {
            console.error('Error loading subscriptions:', err);
            this.showError('Error connecting to server');
        }
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    setupEventListeners() {
        document.querySelector('[title="Filter by Status"]')?.addEventListener('change', e => {
            this.currentFilter.status = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        document.querySelector('.search-input')?.addEventListener('input', e => this.search(e.target.value));

        document.querySelector('.pagination-btn[aria-label="Previous page"]')?.addEventListener('click', () => {
            if (this.currentPage > 1) { this.currentPage--; this.render(); }
        });
        document.querySelector('.pagination-btn[aria-label="Next page"]')?.addEventListener('click', () => {
            const total = Math.ceil(this.filtered.length / this.itemsPerPage);
            if (this.currentPage < total) { this.currentPage++; this.render(); }
        });
    }

    // ─── Filter / Search ──────────────────────────────────────────────────────

    applyFilters() {
        this.filtered = this.subscriptions.filter(s => {
            return this.currentFilter.status === 'all' || s.status === this.currentFilter.status;
        });
        this.render();
    }

    search(query) {
        const q = query.toLowerCase().trim();
        this.filtered = !q ? [...this.subscriptions] : this.subscriptions.filter(s =>
            s.email.toLowerCase().includes(q) ||
            (s.full_name || '').toLowerCase().includes(q)
        );
        this.currentPage = 1;
        this.render();
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        const tbody = document.querySelector('#subscriptionsTable tbody');
        if (!tbody) return;

        const start    = (this.currentPage - 1) * this.itemsPerPage;
        const pageData = this.filtered.slice(start, start + this.itemsPerPage);

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="5" style="padding:40px;text-align:center;color:#6b7280;">
                    <i class="fas fa-inbox" style="font-size:2.5em;display:block;margin-bottom:8px;"></i>
                    <p>No subscriptions found</p>
                </td></tr>`;
            this.updatePagination();
            return;
        }

        tbody.innerHTML = pageData.map(s => this.createRow(s)).join('');

        tbody.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', () => this.deleteSubscription(btn.dataset.id)));
        tbody.querySelectorAll('.btn-unsubscribe').forEach(btn =>
            btn.addEventListener('click', () => this.unsubscribe(btn.dataset.id)));

        this.updatePagination();
    }

    createRow(s) {
        const date = new Date(s.subscribe_date || s.created_at);
        const dateStr = isNaN(date) ? '—' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        return `
            <tr>
                <td>${this.esc(s.email)}</td>
                <td>${this.esc(s.full_name || '—')}</td>
                <td>${dateStr}</td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td class="action-buttons">
                    ${s.status === 'active' ? `
                        <button class="btn-unsubscribe btn-secondary" data-id="${s.id}" title="Unsubscribe">
                            <i class="fas fa-times"></i> Unsub
                        </button>` : ''}
                    <button class="btn-delete" data-id="${s.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    }

    updatePagination() {
        const total      = this.filtered.length;
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const info = document.querySelector('.pagination-info');
        if (info) {
            const s = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
            const e = Math.min(this.currentPage * this.itemsPerPage, total);
            info.textContent = `Showing ${s}–${e} of ${total} subscriptions`;
        }
        const prev = document.querySelector('.pagination-btn[aria-label="Previous page"]');
        const next = document.querySelector('.pagination-btn[aria-label="Next page"]');
        if (prev) prev.disabled = this.currentPage <= 1;
        if (next) next.disabled = this.currentPage >= totalPages;
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    async deleteSubscription(id) {
        if (!confirm('Delete this subscription permanently?')) return;
        try {
            const result = await Newsletter.delete(id);
            if (result.success) {
                this.subscriptions = this.subscriptions.filter(s => s.id != id);
                this.applyFilters();
                this.updateStats();
                this.showNotification('Subscription deleted', 'success');
            } else {
                this.showNotification(result.error || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            this.showNotification('Server error', 'error');
        }
    }

    async unsubscribe(id) {
        if (!confirm('Mark this email as unsubscribed?')) return;
        try {
            const result = await Newsletter.unsubscribe(id);
            if (result.success) {
                const sub = this.subscriptions.find(s => s.id == id);
                if (sub) sub.status = 'unsubscribed';
                this.applyFilters();
                this.updateStats();
                this.showNotification('Subscription updated', 'success');
            } else {
                this.showNotification(result.error || 'Update failed', 'error');
            }
        } catch (err) {
            console.error('Unsubscribe error:', err);
            this.showNotification('Server error', 'error');
        }
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    updateStats() {
        const items = document.querySelectorAll('.stat-item');
        if (items[0]) items[0].querySelector('.stat-number').textContent = this.subscriptions.length;
        if (items[1]) items[1].querySelector('.stat-number').textContent = this.subscriptions.filter(s => s.status === 'active').length;
        if (items[2]) items[2].querySelector('.stat-number').textContent = this.subscriptions.filter(s => s.status === 'unsubscribed').length;
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    showLoading() {
        const tbody = document.querySelector('#subscriptionsTable tbody');
        if (tbody) tbody.innerHTML = `
            <tr><td colspan="5" style="padding:40px;text-align:center;">
                <div class="loading-spinner"></div><p>Loading subscriptions…</p>
            </td></tr>`;
    }

    showError(message) {
        const tbody = document.querySelector('#subscriptionsTable tbody');
        if (tbody) tbody.innerHTML = `
            <tr><td colspan="5" style="padding:40px;text-align:center;color:#ef4444;">
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

    esc(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}

document.addEventListener('DOMContentLoaded', () => new ManageSubscriptions());
