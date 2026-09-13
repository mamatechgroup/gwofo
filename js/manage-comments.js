// Manage Comments Controller - GWOFO Admin Panel

class ManageComments {
    constructor() {
        this.comments = [];
        this.filtered = [];
        this.init();
    }

    async init() {
        // Auth check
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadComments();
    }

    setupEventListeners() {
        const filterStatus = document.getElementById('filterStatus');
        const filterType = document.getElementById('filterType');
        const searchInput = document.querySelector('.search-input');

        if (filterStatus) filterStatus.addEventListener('change', () => this.applyFilters());
        if (filterType) filterType.addEventListener('change', () => this.applyFilters());
        if (searchInput) searchInput.addEventListener('input', (e) => this.search(e.target.value));

        // Mobile drawer toggle
        const toggleBtn = document.querySelector('.mobile-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (toggleBtn && sidebar) {
            let overlay = document.querySelector('.admin-sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'admin-sidebar-overlay';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.documentElement.classList.remove('nav-open');
                    document.body.classList.remove('nav-open');
                });
                overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            }
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
                if (sidebar.classList.contains('active')) {
                    overlay.classList.add('active');
                    document.documentElement.classList.add('nav-open');
                    document.body.classList.add('nav-open');
                } else {
                    overlay.classList.remove('active');
                    document.documentElement.classList.remove('nav-open');
                    document.body.classList.remove('nav-open');
                }
            });
        }
    }

    async loadComments() {
        const tbody = document.getElementById('commentsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p style="margin-top:10px;">Loading comments...</p>
                    </td>
                </tr>`;
        }

        try {
            const statusVal = document.getElementById('filterStatus')?.value || 'all';
            const typeVal = document.getElementById('filterType')?.value || 'all';
            
            const result = await Comments.getAllAdmin(statusVal, typeVal);

            if (result.success && Array.isArray(result.data)) {
                this.comments = result.data;
                this.updateStats();
                this.applyFilters();
            } else {
                this.showError('Failed to load comments');
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            this.showError('Authentication or network error: ' + (err.message || 'Please sign in again'));
            if (err.message && err.message.includes('401')) {
                setTimeout(() => window.location.href = 'login.html', 1500);
            }
        }
    }

    updateStats() {
        const total = this.comments.length;
        const pending = this.comments.filter(c => c.status === 'pending').length;
        const approved = this.comments.filter(c => c.status === 'approved').length;
        const rejected = this.comments.filter(c => c.status === 'rejected').length;

        const statTotal = document.getElementById('statTotalComments');
        const statPending = document.getElementById('statPendingComments');
        const statApproved = document.getElementById('statApprovedComments');
        const statRejected = document.getElementById('statRejectedComments');

        if (statTotal) statTotal.textContent = total;
        if (statPending) statPending.textContent = pending;
        if (statApproved) statApproved.textContent = approved;
        if (statRejected) statRejected.textContent = rejected;
    }

    applyFilters() {
        const statusVal = document.getElementById('filterStatus')?.value || 'all';
        const typeVal = document.getElementById('filterType')?.value || 'all';

        this.filtered = this.comments.filter(c => {
            const matchesStatus = statusVal === 'all' || c.status === statusVal;
            const matchesType = typeVal === 'all' || c.type === typeVal;
            return matchesStatus && matchesType;
        });

        this.render();
    }

    search(query) {
        const q = (query || '').toLowerCase().trim();
        if (!q) {
            this.applyFilters();
            return;
        }

        this.filtered = this.comments.filter(c => 
            (c.author_name || '').toLowerCase().includes(q) ||
            (c.author_email || '').toLowerCase().includes(q) ||
            (c.content || '').toLowerCase().includes(q) ||
            (c.target_title || '').toLowerCase().includes(q)
        );

        this.render();
    }

    render() {
        const tbody = document.getElementById('commentsTableBody');
        if (!tbody) return;

        if (this.filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-comment-slash fa-2x" style="margin-bottom:10px; opacity:0.5;"></i>
                        <p>No comments found matching the criteria.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = this.filtered.map(c => {
            const isApproved = c.status === 'approved';
            const isPending = c.status === 'pending';
            const badgeColor = isApproved ? '#16a34a' : (isPending ? '#d97706' : '#dc2626');
            const badgeBg = isApproved ? '#dcfce7' : (isPending ? '#fef3c7' : '#fee2e2');
            const typeBadge = c.type === 'project' 
                ? '<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">Project</span>'
                : '<span style="background:#f3e8ff; color:#7e22ce; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">Post</span>';

            const createdDate = new Date(c.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            return `
                <tr style="border-bottom:1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding:14px 16px;">${typeBadge}</td>
                    <td style="padding:14px 16px; font-weight:600; color:#0f172a; max-width:180px;">${this.escapeHtml(c.target_title || 'General')}</td>
                    <td style="padding:14px 16px;">
                        <div style="font-weight:600; color:#1e293b;">${this.escapeHtml(c.author_name)}</div>
                        <div style="font-size:0.8rem; color:#64748b;">${this.escapeHtml(c.author_email || '')}</div>
                    </td>
                    <td style="padding:14px 16px; color:#334155; max-width:280px; font-size:0.9rem;">
                        ${this.escapeHtml(c.content)}
                    </td>
                    <td style="padding:14px 16px; color:#64748b; font-size:0.85rem; white-space:nowrap;">
                        ${createdDate}
                    </td>
                    <td style="padding:14px 16px;">
                        <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; text-transform:capitalize;">
                            ${c.status}
                        </span>
                    </td>
                    <td style="padding:14px 16px; text-align:center; white-space:nowrap;">
                        ${isPending || c.status === 'rejected' ? `
                            <button onclick="manageComments.updateStatus('${c.type}', ${c.id}, 'approved')" title="Approve Comment" style="background:#16a34a; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${isPending || c.status === 'approved' ? `
                            <button onclick="manageComments.updateStatus('${c.type}', ${c.id}, 'rejected')" title="Reject Comment" style="background:#d97706; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                        <button onclick="manageComments.deleteComment('${c.type}', ${c.id})" title="Delete Comment" style="background:#dc2626; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async updateStatus(type, id, newStatus) {
        try {
            const res = await Comments.updateStatus(type, id, newStatus);
            if (res.success) {
                // Update local comment
                const target = this.comments.find(c => c.type === type && c.id === id);
                if (target) target.status = newStatus;
                this.updateStats();
                this.applyFilters();
            } else {
                alert(res.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status: ' + err.message);
        }
    }

    async deleteComment(type, id) {
        if (!confirm('Are you sure you want to permanently delete this comment?')) return;

        try {
            const res = await Comments.delete(type, id);
            if (res.success) {
                this.comments = this.comments.filter(c => !(c.type === type && c.id === id));
                this.updateStats();
                this.applyFilters();
            } else {
                alert(res.error || 'Failed to delete comment');
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Failed to delete comment: ' + err.message);
        }
    }

    showError(msg) {
        const tbody = document.getElementById('commentsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:#dc2626;">
                        <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom:10px;"></i>
                        <p>${this.escapeHtml(msg)}</p>
                    </td>
                </tr>`;
        }
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}

const manageComments = new ManageComments();
window.manageComments = manageComments;
