// Manage Partners – Full CRUD connected to api.js

class ManagePartners {
    constructor() {
        this.partners  = [];
        this.filtered  = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.editingId = null;

        this.modal      = document.getElementById('partnerModal');
        this.form       = this.modal?.querySelector('.crud-form');
        this.modalTitle = this.modal?.querySelector('.modal-header h2');
        this.submitBtn  = this.form?.querySelector('.btn-submit');

        this.init();
    }

    init() {
        this.loadPartners();
        this.setupEventListeners();
    }

    // ─── Load ─────────────────────────────────────────────────────────────────

    async loadPartners() {
        try {
            this.showLoading();
            const result = await Partners.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.partners = result.data;
                this.filtered = [...this.partners];
                this.applyFilters();
                this.updateStats();
                this.updateLevelsDistribution();
                this.loadRecentActivities();
            } else {
                this.showError('Failed to load partners');
            }
        } catch (err) {
            console.error('Error loading partners:', err);
            this.showError('Error connecting to server');
        }
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    setupEventListeners() {
        // Search
        document.querySelector('.search-input')?.addEventListener('input', e => this.search(e.target.value));

        // Type filter
        document.querySelector('[title="Filter Partners by Type"]')?.addEventListener('change', e => {
            this.currentFilterType = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        // Add button
        document.querySelector('[data-modal="partnerModal"]')?.addEventListener('click', () => this.openModal());

        // Modal close
        if (this.modal) {
            this.modal.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
            this.modal.querySelector('.btn-cancel')?.addEventListener('click', () => this.closeModal());
            this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
        }

        // Form submit
        this.form?.addEventListener('submit', e => { e.preventDefault(); this.savePartner(); });

        // Select All Checkbox
        const selectAll = document.querySelector('.select-all');
        if (selectAll) {
            selectAll.addEventListener('change', e => {
                document.querySelectorAll('.partner-checkbox').forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        }

        // Pagination
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
        this.filtered = this.partners.filter(p => {
            return !this.currentFilterType || this.currentFilterType === 'all' ||
                   p.type === this.currentFilterType;
        });
        this.currentPage = 1;
        this.render();
    }

    search(query) {
        const q = query.toLowerCase().trim();
        this.filtered = !q ? [...this.partners] : this.partners.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.contact_person || '').toLowerCase().includes(q) ||
            (p.email          || '').toLowerCase().includes(q)
        );
        this.currentPage = 1;
        this.render();
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        const tbody = document.querySelector('#partnersTable tbody');
        if (!tbody) return;

        const start    = (this.currentPage - 1) * this.itemsPerPage;
        const pageData = this.filtered.slice(start, start + this.itemsPerPage);

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7" style="padding:40px;text-align:center;color:#6b7280;">
                    <i class="fas fa-handshake" style="font-size:2.5em;display:block;margin-bottom:8px;"></i>
                    <p>No partners found</p>
                </td></tr>`;
            this.updatePagination();
            return;
        }

        tbody.innerHTML = pageData.map(p => this.createRow(p)).join('');

        tbody.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', () => this.editPartner(btn.dataset.id)));
        tbody.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', () => this.deletePartner(btn.dataset.id)));

        this.updatePagination();
    }

    getInitialsAndGradient(name) {
        if (!name) return { initials: 'PT', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' };
        const cleanWords = name.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => !['of', 'and', 'the', 'for', 'in'].includes(w.toLowerCase()));
        let initials = '';
        if (cleanWords.length >= 2) {
            initials = (cleanWords[0][0] + cleanWords[1][0]).toUpperCase();
        } else if (cleanWords.length === 1 && cleanWords[0].length >= 2) {
            initials = cleanWords[0].substring(0, 2).toUpperCase();
        } else {
            initials = (name.substring(0, 2) || 'PT').toUpperCase();
        }

        const gradients = [
            'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            'linear-gradient(135deg, #10b981, #047857)',
            'linear-gradient(135deg, #ec4899, #be185d)',
            'linear-gradient(135deg, #f59e0b, #b45309)',
            'linear-gradient(135deg, #06b6d4, #0e7490)',
            'linear-gradient(135deg, #6366f1, #4338ca)'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const gradient = gradients[Math.abs(hash) % gradients.length];
        return { initials, gradient };
    }

    renderPartnerLogo(p) {
        const { initials, gradient } = this.getInitialsAndGradient(p.name);
        if (p.logo_url) {
            const norm = this.normalizeImageUrl(p.logo_url);
            return `
                <img src="${norm}" alt="${this.esc(p.name)}" class="partner-logo" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="partner-logo-avatar" style="display:none;background:${gradient};">${initials}</div>`;
        }
        return `<div class="partner-logo-avatar" style="background:${gradient};">${initials}</div>`;
    }

    createRow(p) {
        const logo = this.renderPartnerLogo(p);
        const startDate = p.start_date ? String(p.start_date).substring(0, 10) : '—';
        const levelKey = (p.level || 'bronze').toLowerCase();

        return `
            <tr>
                <td class="select-checkbox-col-50">
                    <input type="checkbox" class="partner-checkbox" data-id="${p.id}" aria-label="Select ${this.esc(p.name)}">
                </td>
                <td>
                    <div class="partner-info">
                        ${logo}
                        <div>
                            <strong style="display:block;color:var(--dark-color);">${this.esc(p.name)}</strong>
                            <small style="color:var(--text-light);">${this.esc(p.contact_person || '—')}</small>
                        </div>
                    </div>
                </td>
                <td><span class="partner-type-badge">${this.esc(p.type || '—')}</span></td>
                <td>
                    <div class="contact-cell">
                        ${p.email ? `<div><i class="fas fa-envelope"></i> <span>${this.esc(p.email)}</span></div>` : ''}
                        ${p.phone ? `<div><i class="fas fa-phone"></i> <span>${this.esc(p.phone)}</span></div>` : ''}
                        ${!p.email && !p.phone ? '<span style="color:var(--text-light);">—</span>' : ''}
                    </div>
                </td>
                <td><span class="badge badge-${levelKey}">${this.esc(p.level || '—')}</span></td>
                <td><span style="color:var(--text-light);font-size:0.85rem;">${startDate}</span></td>
                <td><span class="status-badge status-${p.status}">${this.esc(p.status)}</span></td>
                <td class="action-buttons">
                    <button class="btn-edit" data-id="${p.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    }

    updatePagination() {
        const total      = this.filtered.length;
        const totalPages = Math.ceil(total / this.itemsPerPage) || 1;
        const info = document.querySelector('.pagination-info');
        if (info) {
            const s = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
            const e = Math.min(this.currentPage * this.itemsPerPage, total);
            info.textContent = total === 0 ? 'No partners found' : `Showing ${s}–${e} of ${total} partners`;
        }
        const prev = document.querySelector('.pagination-btn[aria-label="Previous page"]');
        const next = document.querySelector('.pagination-btn[aria-label="Next page"]');
        if (prev) prev.disabled = this.currentPage <= 1;
        if (next) next.disabled = this.currentPage >= totalPages;

        const numbersContainer = document.querySelector('.pagination-numbers');
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

    // ─── Modal ────────────────────────────────────────────────────────────────

    openModal(partner = null) {
        if (!this.modal || !this.form) return;
        this.editingId = partner?.id || null;
        if (this.modalTitle) this.modalTitle.textContent = partner ? 'Edit Partner' : 'Add New Partner';
        if (this.submitBtn)  this.submitBtn.textContent  = partner ? 'Update Partner' : 'Save Partner';

        this.form.reset();

        if (partner) {
            const f = id => document.getElementById(id);
            if (f('partnerName'))    f('partnerName').value    = partner.name            || '';
            if (f('partnerType'))    f('partnerType').value    = partner.type            || 'corporate';
            if (f('partnerLevel'))   f('partnerLevel').value   = partner.level           || 'standard';
            if (f('partnerEmail'))   f('partnerEmail').value   = partner.email           || '';
            if (f('partnerPhone'))   f('partnerPhone').value   = partner.phone           || '';
            if (f('partnerContact')) f('partnerContact').value = partner.contact_person  || '';
            if (f('partnerWebsite')) f('partnerWebsite').value = partner.website         || '';
            if (f('partnerStatus'))  f('partnerStatus').value  = partner.status          || 'active';
            if (f('partnerDescription'))    f('partnerDescription').value    = partner.description     || '';
        }

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editingId = null;
        this.form?.reset();
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    async savePartner() {
        const f = id => document.getElementById(id);
        const data = {
            name:           f('partnerName')?.value.trim(),
            type:           f('partnerType')?.value,
            level:          f('partnerLevel')?.value,
            email:          f('partnerEmail')?.value.trim()   || null,
            phone:          f('partnerPhone')?.value.trim()   || null,
            contact_person: f('partnerContact')?.value.trim() || null,
            website:        f('partnerWebsite')?.value.trim() || null,
            status:         f('partnerStatus')?.value         || 'active',
            description:    f('partnerDescription')?.value.trim()   || null
        };

        if (!data.name) {
            this.showNotification('Partner name is required', 'error');
            return;
        }

        if (this.submitBtn) this.submitBtn.disabled = true;

        try {
            const result = this.editingId
                ? await Partners.update(this.editingId, data)
                : await Partners.create(data);

            if (result.success) {
                this.showNotification(this.editingId ? 'Partner updated!' : 'Partner added!', 'success');
                this.closeModal();
                await this.loadPartners();
                window.updateSidebarBadges?.();
            } else {
                this.showNotification(result.error || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save partner error:', err);
            this.showNotification('Server error — please try again', 'error');
        } finally {
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    editPartner(id) {
        const partner = this.partners.find(p => p.id == id);
        if (partner) this.openModal(partner);
    }

    async deletePartner(id) {
        const p = this.partners.find(p => p.id == id);
        const confirmed = await window.confirmDelete({
            title: 'Remove Partner',
            message: `Remove "${p?.name || 'this partner'}"? This cannot be undone.`
        });
        if (!confirmed) return;

        try {
            const result = await Partners.delete(id);
            if (result.success) {
                this.partners = this.partners.filter(p => p.id != id);
                this.filtered = this.filtered.filter(p => p.id != id);
                this.render();
                this.updateStats();
                this.updateLevelsDistribution();
                this.loadRecentActivities();
                this.showNotification('Partner removed', 'success');
                window.updateSidebarBadges?.();
            } else {
                this.showNotification(result.error || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            this.showNotification('Server error', 'error');
        }
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    updateStats() {
        const items = document.querySelectorAll('.stat-item');
        if (items[0]) items[0].querySelector('.stat-number').textContent = this.partners.length;
        if (items[1]) items[1].querySelector('.stat-number').textContent = this.partners.filter(p => p.status === 'active').length;
        if (items[2]) items[2].querySelector('.stat-number').textContent = this.partners.filter(p => p.status === 'pending').length;
        
        // Dynamic Funding calculations
        const fundingTotal = this.partners.reduce((sum, p) => sum + (parseFloat(p.funding_amount) || 0), 0);
        if (items[3]) {
            items[3].querySelector('.stat-number').textContent = fundingTotal > 0 
                ? '$' + (fundingTotal / 1000).toFixed(0) + 'K' 
                : '$0';
        }
    }

    updateLevelsDistribution() {
        const levels = ['platinum', 'gold', 'silver', 'bronze'];
        const total = this.partners.length || 1;
        const levelItems = document.querySelectorAll('.level-item');
        
        levelItems.forEach((item, i) => {
            const lvl = levels[i];
            if (!lvl) return;
            const count = this.partners.filter(p => (p.level || '').toLowerCase() === lvl).length;
            const pct = Math.round((count / total) * 100);
            
            const fill = item.querySelector('.level-fill');
            const countEl = item.querySelector('.level-count');
            if (fill) {
                fill.style.setProperty('--fill-width', pct + '%');
            }
            if (countEl) {
                countEl.textContent = `${count} partner${count !== 1 ? 's' : ''}`;
            }
        });
    }

    async loadRecentActivities() {
        const timeline = document.querySelector('.activity-timeline');
        if (!timeline) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity?type=partner`);
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                const activities = result.data;
                if (activities.length === 0) {
                    timeline.innerHTML = '<p style="color:#6b7280;padding:12px;text-align:center;">No recent partnership activities</p>';
                    return;
                }
                
                timeline.innerHTML = activities.map(act => {
                    const date = new Date(act.created_at);
                    const timeAgo = this.formatTimeAgo(date);
                    let icon = 'handshake';
                    if (act.action === 'delete') icon = 'trash';
                    else if (act.action === 'update') icon = 'edit';
                    
                    return `
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas fa-${icon}"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">${this.esc(act.description)}</div>
                                <div class="activity-desc">Partner ID: ${act.entity_id}</div>
                                <div class="activity-time">${timeAgo}</div>
                            </div>
                        </div>`;
                }).join('');
            } else {
                timeline.innerHTML = '<p style="color:#6b7280;padding:12px;text-align:center;">No recent activities</p>';
            }
        } catch (err) {
            console.error('Error loading partner activities:', err);
            timeline.innerHTML = '<p style="color:#6b7280;padding:12px;text-align:center;">Error loading activities</p>';
        }
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    showLoading() {
        const tbody = document.querySelector('#partnersTable tbody');
        if (tbody) tbody.innerHTML = `
            <tr><td colspan="8" style="padding:40px;text-align:center;">
                <div class="loading-spinner"></div><p>Loading partners…</p>
            </td></tr>`;
    }

    showError(message) {
        const tbody = document.querySelector('#partnersTable tbody');
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

    normalizeImageUrl(url) {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
            return trimmed;
        }
        if (trimmed.startsWith('../')) {
            return trimmed;
        }
        return '../' + trimmed;
    }

    esc(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

document.addEventListener('DOMContentLoaded', () => new ManagePartners());
