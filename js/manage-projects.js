// Manage Projects – Full CRUD with Grid/List view toggle, connected to api.js

class ManageProjects {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentPage = 1;
        this.itemsPerPage = 9;       // 3×3 grid default
        this.currentFilter = { status: 'all', category: 'all' };
        this.currentView   = 'grid'; // 'grid' | 'list'
        this.editingId     = null;

        this.modal      = document.getElementById('projectModal');
        this.form       = this.modal?.querySelector('.crud-form');
        this.modalTitle = this.modal?.querySelector('.modal-header h2');
        this.submitBtn  = this.form?.querySelector('.btn-submit');
        this.container  = document.getElementById('projectsView');

        this.init();
    }

    init() {
        this.teamMembers = [];
        this.loadProjects();
        this.loadTeamMembers();
        this.setupEventListeners();
        this.checkQueryParams();
    }

    // ─── Load ─────────────────────────────────────────────────────────────────

    async loadProjects() {
        try {
            this.showLoading();
            const result = await Projects.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.projects = result.data;
                this.applyFilters();
                this.updateOverviewStats();
            } else {
                this.showError('Failed to load projects');
            }
        } catch (err) {
            console.error('Error loading projects:', err);
            this.showError('Error connecting to server');
        }
    }

    async loadTeamMembers() {
        try {
            const result = await Team.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.teamMembers = result.data;
                this.populateManagerDropdown();
            }
        } catch (err) {
            console.error('Error loading team members:', err);
        }
    }

    populateManagerDropdown() {
        const select = document.getElementById('projectManager');
        if (!select) return;
        select.innerHTML = '<option value="">Select Manager</option>';
        if (Array.isArray(this.teamMembers)) {
            this.teamMembers.forEach(m => {
                const name = `${m.first_name} ${m.last_name}`;
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
        }
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    setupEventListeners() {
        // Filters
        document.querySelector('[title="Filter Projects by Status"]')?.addEventListener('change', e => {
            this.currentFilter.status = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });
        document.querySelector('[title="Filter Projects by Category"]')?.addEventListener('change', e => {
            this.currentFilter.category = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        // Search
        document.querySelector('.search-input')?.addEventListener('input', e => this.search(e.target.value));

        // View toggle (Grid / List)
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.itemsPerPage = this.currentView === 'grid' ? 9 : 10;
                this.currentPage  = 1;
                this.render();
            });
        });

        // Add button
        document.querySelector('[data-modal="projectModal"]')?.addEventListener('click', () => this.openModal());

        // Modal close
        if (this.modal) {
            this.modal.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
            this.modal.querySelector('.btn-cancel')?.addEventListener('click', () => this.closeModal());
            this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
        }

        // Form submit
        this.form?.addEventListener('submit', e => { e.preventDefault(); this.saveProject(); });

        // Progress range slider
        const progressSlider = document.getElementById('projectProgress');
        const progressLabel  = document.getElementById('progressValue');
        if (progressSlider && progressLabel) {
            progressSlider.addEventListener('input', () => {
                progressLabel.textContent = progressSlider.value + '%';
            });
        }

        // Pagination
        document.querySelector('.pagination-btn[aria-label="Previous page"]')?.addEventListener('click', () => {
            if (this.currentPage > 1) { this.currentPage--; this.render(); }
        });
        document.querySelector('.pagination-btn[aria-label="Next page"]')?.addEventListener('click', () => {
            const total = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
            if (this.currentPage < total) { this.currentPage++; this.render(); }
        });
    }

    // ─── Query Param Auto-Open ────────────────────────────────────────────────

    checkQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const id     = params.get('id');

        if (action === 'add') {
            setTimeout(() => this.openModal(), 600);
        } else if (action === 'edit' && id) {
            const tryEdit = () => {
                const project = this.projects.find(p => String(p.id) === String(id));
                if (project) {
                    this.editProject(project.id);
                } else {
                    setTimeout(() => {
                        const p2 = this.projects.find(p => String(p.id) === String(id));
                        if (p2) this.editProject(p2.id);
                    }, 1200);
                }
            };
            setTimeout(tryEdit, 600);
        }
    }

    // ─── Filter / Search ──────────────────────────────────────────────────────

    applyFilters() {
        this.filteredProjects = this.projects.filter(p => {
            const sOk = this.currentFilter.status   === 'all' || p.status   === this.currentFilter.status;
            const cOk = this.currentFilter.category === 'all' || p.category === this.currentFilter.category;
            return sOk && cOk;
        });
        this.render();
    }

    search(query) {
        const q = query.toLowerCase().trim();
        this.filteredProjects = !q
            ? [...this.projects]
            : this.projects.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.location    || '').toLowerCase().includes(q));
        this.currentPage = 1;
        this.render();
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        if (!this.container) return;

        const start    = (this.currentPage - 1) * this.itemsPerPage;
        const end      = start + this.itemsPerPage;
        const pageData = this.filteredProjects.slice(start, end);

        if (pageData.length === 0) {
            this.container.innerHTML = `
                <div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:#6b7280;">
                    <i class="fas fa-inbox" style="font-size:3em;display:block;margin-bottom:12px;"></i>
                    <p style="font-size:1.1em;">No projects found</p>
                </div>`;
            this.updatePagination();
            return;
        }

        if (this.currentView === 'grid') {
            this.container.className = 'projects-grid';
            this.container.innerHTML = pageData.map(p => this.createCard(p)).join('');
        } else {
            this.container.className = 'projects-list';
            this.container.innerHTML = `
                <table class="data-table" id="projectsTable">
                    <thead><tr>
                        <th>Name</th><th>Category</th><th>Location</th>
                        <th>Progress</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>${pageData.map(p => this.createRow(p)).join('')}</tbody>
                </table>`;
        }

        this.container.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', () => this.editProject(btn.dataset.id)));
        this.container.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', () => this.deleteProject(btn.dataset.id)));

        this.updatePagination();
    }

    createCard(p) {
        const pct    = p.progress_percentage || 0;
        const catMap = { education: 'Education', economic: 'Economic Empowerment', healthcare: 'Healthcare', advocacy: 'Advocacy' };
        const cat    = catMap[p.category] || p.category || 'General';

        return `
            <div class="project-card">
                ${p.image_url && this.isValidImageUrl(p.image_url) ? `<div class="project-card-image"><img src="${p.image_url}" alt="${this.esc(p.name)}"></div>` : ''}
                <div class="project-card-body">
                    <div class="project-card-header">
                        <span class="category-badge ${p.category}">${cat}</span>
                        <span class="status-badge status-${p.status}">${p.status}</span>
                    </div>
                    <h3 class="project-card-title">${this.esc(p.name)}</h3>
                    <p class="project-card-desc">${this.esc((p.description || '').substring(0, 100))}…</p>
                    ${p.location ? `<p class="project-card-location"><i class="fas fa-map-marker-alt"></i> ${this.esc(p.location)}</p>` : ''}
                    <div class="project-progress-bar">
                        <div class="progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="project-progress-label">
                        <span>${pct}% complete</span>
                        ${p.goal_amount ? `<span>Goal: $${Number(p.goal_amount).toLocaleString()}</span>` : ''}
                    </div>
                </div>
                <div class="project-card-actions">
                    <button class="btn-edit" data-id="${p.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-delete" data-id="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }

    createRow(p) {
        const pct    = p.progress_percentage || 0;
        const catMap = { education: 'Education', economic: 'Economic Empowerment', healthcare: 'Healthcare', advocacy: 'Advocacy' };
        const cat    = catMap[p.category] || p.category || 'General';

        return `
            <tr>
                <td><strong>${this.esc(p.name)}</strong></td>
                <td>${cat}</td>
                <td>${this.esc(p.location || '—')}</td>
                <td>
                    <div class="progress-bar" style="min-width:80px;">
                        <div class="progress" style="width:${pct}%"></div>
                    </div>
                    <small>${pct}%</small>
                </td>
                <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                <td class="action-buttons">
                    <button class="btn-edit" data-id="${p.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    }

    updatePagination() {
        const total      = this.filteredProjects.length;
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const info = document.querySelector('.pagination-info');
        if (info) {
            const start = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
            const end   = Math.min(this.currentPage * this.itemsPerPage, total);
            info.textContent = `Showing ${start}–${end} of ${total} projects`;
        }
        const prevBtn = document.querySelector('.pagination-btn[aria-label="Previous page"]');
        const nextBtn = document.querySelector('.pagination-btn[aria-label="Next page"]');
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    // ─── Modal ────────────────────────────────────────────────────────────────

    openModal(project = null) {
        if (!this.modal || !this.form) return;
        this.editingId = project?.id || null;
        if (this.modalTitle) this.modalTitle.textContent = project ? 'Edit Project' : 'Add New Project';
        if (this.submitBtn)  this.submitBtn.textContent  = project ? 'Update Project' : 'Save Project';

        this.form.reset();
        const progressSlider = document.getElementById('projectProgress');
        const progressLabel  = document.getElementById('progressValue');
        if (progressSlider) progressSlider.value = 0;
        if (progressLabel)  progressLabel.textContent = '0%';

        if (project) {
            const f = id => document.getElementById(id);
            f('projectName')?.     setAttribute('value', project.name || '');
            if (f('projectName')) f('projectName').value = project.name || '';
            if (f('projectCategory')) f('projectCategory').value = project.category || 'education';
            if (f('projectStatus'))   f('projectStatus').value   = project.status   || 'planning';
            if (f('projectDescription')) f('projectDescription').value = project.description || '';
            if (f('projectStartDate')) f('projectStartDate').value = (project.start_date || '').slice(0, 10);
            if (f('projectEndDate'))   f('projectEndDate').value   = (project.end_date   || '').slice(0, 10);
            if (f('projectGoal'))      f('projectGoal').value      = project.goal_amount || '';
            if (f('projectLocation'))  f('projectLocation').value  = project.location    || '';
            if (f('projectManager'))   f('projectManager').value   = project.manager_name  || '';
            if (progressSlider) { progressSlider.value = project.progress_percentage || 0; }
            if (progressLabel)  { progressLabel.textContent = (project.progress_percentage || 0) + '%'; }
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

    async saveProject() {
        const f = id => document.getElementById(id);
        const data = {
            name:                f('projectName')?.value.trim(),
            category:            f('projectCategory')?.value,
            status:              f('projectStatus')?.value,
            description:         f('projectDescription')?.value.trim(),
            start_date:          f('projectStartDate')?.value || null,
            end_date:            f('projectEndDate')?.value   || null,
            goal_amount:         f('projectGoal')?.value      || null,
            location:            f('projectLocation')?.value.trim(),
            manager_name:        f('projectManager')?.value   || null,
            progress_percentage: Number(f('projectProgress')?.value || 0)
        };

        if (!data.name || !data.description) {
            this.showNotification('Name and Description are required', 'error');
            return;
        }

        if (this.submitBtn) this.submitBtn.disabled = true;

        try {
            const result = this.editingId
                ? await Projects.update(this.editingId, data)
                : await Projects.create(data);

            if (result.success) {
                this.showNotification(this.editingId ? 'Project updated!' : 'Project created!', 'success');
                this.closeModal();
                await this.loadProjects();
            } else {
                this.showNotification(result.error || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save project error:', err);
            this.showNotification('Server error — please try again', 'error');
        } finally {
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    editProject(id) {
        const project = this.projects.find(p => p.id == id);
        if (project) this.openModal(project);
    }

    async deleteProject(id) {
        const project = this.projects.find(p => p.id == id);
        if (!confirm(`Delete "${project?.name || 'this project'}"? This cannot be undone.`)) return;

        try {
            const result = await Projects.delete(id);
            if (result.success) {
                this.projects = this.projects.filter(p => p.id != id);
                this.applyFilters();
                this.updateOverviewStats();
                this.showNotification('Project deleted', 'success');
            } else {
                this.showNotification(result.error || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            this.showNotification('Server error', 'error');
        }
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    updateOverviewStats() {
        const nums = document.querySelectorAll('.overview-number');
        if (nums[0]) nums[0].textContent = this.projects.length;
        if (nums[1]) nums[1].textContent = this.projects.filter(p => p.status === 'active' || p.status === 'planning').length;
        if (nums[2]) nums[2].textContent = this.projects.filter(p => p.status === 'completed').length;
        // Funding total – only if data available
        const totalFunding = this.projects.reduce((sum, p) => sum + (Number(p.goal_amount) || 0), 0);
        if (nums[3]) nums[3].textContent = totalFunding > 0 ? `$${(totalFunding / 1000).toFixed(0)}K` : '—';
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    showLoading() {
        if (this.container) this.container.innerHTML = `
            <div style="grid-column:1/-1;padding:60px;text-align:center;">
                <div class="loading-spinner"></div><p>Loading projects…</p>
            </div>`;
    }

    showError(message) {
        if (this.container) this.container.innerHTML = `
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

    isValidImageUrl(url) {
        if (!url) return false;
        const clean = url.trim();
        return clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/');
    }

    esc(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

document.addEventListener('DOMContentLoaded', () => new ManageProjects());
