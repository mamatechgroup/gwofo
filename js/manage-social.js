// manage-social.js – Frontend Social Links Management on settings.html
// Requires api.js (for SocialLinks) and admin.js to be loaded first

class ManageSocial {
    constructor() {
        this.tableBody = document.getElementById('socialLinksTableBody');
        this.formCard = document.getElementById('socialFormCard');
        this.form = document.getElementById('socialLinkForm');
        this.addBtn = document.getElementById('addNewSocialBtn');
        this.cancelBtn = document.getElementById('cancelSocialBtn');
        this.formTitle = document.getElementById('socialFormTitle');
        
        this.idInput = document.getElementById('socialLinkId');
        this.platformInput = document.getElementById('socialPlatform');
        this.displayNameInput = document.getElementById('socialDisplayName');
        this.urlInput = document.getElementById('socialUrl');
        this.iconClassInput = document.getElementById('socialIconClass');
        this.colorClassInput = document.getElementById('socialColorClass');
        this.displayOrderInput = document.getElementById('socialDisplayOrder');
        this.isActiveInput = document.getElementById('socialIsActive');

        this.links = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLinks();
    }

    setupEventListeners() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.openCreateForm());
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeForm());
        }

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async loadLinks() {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:2rem;">
                    <i class="fas fa-spinner fa-spin"></i> Loading social links...
                </td>
            </tr>
        `;

        try {
            const res = await SocialLinks.getAllAdmin();
            if (res.success && Array.isArray(res.data)) {
                this.links = res.data;
                this.renderTable();
            } else {
                throw new Error(res.error || 'Failed to fetch social links');
            }
        } catch (error) {
            console.error('Error loading social links:', error);
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:2rem; color:#ef4444;">
                        <i class="fas fa-exclamation-triangle"></i> Error loading social links: ${this.escapeHtml(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    renderTable() {
        if (!this.tableBody) return;

        if (this.links.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:2rem;">
                        No social media links found. Click "Add New Platform" to create one.
                    </td>
                </tr>
            `;
            return;
        }

        this.tableBody.innerHTML = this.links.map(link => {
            const isActive = Boolean(link.is_active);
            const badgeClass = isActive ? 'badge-success' : 'badge-danger';
            const badgeStyle = isActive 
                ? 'background:rgba(16,185,129,0.15); color:#10b981; padding:4px 10px; border-radius:12px; font-weight:600; font-size:12px;'
                : 'background:rgba(239,68,68,0.15); color:#ef4444; padding:4px 10px; border-radius:12px; font-weight:600; font-size:12px;';

            return `
                <tr data-id="${link.id}">
                    <td style="text-align:center;">
                        <span class="social-icon-preview" style="display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px; background:var(--bg-light, #f1f5f9); font-size:16px;">
                            <i class="${this.escapeHtml(link.icon_class || 'fas fa-globe')}"></i>
                        </span>
                    </td>
                    <td><strong>${this.escapeHtml(link.platform)}</strong></td>
                    <td>${this.escapeHtml(link.display_name)}</td>
                    <td>
                        <a href="${this.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-color, #1e40af); text-decoration:none; word-break:break-all;" title="${this.escapeHtml(link.url)}">
                            ${this.escapeHtml(link.url)} <i class="fas fa-external-link-alt" style="font-size:10px; margin-left:4px;"></i>
                        </a>
                    </td>
                    <td style="text-align:center;">${link.display_order ?? 0}</td>
                    <td>
                        <button type="button" class="btn-toggle-status" data-id="${link.id}" data-active="${isActive}" style="border:none; cursor:pointer; ${badgeStyle}" title="Click to toggle status">
                            <i class="fas ${isActive ? 'fa-check' : 'fa-times'}" style="margin-right:4px;"></i>${isActive ? 'Active' : 'Hidden'}
                        </button>
                    </td>
                    <td style="text-align:center; white-space:nowrap;">
                        <button type="button" class="btn-sm btn-outline-primary btn-edit-social" data-id="${link.id}" title="Edit link" style="margin-right:6px; padding:4px 8px; border-radius:6px; cursor:pointer;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button type="button" class="btn-sm btn-outline-danger btn-delete-social" data-id="${link.id}" data-name="${this.escapeHtml(link.display_name)}" title="Delete link" style="padding:4px 8px; border-radius:6px; cursor:pointer; color:#ef4444; border-color:#ef4444;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach action handlers
        this.tableBody.querySelectorAll('.btn-edit-social').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const link = this.links.find(l => String(l.id) === String(id));
                if (link) this.openEditForm(link);
            });
        });

        this.tableBody.querySelectorAll('.btn-delete-social').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const name = btn.dataset.name;
                this.confirmDelete(id, name);
            });
        });

        this.tableBody.querySelectorAll('.btn-toggle-status').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const currentActive = btn.dataset.active === 'true';
                this.toggleStatus(id, !currentActive);
            });
        });
    }

    openCreateForm() {
        if (!this.formCard) return;
        this.formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add Social Link';
        this.idInput.value = '';
        this.platformInput.value = '';
        this.platformInput.disabled = false;
        this.displayNameInput.value = '';
        this.urlInput.value = '';
        this.iconClassInput.value = '';
        this.colorClassInput.value = '';
        this.displayOrderInput.value = (this.links.length + 1) * 1;
        this.isActiveInput.checked = true;

        this.formCard.style.display = 'block';
        this.formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    openEditForm(link) {
        if (!this.formCard) return;
        this.formTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Social Link: ${this.escapeHtml(link.display_name)}`;
        this.idInput.value = link.id;
        this.platformInput.value = link.platform || '';
        this.platformInput.disabled = false;
        this.displayNameInput.value = link.display_name || '';
        this.urlInput.value = link.url || '';
        this.iconClassInput.value = link.icon_class || '';
        this.colorClassInput.value = link.color_class || '';
        this.displayOrderInput.value = link.display_order ?? 0;
        this.isActiveInput.checked = Boolean(link.is_active);

        this.formCard.style.display = 'block';
        this.formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    closeForm() {
        if (this.formCard) {
            this.formCard.style.display = 'none';
        }
        if (this.form) {
            this.form.reset();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const id = this.idInput.value;
        const platform = this.platformInput.value.trim().toLowerCase();
        const display_name = this.displayNameInput.value.trim();
        const url = this.urlInput.value.trim();
        const icon_class = this.iconClassInput.value.trim() || `fab fa-${platform}`;
        const color_class = this.colorClassInput.value.trim() || platform;
        const display_order = parseInt(this.displayOrderInput.value) || 0;
        const is_active = this.isActiveInput.checked;

        if (!platform || !display_name || !url) {
            this.showNotification('Platform, Display Name, and URL are required', 'error');
            return;
        }

        const submitBtn = document.getElementById('saveSocialBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }

        const payload = {
            platform,
            display_name,
            url,
            icon_class,
            color_class,
            display_order,
            is_active
        };

        try {
            let res;
            if (id) {
                res = await SocialLinks.update(id, payload);
            } else {
                res = await SocialLinks.create(payload);
            }

            if (res.success) {
                this.showNotification(
                    id ? 'Social link updated successfully!' : 'New social link created successfully!',
                    'success'
                );
                this.closeForm();
                await this.loadLinks();
            } else {
                throw new Error(res.error || 'Failed to save social link');
            }
        } catch (error) {
            console.error('Error saving social link:', error);
            this.showNotification(error.message || 'Server error', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Link';
            }
        }
    }

    async toggleStatus(id, newStatus) {
        try {
            const res = await SocialLinks.update(id, { is_active: newStatus });
            if (res.success) {
                this.showNotification(`Social link status updated to ${newStatus ? 'Active' : 'Hidden'}`, 'success');
                await this.loadLinks();
            } else {
                throw new Error(res.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            this.showNotification(error.message || 'Update failed', 'error');
        }
    }

    async confirmDelete(id, name) {
        const confirmed = await window.confirmDelete({
            title: 'Delete Social Link',
            message: `Are you sure you want to delete the social link "${name}"? This action cannot be undone.`
        });
        if (!confirmed) {
            return;
        }

        try {
            const res = await SocialLinks.delete(id);
            if (res.success) {
                this.showNotification(`Deleted "${name}" successfully`, 'success');
                await this.loadLinks();
            } else {
                throw new Error(res.error || 'Failed to delete social link');
            }
        } catch (error) {
            console.error('Error deleting social link:', error);
            this.showNotification(error.message || 'Failed to delete', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.social-notification');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'social-notification';
        el.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            padding: 14px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
            color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.2); max-width: 360px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="margin-right:8px;"></i>${this.escapeHtml(message)}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }

    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.manageSocialInstance = new ManageSocial();
});
