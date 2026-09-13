// Manage Comments Controller - GWOFO Admin Panel

class ManageComments {
    constructor() {
        this.comments = [];
        this.filtered = [];
        this.selectedComments = new Map(); // key: `${type}:${id}`, value: { id, type }
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    async init() {
        // Auth check
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'login';
            return;
        }

        this.setupEventListeners();
        await this.loadComments();
    }

    setupEventListeners() {
        const filterStatus = document.getElementById('filterStatus');
        const filterType = document.getElementById('filterType');
        const searchInput = document.querySelector('.search-input');

        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        if (filterType) {
            filterType.addEventListener('change', () => {
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentPage = 1;
                this.search(e.target.value);
            });
        }

        // Select all checkbox
        const selectAll = document.getElementById('selectAllComments');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checked = e.target.checked;
                const pageData = this.getCurrentPageData();
                pageData.forEach(c => {
                    const key = `${c.type}:${c.id}`;
                    if (checked) {
                        this.selectedComments.set(key, { id: c.id, type: c.type });
                    } else {
                        this.selectedComments.delete(key);
                    }
                });

                document.querySelectorAll('.select-comment-item').forEach(cb => {
                    cb.checked = checked;
                    if (checked) cb.closest('tr')?.style.setProperty('background', '#f8fafc');
                    else cb.closest('tr')?.style.removeProperty('background');
                });
                this.updateSelectionUI();
            });
        }

        // Pagination Prev / Next
        const prevBtn = document.getElementById('commentsPrevBtn');
        const nextBtn = document.getElementById('commentsNextBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.render();
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filtered.length / this.itemsPerPage) || 1;
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.render();
                }
            });
        }

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

    getCurrentPageData() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filtered.slice(start, start + this.itemsPerPage);
    }

    async loadComments() {
        const tbody = document.getElementById('commentsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
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
                this.selectedComments.clear();
                this.updateStats();
                this.applyFilters();
            } else {
                this.showError('Failed to load comments');
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            this.showError('Authentication or network error: ' + (err.message || 'Please sign in again'));
            if (err.message && err.message.includes('401')) {
                setTimeout(() => window.location.href = 'login', 1500);
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

        const totalPages = Math.ceil(this.filtered.length / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) {
            this.currentPage = totalPages;
        }

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

        this.currentPage = 1;
        this.render();
    }

    render() {
        const tbody = document.getElementById('commentsTableBody');
        if (!tbody) return;

        if (this.filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-comment-slash fa-2x" style="margin-bottom:10px; opacity:0.5;"></i>
                        <p>No comments found matching the criteria.</p>
                    </td>
                </tr>`;
            this.updateSelectionUI();
            this.updatePagination();
            return;
        }

        const pageData = this.getCurrentPageData();

        tbody.innerHTML = pageData.map(c => {
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

            const key = `${c.type}:${c.id}`;
            const isSelected = this.selectedComments.has(key);

            return `
                <tr style="border-bottom:1px solid #f1f5f9; transition: background 0.2s; ${isSelected ? 'background:#f8fafc;' : ''}" onmouseover="if(!this.querySelector('.select-comment-item').checked) this.style.background='#f8fafc'" onmouseout="if(!this.querySelector('.select-comment-item').checked) this.style.background='transparent'">
                    <td style="padding:14px 16px; text-align:center;">
                        <input type="checkbox" class="select-comment-item" data-type="${c.type}" data-id="${c.id}" ${isSelected ? 'checked' : ''}>
                    </td>
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
                        <button onclick="manageComments.viewComment('${c.type}', ${c.id})" title="View Comment Details" style="background:#003366; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                            <i class="fas fa-eye"></i>
                        </button>
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

        this.bindRowSelection();
        this.updateSelectionUI();
        this.updatePagination();
    }

    bindRowSelection() {
        document.querySelectorAll('.select-comment-item').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                const type = e.target.dataset.type;
                const key = `${type}:${id}`;
                if (e.target.checked) {
                    this.selectedComments.set(key, { id, type });
                    e.target.closest('tr')?.style.setProperty('background', '#f8fafc');
                } else {
                    this.selectedComments.delete(key);
                    e.target.closest('tr')?.style.removeProperty('background');
                }
                this.updateSelectionUI();
            });
        });
    }

    updateSelectionUI() {
        const countSpan = document.getElementById('selectedCount');
        const bulkDeleteBtn = document.getElementById('btnBulkDelete');
        const selectAll = document.getElementById('selectAllComments');

        const count = this.selectedComments.size;
        if (countSpan) countSpan.textContent = count;
        if (bulkDeleteBtn) {
            bulkDeleteBtn.style.display = count > 0 ? 'inline-flex' : 'none';
        }

        if (selectAll) {
            const pageData = this.getCurrentPageData();
            if (pageData.length === 0) {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            } else {
                const pageKeys = pageData.map(c => `${c.type}:${c.id}`);
                const selectedOnPage = pageKeys.filter(k => this.selectedComments.has(k)).length;
                if (selectedOnPage === 0) {
                    selectAll.checked = false;
                    selectAll.indeterminate = false;
                } else if (selectedOnPage === pageKeys.length) {
                    selectAll.checked = true;
                    selectAll.indeterminate = false;
                } else {
                    selectAll.checked = false;
                    selectAll.indeterminate = true;
                }
            }
        }
    }

    async bulkDeleteSelected() {
        const count = this.selectedComments.size;
        if (count === 0) return;

        const confirmed = await window.confirmDelete({
            title: 'Delete Selected Comments',
            message: `Are you sure you want to permanently delete ${count} selected comment(s)? This action cannot be undone.`
        });
        if (!confirmed) return;

        try {
            const items = Array.from(this.selectedComments.values());
            const res = await Comments.bulkDelete(items);

            if (res && res.success) {
                const deletedSet = new Set((res.deletedIds || items).map(i => `${i.type}:${i.id}`));
                this.comments = this.comments.filter(c => !deletedSet.has(`${c.type}:${c.id}`));
                this.filtered = this.filtered.filter(c => !deletedSet.has(`${c.type}:${c.id}`));
                this.selectedComments.clear();

                const totalPages = Math.ceil(this.filtered.length / this.itemsPerPage) || 1;
                if (this.currentPage > totalPages) {
                    this.currentPage = totalPages;
                }

                this.updateStats();
                this.render();
                window.updateSidebarBadges?.();
                this.showNotification(`Successfully deleted ${res.deletedCount || count} comment(s)`);
            } else {
                alert(res?.error || 'Failed to bulk delete comments');
            }
        } catch (err) {
            console.error('Error in bulkDeleteSelected:', err);
            alert('Error deleting comments: ' + (err.message || 'Please try again'));
        }
    }

    updatePagination() {
        const total = this.filtered.length;
        const totalPages = Math.ceil(total / this.itemsPerPage) || 1;
        const start = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, total);

        const info = document.getElementById('commentsPaginationInfo');
        if (info) {
            info.textContent = total === 0 ? 'No comments found' : `Showing ${start}–${end} of ${total} comments`;
        }

        const prevBtn = document.getElementById('commentsPrevBtn');
        const nextBtn = document.getElementById('commentsNextBtn');
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

        const numbersContainer = document.getElementById('commentsPaginationNumbers');
        if (numbersContainer) {
            this.renderPageNumbers(numbersContainer, this.currentPage, totalPages, (pageNum) => {
                this.currentPage = pageNum;
                this.render();
            });
        }
    }

    renderPageNumbers(container, currentPage, totalPages, onPageClick) {
        container.innerHTML = '';
        if (totalPages <= 1) {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn active';
            btn.textContent = '1';
            btn.setAttribute('aria-label', 'Page 1');
            container.appendChild(btn);
            return;
        }

        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        pages.forEach(p => {
            if (p === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '…';
                ellipsis.style.cssText = 'padding:0 6px; color:#64748b; font-weight:600; align-self:center; user-select:none;';
                container.appendChild(ellipsis);
            } else {
                const btn = document.createElement('button');
                btn.className = `pagination-btn${p === currentPage ? ' active' : ''}`;
                btn.textContent = p;
                btn.setAttribute('aria-label', `Page ${p}`);
                if (p === currentPage) btn.setAttribute('aria-current', 'page');
                btn.addEventListener('click', () => onPageClick(p));
                container.appendChild(btn);
            }
        });
    }

    showNotification(message) {
        const existing = document.getElementById('commentToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'commentToast';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);z-index:99999;font-weight:500;display:flex;align-items:center;gap:10px;font-size:0.9rem;animation:slideUp 0.3s ease-out;';
        toast.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> <span>${this.escapeHtml(message)}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    viewComment(type, id) {
        const c = this.comments.find(item => item.type === type && item.id === id);
        if (!c) return;

        const dateStr = new Date(c.created_at).toLocaleString();
        const existingModal = document.getElementById('commentDetailModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'commentDetailModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box;';

        modal.innerHTML = `
            <div style="background:#fff;border-radius:12px;max-width:550px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;animation:fadeIn 0.2s ease-out;">
                <div style="padding:18px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:1.15rem;color:#0f172a;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-comment-dots" style="color:#003366;"></i> Comment Details
                    </h3>
                    <button id="closeCommentModal" style="background:none;border:none;font-size:1.25rem;color:#64748b;cursor:pointer;padding:4px;">&times;</button>
                </div>
                <div style="padding:24px;display:flex;flex-direction:column;gap:14px;">
                    <div>
                        <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Type & Target</div>
                        <div style="font-size:0.95rem;font-weight:600;color:#0f172a;margin-top:2px;">
                            <span style="text-transform:capitalize;">${c.type}</span>: ${this.escapeHtml(c.target_title || '#' + c.target_id)}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Author</div>
                        <div style="font-size:0.92rem;color:#1e293b;margin-top:2px;">
                            <strong>${this.escapeHtml(c.author_name)}</strong> &lt;<a href="mailto:${this.escapeHtml(c.author_email)}" style="color:#003366;">${this.escapeHtml(c.author_email)}</a>&gt;
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Submitted On</div>
                        <div style="font-size:0.88rem;color:#475569;margin-top:2px;">${dateStr}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Status</div>
                        <div style="margin-top:4px;">
                            <span style="padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;text-transform:capitalize;background:${c.status==='approved'?'#dcfce7':c.status==='rejected'?'#fee2e2':'#fef3c7'};color:${c.status==='approved'?'#16a34a':c.status==='rejected'?'#dc2626':'#d97706'};">
                                ${c.status}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Comment Message</div>
                        <div style="margin-top:4px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.92rem;color:#334155;line-height:1.6;white-space:pre-wrap;max-height:180px;overflow-y:auto;">
                            ${this.escapeHtml(c.content)}
                        </div>
                    </div>
                </div>
                <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px;">
                    ${c.status !== 'approved' ? `
                        <button id="modalApproveBtn" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-check"></i> Approve
                        </button>
                    ` : ''}
                    ${c.status !== 'rejected' ? `
                        <button id="modalRejectBtn" style="background:#d97706;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-ban"></i> Reject
                        </button>
                    ` : ''}
                    <button id="modalDeleteBtn" style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('#closeCommentModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        modal.querySelector('#modalApproveBtn')?.addEventListener('click', async () => {
            await this.updateStatus(c.type, c.id, 'approved');
            closeModal();
        });
        modal.querySelector('#modalRejectBtn')?.addEventListener('click', async () => {
            await this.updateStatus(c.type, c.id, 'rejected');
            closeModal();
        });
        modal.querySelector('#modalDeleteBtn')?.addEventListener('click', async () => {
            await this.deleteComment(c.type, c.id);
            closeModal();
        });
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
                window.updateSidebarBadges?.();
            } else {
                alert(res.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status: ' + err.message);
        }
    }

    async deleteComment(type, id) {
        const confirmed = await window.confirmDelete({
            title: 'Delete Comment',
            message: 'Are you sure you want to permanently delete this comment? This action cannot be undone.'
        });
        if (!confirmed) return;

        try {
            const res = await Comments.delete(type, id);
            if (res.success) {
                const key = `${type}:${id}`;
                this.comments = this.comments.filter(c => !(c.type === type && c.id === id));
                this.filtered = this.filtered.filter(c => !(c.type === type && c.id === id));
                this.selectedComments.delete(key);

                const totalPages = Math.ceil(this.filtered.length / this.itemsPerPage) || 1;
                if (this.currentPage > totalPages) {
                    this.currentPage = totalPages;
                }

                this.updateStats();
                this.render();
                window.updateSidebarBadges?.();
                this.showNotification('Comment deleted successfully');
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
                    <td colspan="8" style="text-align:center; padding:40px; color:#dc2626;">
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
