// Manage Team – Full CRUD with card grid, department filters, live stats

class ManageTeam {
    constructor() {
        this.members  = [];
        this.filtered = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilter = { department: 'all' };
        this.editingId = null;

        this.modal      = document.getElementById('teamModal');
        this.form       = this.modal?.querySelector('.crud-form');
        this.modalTitle = this.modal?.querySelector('.modal-header h2');
        this.submitBtn  = this.form?.querySelector('.btn-submit');
        this.grid       = document.querySelector('.team-grid-admin');

        this.init();
    }

    init() {
        this.loadMembers();
        this.setupEventListeners();
    }

    // ─── Load ─────────────────────────────────────────────────────────────────

    async loadMembers() {
        try {
            this.showLoading();
            const result = await Team.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.members  = result.data;
                this.filtered = [...this.members];
                this.applyFilters();
                this.updateStats();
                this.updateDepartmentDistribution();
            } else {
                this.showError('Failed to load team members');
            }
        } catch (err) {
            console.error('Error loading team:', err);
            this.showError('Error connecting to server');
        }
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    setupEventListeners() {
        // Department filter
        document.querySelector('[title="Filter Team by Department"]')?.addEventListener('change', e => {
            this.currentFilter.department = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        // Search
        document.querySelector('.search-input')?.addEventListener('input', e => this.search(e.target.value));

        // Add member button
        document.querySelector('[data-modal="teamModal"]')?.addEventListener('click', () => this.openModal());

        // Modal close
        if (this.modal) {
            this.modal.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
            this.modal.querySelector('.btn-cancel')?.addEventListener('click', () => this.closeModal());
            this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
        }

        // Form submit
        this.form?.addEventListener('submit', e => { e.preventDefault(); this.saveMember(); });

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
        this.filtered = this.members.filter(m => {
            return this.currentFilter.department === 'all' ||
                   (m.department || '').toLowerCase() === this.currentFilter.department;
        });
        this.render();
    }

    search(query) {
        const q = query.toLowerCase().trim();
        this.filtered = !q ? [...this.members] : this.members.filter(m =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
            (m.position   || '').toLowerCase().includes(q) ||
            (m.email      || '').toLowerCase().includes(q) ||
            (m.department || '').toLowerCase().includes(q)
        );
        this.currentPage = 1;
        this.render();
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        if (!this.grid) return;

        const start    = (this.currentPage - 1) * this.itemsPerPage;
        const pageData = this.filtered.slice(start, start + this.itemsPerPage);

        if (pageData.length === 0) {
            this.grid.innerHTML = `
                <div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:#6b7280;">
                    <i class="fas fa-user-slash" style="font-size:3em;display:block;margin-bottom:12px;"></i>
                    <p style="font-size:1.1em;">No team members found</p>
                </div>`;
            this.updatePagination();
            return;
        }

        this.grid.innerHTML = pageData.map(m => this.createCard(m)).join('');

        this.grid.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', () => this.editMember(btn.dataset.id)));
        this.grid.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', () => this.deleteMember(btn.dataset.id)));

        this.updatePagination();
    }

    createCard(m) {
        const name   = `${this.esc(m.first_name)} ${this.esc(m.last_name)}`;
        const initials = `${(m.first_name || ' ')[0]}${(m.last_name || ' ')[0]}`.toUpperCase();
        const avatar  = m.profile_image
            ? `<img src="${m.profile_image}" alt="${name}" class="member-card-avatar">`
            : `<div class="member-card-avatar-initials">${initials}</div>`;

        const deptColors = { leadership: 'purple', programs: 'pink', operations: 'cyan', volunteers: 'green' };
        const deptColor  = deptColors[(m.department || '').toLowerCase()] || 'blue';

        const socials = [
            m.linkedin_url && `<a href="${m.linkedin_url}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`,
            m.twitter_url  && `<a href="${m.twitter_url}"  target="_blank" title="Twitter"><i class="fab fa-twitter"></i></a>`,
            m.facebook_url && `<a href="${m.facebook_url}" target="_blank" title="Facebook"><i class="fab fa-facebook"></i></a>`
        ].filter(Boolean).join('');

        return `
            <div class="team-member-card">
                <div class="member-card-top">
                    ${avatar}
                    <span class="status-badge status-${m.status}" style="position:absolute;top:12px;right:12px;">${m.status}</span>
                </div>
                <div class="member-card-body">
                    <h4 class="member-name">${name}</h4>
                    <p class="member-position">${this.esc(m.position || '')}</p>
                    <span class="dept-badge dept-${deptColor}">${this.esc(m.department || 'General')}</span>
                    ${m.email ? `<p class="member-email"><i class="fas fa-envelope"></i> ${this.esc(m.email)}</p>` : ''}
                    ${m.phone ? `<p class="member-phone"><i class="fas fa-phone"></i> ${this.esc(m.phone)}</p>` : ''}
                    ${m.bio ? `<p class="member-bio">${this.esc(m.bio.substring(0, 80))}…</p>` : ''}
                    ${socials ? `<div class="member-socials">${socials}</div>` : ''}
                </div>
                <div class="member-card-actions">
                    <button class="btn-edit" data-id="${m.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-delete" data-id="${m.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }

    updatePagination() {
        const total      = this.filtered.length;
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const info = document.querySelector('.pagination-info');
        if (info) {
            const s = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
            const e = Math.min(this.currentPage * this.itemsPerPage, total);
            info.textContent = `Showing ${s}–${e} of ${total} members`;
        }
        const prev = document.querySelector('.pagination-btn[aria-label="Previous page"]');
        const next = document.querySelector('.pagination-btn[aria-label="Next page"]');
        if (prev) prev.disabled = this.currentPage <= 1;
        if (next) next.disabled = this.currentPage >= totalPages;
    }

    // ─── Modal ────────────────────────────────────────────────────────────────

    openModal(member = null) {
        if (!this.modal || !this.form) return;
        this.editingId = member?.id || null;
        if (this.modalTitle) this.modalTitle.textContent = member ? 'Edit Team Member' : 'Add Team Member';
        if (this.submitBtn)  this.submitBtn.textContent  = member ? 'Update Member' : 'Save Member';

        this.form.reset();

        if (member) {
            const f = id => document.getElementById(id);
            if (f('teamFirstName'))  f('teamFirstName').value  = member.first_name  || '';
            if (f('teamLastName'))   f('teamLastName').value   = member.last_name   || '';
            if (f('teamPosition'))   f('teamPosition').value   = member.position    || '';
            if (f('teamDepartment')) f('teamDepartment').value = member.department  || 'leadership';
            if (f('teamEmail'))      f('teamEmail').value      = member.email       || '';
            if (f('teamPhone'))      f('teamPhone').value      = member.phone       || '';
            if (f('teamBio'))        f('teamBio').value        = member.bio         || '';
            if (f('teamJoinDate'))   f('teamJoinDate').value   = (member.join_date  || '').slice(0,10);
            if (f('teamStatus'))     f('teamStatus').value     = member.status      || 'active';

            // Socials
            const socInputs = this.form.querySelectorAll('[name="linkedin"],[name="twitter"],[name="facebook"]');
            socInputs.forEach(inp => {
                const key = inp.name + '_url';
                inp.value = member[key] || '';
            });
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

    async saveMember() {
        const f = id => document.getElementById(id);
        const form = this.form;

        const data = {
            first_name:   f('teamFirstName')?.value.trim(),
            last_name:    f('teamLastName')?.value.trim(),
            position:     f('teamPosition')?.value.trim(),
            department:   f('teamDepartment')?.value,
            email:        f('teamEmail')?.value.trim(),
            phone:        f('teamPhone')?.value.trim() || null,
            bio:          f('teamBio')?.value.trim() || null,
            join_date:    f('teamJoinDate')?.value || null,
            status:       f('teamStatus')?.value || 'active',
            linkedin_url: form?.querySelector('[name="linkedin"]')?.value.trim() || null,
            twitter_url:  form?.querySelector('[name="twitter"]')?.value.trim()  || null,
            facebook_url: form?.querySelector('[name="facebook"]')?.value.trim() || null
        };

        if (!data.first_name || !data.last_name || !data.position || !data.email) {
            this.showNotification('First name, last name, position, and email are required', 'error');
            return;
        }

        if (this.submitBtn) this.submitBtn.disabled = true;

        try {
            const result = this.editingId
                ? await Team.update(this.editingId, data)
                : await Team.create(data);

            if (result.success) {
                this.showNotification(this.editingId ? 'Member updated!' : 'Member added!', 'success');
                this.closeModal();
                await this.loadMembers();
            } else {
                this.showNotification(result.error || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save member error:', err);
            this.showNotification('Server error — please try again', 'error');
        } finally {
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    editMember(id) {
        const member = this.members.find(m => m.id == id);
        if (member) this.openModal(member);
    }

    async deleteMember(id) {
        const m = this.members.find(m => m.id == id);
        const name = m ? `${m.first_name} ${m.last_name}` : 'this member';
        if (!confirm(`Remove "${name}" from the team? This cannot be undone.`)) return;

        try {
            const result = await Team.delete(id);
            if (result.success) {
                this.members  = this.members.filter(m => m.id != id);
                this.applyFilters();
                this.updateStats();
                this.updateDepartmentDistribution();
                this.showNotification('Member removed', 'success');
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
        const nums = document.querySelectorAll('.overview-number');
        const depts = [...new Set(this.members.map(m => m.department).filter(Boolean))];
        if (nums[0]) nums[0].textContent = this.members.length;
        if (nums[1]) nums[1].textContent = depts.length;
        if (nums[2]) nums[2].textContent = this.members.filter(m => m.status === 'active').length;
        if (nums[3]) nums[3].textContent = this.members.filter(m => (m.department || '').toLowerCase() === 'volunteers').length;
    }

    updateDepartmentDistribution() {
        const deptKeys  = ['leadership', 'programs', 'operations', 'volunteers'];
        const total     = this.members.length || 1;
        const deptItems = document.querySelectorAll('.department-item');

        deptItems.forEach((item, i) => {
            const key   = deptKeys[i];
            if (!key) return;
            const count = this.members.filter(m => (m.department || '').toLowerCase() === key).length;
            const pct   = Math.round((count / total) * 100);

            const fill    = item.querySelector('.department-fill');
            const countEl = item.querySelector('.department-count');
            if (fill)    { fill.className = 'department-fill'; fill.style.width = pct + '%'; }
            if (countEl) countEl.textContent = `${count} member${count !== 1 ? 's' : ''}`;
        });
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    showLoading() {
        if (this.grid) this.grid.innerHTML = `
            <div style="grid-column:1/-1;padding:60px;text-align:center;">
                <div class="loading-spinner"></div><p>Loading team members…</p>
            </div>`;
    }

    showError(message) {
        if (this.grid) this.grid.innerHTML = `
            <div style="grid-column:1/-1;padding:60px;text-align:center;color:#ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size:2.5em;display:block;margin-bottom:10px;"></i>
                <p>${message}</p>
                <button class="btn-secondary" onclick="location.reload()">Retry</button>
            </div>`;
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
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

document.addEventListener('DOMContentLoaded', () => new ManageTeam());
