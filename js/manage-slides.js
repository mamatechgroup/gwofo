// Manage Slides – Full CRUD with grid cards, position reordering, live preview list

class ManageSlides {
    constructor() {
        this.slides  = [];
        this.filtered = [];
        this.editingId  = null;
        this.pendingPositions = {}; // slideId -> newPosition for Save Order

        this.modal      = document.getElementById('slideModal');
        this.form       = this.modal?.querySelector('.crud-form');
        this.modalTitle = this.modal?.querySelector('.modal-header h2');
        this.submitBtn  = this.form?.querySelector('.btn-submit');
        this.grid       = document.querySelector('.slides-grid');

        this.init();
    }

    init() {
        this.loadSlides();
        this.setupEventListeners();
    }

    // ─── Load ─────────────────────────────────────────────────────────────────

    async loadSlides() {
        try {
            this.showLoading();
            const result = await Slides.getAll();
            if (result.success && Array.isArray(result.data)) {
                this.slides  = result.data.sort((a, b) => (a.position || 999) - (b.position || 999));
                this.filtered = [...this.slides];
                this.render();
                this.updateStats();
                this.updateActiveSlidesList();
                this.updatePerformanceStats();
            } else {
                this.showError('Failed to load slides');
            }
        } catch (err) {
            console.error('Error loading slides:', err);
            this.showError('Error connecting to server');
        }
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    setupEventListeners() {
        // Status filter
        document.querySelector('[title="Filter Slides by Status"]')?.addEventListener('change', e => {
            const val = e.target.value;
            this.filtered = val === 'all' ? [...this.slides] : this.slides.filter(s => s.status === val);
            this.render();
        });

        // Search
        document.querySelector('.search-input')?.addEventListener('input', e => this.search(e.target.value));

        // Add slide button
        document.querySelector('[data-modal="slideModal"]')?.addEventListener('click', () => this.openModal());

        // Save Order button
        document.getElementById('saveOrder')?.addEventListener('click', () => this.savePositions());

        // Toggle All button
        document.getElementById('toggleAll')?.addEventListener('click', () => this.toggleAllStatus());

        // Refresh preview
        document.getElementById('refreshPreview')?.addEventListener('click', () => this.updateActiveSlidesList());

        // Modal close
        if (this.modal) {
            this.modal.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
            this.modal.querySelector('.btn-cancel')?.addEventListener('click',  () => this.closeModal());
            this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
        }

        // Form submit
        this.form?.addEventListener('submit', e => { e.preventDefault(); this.saveSlide(); });

        // Overlay slider
        const overlaySlider = document.getElementById('slideOverlay');
        const overlayLabel  = document.getElementById('overlayValue');
        if (overlaySlider && overlayLabel) {
            overlaySlider.addEventListener('input', () => { overlayLabel.textContent = overlaySlider.value + '%'; });
        }
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    search(query) {
        const q = query.toLowerCase().trim();
        this.filtered = !q ? [...this.slides] : this.slides.filter(s =>
            s.title.toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q)
        );
        this.render();
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        if (!this.grid) return;

        if (this.filtered.length === 0) {
            this.grid.innerHTML = `
                <div style="grid-column:1/-1;padding:60px;text-align:center;color:#6b7280;">
                    <i class="fas fa-images" style="font-size:3em;display:block;margin-bottom:12px;"></i>
                    <p>No slides found</p>
                </div>`;
            return;
        }

        this.grid.innerHTML = this.filtered.map(s => this.createCard(s)).join('');

        this.grid.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', () => this.editSlide(btn.dataset.id)));
        this.grid.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', () => this.deleteSlide(btn.dataset.id)));
        this.grid.querySelectorAll('.btn-preview').forEach(btn =>
            btn.addEventListener('click', () => this.previewSlide(btn.dataset.id)));
        this.grid.querySelectorAll('.btn-toggle').forEach(btn =>
            btn.addEventListener('click', () => this.toggleStatus(btn.dataset.id)));

        // Position selects for reorder
        this.grid.querySelectorAll('.position-select').forEach(sel => {
            sel.addEventListener('change', () => {
                this.pendingPositions[sel.dataset.id] = Number(sel.value);
            });
        });
    }

    createCard(s) {
        const posOptions = [1,2,3,4,5,6].map(n =>
            `<option value="${n}"${n === (s.position || 1) ? ' selected' : ''}>${n}</option>`
        ).join('');

        const thumb = s.image_url
            ? `<img src="${s.image_url}" alt="${this.esc(s.title)}" class="slide-card-image">`
            : `<div class="slide-card-placeholder"><i class="fas fa-image"></i></div>`;

        return `
            <div class="slide-card" data-id="${s.id}">
                <div class="slide-card-thumb">
                    ${thumb}
                    <span class="status-badge status-${s.status}" style="position:absolute;top:8px;right:8px;">${s.status}</span>
                </div>
                <div class="slide-card-body">
                    <h4 class="slide-card-title">${this.esc(s.title)}</h4>
                    ${s.subtitle ? `<p class="slide-card-subtitle">${this.esc(s.subtitle)}</p>` : ''}
                    <p class="slide-card-desc">${this.esc((s.description || '').substring(0,70))}…</p>
                    <div class="slide-card-meta">
                        <label>Position:
                            <select class="position-select" data-id="${s.id}">${posOptions}</select>
                        </label>
                        <span>${s.display_duration || 5}s</span>
                    </div>
                </div>
                <div class="slide-card-actions">
                    <button class="btn-preview" data-id="${s.id}" title="Preview"><i class="fas fa-eye"></i></button>
                    <button class="btn-toggle btn-secondary" data-id="${s.id}" title="${s.status === 'active' ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-toggle-${s.status === 'active' ? 'on' : 'off'}"></i>
                    </button>
                    <button class="btn-edit" data-id="${s.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${s.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }

    // ─── Modal ────────────────────────────────────────────────────────────────

    openModal(slide = null) {
        if (!this.modal || !this.form) return;
        this.editingId = slide?.id || null;
        if (this.modalTitle) this.modalTitle.textContent = slide ? 'Edit Slide' : 'Add New Slide';
        if (this.submitBtn)  this.submitBtn.textContent  = slide ? 'Update Slide' : 'Save Slide';

        this.form.reset();
        const overlayLabel = document.getElementById('overlayValue');
        if (overlayLabel) overlayLabel.textContent = '30%';

        if (slide) {
            const f = id => document.getElementById(id);
            if (f('slideTitle'))       f('slideTitle').value       = slide.title             || '';
            if (f('slideSubtitle'))    f('slideSubtitle').value    = slide.subtitle          || '';
            if (f('slideDescription')) f('slideDescription').value = slide.description       || '';
            if (f('slidePosition'))    f('slidePosition').value    = slide.position          || 1;
            if (f('slideStatus'))      f('slideStatus').value      = slide.status            || 'active';
            if (f('slideButtonText'))  f('slideButtonText').value  = slide.button_text       || '';
            if (f('slideButtonLink'))  f('slideButtonLink').value  = slide.button_link       || '';
            if (f('slideOverlay'))     { f('slideOverlay').value   = slide.overlay_opacity   || 30; if (overlayLabel) overlayLabel.textContent = (slide.overlay_opacity || 30) + '%'; }
            if (f('slideDuration'))    f('slideDuration').value    = slide.display_duration  || 5;
            if (f('slideTextColor'))   f('slideTextColor').value   = slide.text_color        || '#ffffff';

            // Show existing image
            if (slide.image_url) {
                const preview = document.getElementById('slideImagePreview');
                const img     = document.getElementById('slidePreviewImage');
                if (preview && img) { img.src = slide.image_url; preview.style.display = 'block'; }
            }
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

    async saveSlide() {
        const f = id => document.getElementById(id);
        const data = {
            title:            f('slideTitle')?.value.trim(),
            subtitle:         f('slideSubtitle')?.value.trim()    || null,
            description:      f('slideDescription')?.value.trim(),
            position:         Number(f('slidePosition')?.value    || 1),
            status:           f('slideStatus')?.value             || 'active',
            button_text:      f('slideButtonText')?.value.trim()  || null,
            button_link:      f('slideButtonLink')?.value.trim()  || null,
            overlay_opacity:  Number(f('slideOverlay')?.value     || 30),
            display_duration: Number(f('slideDuration')?.value    || 5),
            text_color:       f('slideTextColor')?.value          || '#ffffff'
        };

        if (!data.title || !data.description) {
            this.showNotification('Title and Description are required', 'error');
            return;
        }

        if (this.submitBtn) this.submitBtn.disabled = true;

        try {
            const result = this.editingId
                ? await Slides.update(this.editingId, data)
                : await Slides.create(data);

            if (result.success) {
                this.showNotification(this.editingId ? 'Slide updated!' : 'Slide created!', 'success');
                this.closeModal();
                await this.loadSlides();
            } else {
                this.showNotification(result.error || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save slide error:', err);
            this.showNotification('Server error — please try again', 'error');
        } finally {
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    editSlide(id) {
        const slide = this.slides.find(s => s.id == id);
        if (slide) this.openModal(slide);
    }

    async deleteSlide(id) {
        const s = this.slides.find(s => s.id == id);
        if (!confirm(`Delete slide "${s?.title || 'this slide'}"? This cannot be undone.`)) return;

        try {
            const result = await Slides.delete(id);
            if (result.success) {
                this.slides   = this.slides.filter(s => s.id != id);
                this.filtered = this.filtered.filter(s => s.id != id);
                this.render();
                this.updateStats();
                this.updateActiveSlidesList();
                this.showNotification('Slide deleted', 'success');
            } else {
                this.showNotification(result.error || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            this.showNotification('Server error', 'error');
        }
    }

    async toggleStatus(id) {
        const slide = this.slides.find(s => s.id == id);
        if (!slide) return;
        const newStatus = slide.status === 'active' ? 'inactive' : 'active';

        try {
            const result = await Slides.update(id, { status: newStatus });
            if (result.success) {
                slide.status = newStatus;
                this.render();
                this.updateStats();
                this.updateActiveSlidesList();
                this.showNotification(`Slide ${newStatus}`, 'success');
            }
        } catch (err) {
            this.showNotification('Toggle failed', 'error');
        }
    }

    async toggleAllStatus() {
        const allActive = this.slides.every(s => s.status === 'active');
        const newStatus = allActive ? 'inactive' : 'active';
        let count = 0;
        for (const slide of this.slides) {
            try {
                await Slides.update(slide.id, { status: newStatus });
                slide.status = newStatus;
                count++;
            } catch (_) {}
        }
        this.render();
        this.updateStats();
        this.updateActiveSlidesList();
        this.showNotification(`${count} slides set to ${newStatus}`, 'success');
    }

    async savePositions() {
        const entries = Object.entries(this.pendingPositions);
        if (entries.length === 0) {
            this.showNotification('No position changes to save', 'info');
            return;
        }

        let count = 0;
        for (const [id, position] of entries) {
            try {
                await Slides.updatePosition(id, position);
                const slide = this.slides.find(s => s.id == id);
                if (slide) slide.position = position;
                count++;
            } catch (_) {}
        }

        this.pendingPositions = {};
        this.slides.sort((a, b) => (a.position || 999) - (b.position || 999));
        this.filtered = [...this.slides];
        this.render();
        this.showNotification(`Positions saved for ${count} slide(s)`, 'success');
    }

    // ─── Preview ──────────────────────────────────────────────────────────────

    previewSlide(id) {
        const slide = this.slides.find(s => s.id == id);
        if (!slide) return;

        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:10001;';
        modal.innerHTML = `
            <div style="width:90%;max-width:900px;border-radius:12px;overflow:hidden;background:#000;position:relative;">
                <div style="position:relative;min-height:320px;background:#111;background-image:url('${slide.image_url}');background-size:cover;background-position:center;">
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,${(slide.overlay_opacity||30)/100});"></div>
                    <div style="position:relative;z-index:1;padding:60px 48px;color:${slide.text_color||'#fff'};">
                        ${slide.subtitle ? `<p style="font-size:.9em;text-transform:uppercase;letter-spacing:2px;opacity:.8;margin-bottom:8px;">${this.esc(slide.subtitle)}</p>` : ''}
                        <h2 style="font-size:2em;font-weight:700;margin-bottom:12px;">${this.esc(slide.title)}</h2>
                        <p style="font-size:1.05em;opacity:.9;max-width:500px;margin-bottom:24px;">${this.esc(slide.description)}</p>
                        ${slide.button_text ? `<button style="padding:10px 28px;background:#8b5cf6;color:#fff;border:none;border-radius:6px;font-size:1em;cursor:pointer;">${this.esc(slide.button_text)}</button>` : ''}
                    </div>
                </div>
                <div style="padding:16px 20px;background:#1e1e2e;display:flex;align-items:center;justify-content:space-between;">
                    <span style="color:#9ca3af;font-size:.9em;">Position ${slide.position} · ${slide.display_duration||5}s · <span style="color:${slide.status==='active'?'#10b981':'#ef4444'}">${slide.status}</span></span>
                    <button onclick="this.closest('div').parentElement.remove()" style="padding:8px 20px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;">Close</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    updateStats() {
        const items  = document.querySelectorAll('.stat-item');
        const active = this.slides.filter(s => s.status === 'active').length;
        if (items[0]) items[0].querySelector('.stat-number').textContent = this.slides.length;
        if (items[1]) items[1].querySelector('.stat-number').textContent = active;

        // Summary text
        const summary = document.querySelector('.slides-summary p');
        if (summary) summary.innerHTML = `<strong>${active}</strong> active slides out of <strong>${this.slides.length}</strong> total slides`;
    }

    updateActiveSlidesList() {
        const list = document.querySelector('.active-slides-list');
        if (!list) return;

        const active = this.slides.filter(s => s.status === 'active').sort((a,b) => (a.position||999)-(b.position||999));
        if (active.length === 0) {
            list.innerHTML = '<p style="color:#6b7280;padding:12px;">No active slides</p>';
            return;
        }
        list.innerHTML = active.map(s => `
            <div class="active-slide">
                <span class="slide-title">${this.esc(s.title)}</span>
                <span class="slide-position">Position ${s.position}</span>
                <span class="slide-status-badge active">Active</span>
            </div>`).join('');
    }

    // ─── Performance Stats ────────────────────────────────────────────────────

    async updatePerformanceStats() {
        const statsEl     = document.getElementById('performanceStats');
        const emptyEl     = document.getElementById('performanceEmptyState');
        const viewsEl     = document.getElementById('perfTotalViews');
        const clicksEl    = document.getElementById('perfTotalClicks');
        const rateEl      = document.getElementById('perfClickRate');
        const activeEl    = document.getElementById('perfActiveSlides');

        try {
            const res    = await fetch(`${API_BASE_URL}/dashboard/slides-stats`);
            const result = await res.json();

            if (result.success && result.data) {
                const d = result.data;

                const views  = d.total_views  || 0;
                const clicks = d.total_clicks || 0;

                if (views === 0 && clicks === 0) {
                    // Show empty state
                    if (statsEl)  statsEl.style.display  = 'none';
                    if (emptyEl)  emptyEl.style.display  = '';
                } else {
                    if (statsEl)  statsEl.style.display  = '';
                    if (emptyEl)  emptyEl.style.display  = 'none';

                    if (viewsEl)  viewsEl.textContent  = views.toLocaleString();
                    if (clicksEl) clicksEl.textContent = clicks.toLocaleString();
                    if (rateEl)   rateEl.textContent   = d.click_rate || '0%';
                    if (activeEl) activeEl.textContent = d.active_slides || 0;
                }
            }
        } catch (err) {
            console.error('Error loading slide performance stats:', err);
            // On error show a soft message instead of hiding everything
            if (emptyEl) {
                if (statsEl) statsEl.style.display = 'none';
                emptyEl.style.display = '';
                emptyEl.querySelector('p').textContent = 'Performance data unavailable right now.';
            }
        }
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    showLoading() {
        if (this.grid) this.grid.innerHTML = `
            <div style="grid-column:1/-1;padding:60px;text-align:center;">
                <div class="loading-spinner"></div><p>Loading slides…</p>
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

document.addEventListener('DOMContentLoaded', () => new ManageSlides());
