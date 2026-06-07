// manage-backups.js – Frontend for Backup & Restore on settings.html
// Requires api.js to be loaded first (for Auth token helpers)

class ManageBackups {
    constructor() {
        this.backups = [];
        this.init();
    }

    init() {
        this.loadBackups();
        this.loadScheduleConfig();
        this.setupEventListeners();
    }

    // ─── API Helpers ──────────────────────────────────────────────────────────

    authHeader() {
        const token = localStorage.getItem('adminToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async apiFetch(path, options = {}) {
        const res = await fetch(`${API_BASE_URL}/backups${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...this.authHeader(),
                ...(options.headers || {})
            }
        });
        return res.json();
    }

    // ─── Load Backups ─────────────────────────────────────────────────────────

    async loadBackups() {
        const tbody = document.querySelector('.backup-list tbody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;">
            <div class="loading-spinner" style="display:inline-block;width:24px;height:24px;border:3px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <p style="margin-top:8px;color:#6b7280;">Loading backups…</p>
        </td></tr>`;

        try {
            const result = await this.apiFetch('/');
            this.backups = result.data || [];
            this.renderBackups();
        } catch (err) {
            console.error('Error loading backups:', err);
            this.renderEmpty('Failed to connect to server');
        }
    }

    renderBackups() {
        const tbody = document.querySelector('.backup-list tbody');
        if (!tbody) return;

        if (this.backups.length === 0) {
            this.renderEmpty('No backups available yet. Click "Create Backup Now" to get started.');
            return;
        }

        tbody.innerHTML = this.backups.map(b => {
            const date = new Date(b.created_at);
            const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            return `
            <tr data-filename="${this.esc(b.filename)}">
                <td><i class="fas fa-file-archive" style="color:#6366f1;margin-right:6px;"></i>${this.esc(b.filename)}</td>
                <td>${dateStr} ${timeStr}</td>
                <td>${this.esc(b.size)}</td>
                <td><span class="backup-type ${(b.type || 'full').toLowerCase()}">${b.type || 'Full'}</span></td>
                <td class="action-buttons">
                    <button class="btn-view btn-download" data-filename="${this.esc(b.filename)}" title="Download Backup">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-restore-item" data-filename="${this.esc(b.filename)}" title="Restore from Backup" style="background:#f59e0b;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn-delete btn-delete-backup" data-filename="${this.esc(b.filename)}" title="Delete Backup">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        // Attach row-level event listeners
        tbody.querySelectorAll('.btn-download').forEach(btn =>
            btn.addEventListener('click', () => this.downloadBackup(btn.dataset.filename)));
        tbody.querySelectorAll('.btn-restore-item').forEach(btn =>
            btn.addEventListener('click', () => this.restoreBackup(btn.dataset.filename)));
        tbody.querySelectorAll('.btn-delete-backup').forEach(btn =>
            btn.addEventListener('click', () => this.deleteBackup(btn.dataset.filename)));
    }

    renderEmpty(message = 'No backups found') {
        const tbody = document.querySelector('.backup-list tbody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:48px;">
                    <i class="fas fa-database" style="font-size:3em;color:#d1d5db;display:block;margin-bottom:12px;"></i>
                    <p style="color:#6b7280;">${message}</p>
                </td>
            </tr>`;
    }

    // ─── Load Schedule Config ─────────────────────────────────────────────────

    async loadScheduleConfig() {
        try {
            const result = await this.apiFetch('/schedule');
            if (result.success && result.data) {
                const c = result.data;
                const freq = document.getElementById('backupFrequency');
                const day  = document.getElementById('backupDay');
                const time = document.getElementById('backupTime');
                const ret  = document.getElementById('backupRetention');
                if (freq && c.frequency) freq.value = c.frequency;
                if (day  && c.day)       day.value  = c.day;
                if (time && c.time)      time.value = c.time;
                if (ret  && c.retention) ret.value  = c.retention;
            }
        } catch (err) {
            console.error('Error loading schedule config:', err);
        }
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────

    setupEventListeners() {
        // Create Backup
        document.getElementById('createBackup')?.addEventListener('click', () => this.createBackup());

        // Upload Backup
        document.getElementById('uploadBackup')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (file) this.uploadBackup(file);
            };
            input.click();
        });

        // Schedule Backup (Save Schedule)
        document.getElementById('scheduleBackup')?.addEventListener('click', () => this.saveSchedule());

        // Save Settings / Save All buttons
        ['saveAllSettings', 'saveSettingsBtn'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => this.saveSchedule());
        });
    }

    // ─── Create Backup ────────────────────────────────────────────────────────

    async createBackup() {
        const btn = document.getElementById('createBackup');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating…'; }

        try {
            const result = await this.apiFetch('/', { method: 'POST', body: JSON.stringify({ type: 'Full' }) });
            if (result.success) {
                this.showNotification('Backup created successfully!', 'success');
                await this.loadBackups();
            } else {
                this.showNotification(result.error || 'Failed to create backup', 'error');
            }
        } catch (err) {
            console.error('Error creating backup:', err);
            this.showNotification('Server error creating backup', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-database"></i> Create Backup Now'; }
        }
    }

    // ─── Upload Backup ────────────────────────────────────────────────────────

    uploadBackup(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = JSON.parse(e.target.result);
                const result = await this.apiFetch('/upload', {
                    method: 'POST',
                    body: JSON.stringify({ filename: file.name, content })
                });
                if (result.success) {
                    this.showNotification('Backup uploaded successfully!', 'success');
                    await this.loadBackups();
                } else {
                    this.showNotification(result.error || 'Upload failed', 'error');
                }
            } catch (err) {
                console.error('Error uploading backup:', err);
                this.showNotification('Invalid backup file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ─── Download Backup ──────────────────────────────────────────────────────

    downloadBackup(filename) {
        const token = localStorage.getItem('adminToken');
        const url = `${API_BASE_URL}/backups/download/${encodeURIComponent(filename)}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ─── Delete Backup ────────────────────────────────────────────────────────

    async deleteBackup(filename) {
        if (!confirm(`Delete backup "${filename}"? This cannot be undone.`)) return;
        try {
            const result = await this.apiFetch(`/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            if (result.success) {
                this.showNotification('Backup deleted', 'success');
                await this.loadBackups();
            } else {
                this.showNotification(result.error || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Error deleting backup:', err);
            this.showNotification('Server error', 'error');
        }
    }

    // ─── Restore Backup ───────────────────────────────────────────────────────

    async restoreBackup(filename) {
        if (!confirm(`⚠️ Restore from "${filename}"?\n\nThis will OVERWRITE all current database data with the backup. This action cannot be undone.`)) return;

        this.showNotification('Restoring database… please wait', 'info');

        try {
            const result = await this.apiFetch(`/restore/${encodeURIComponent(filename)}`, { method: 'POST' });
            if (result.success) {
                this.showNotification('Database restored successfully! Reloading…', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                this.showNotification(result.error || 'Restore failed', 'error');
            }
        } catch (err) {
            console.error('Error restoring backup:', err);
            this.showNotification('Server error during restore', 'error');
        }
    }

    // ─── Save Schedule ────────────────────────────────────────────────────────

    async saveSchedule() {
        const frequency = document.getElementById('backupFrequency')?.value;
        const day       = document.getElementById('backupDay')?.value;
        const time      = document.getElementById('backupTime')?.value;
        const retention = document.getElementById('backupRetention')?.value;

        try {
            const result = await this.apiFetch('/schedule', {
                method: 'POST',
                body: JSON.stringify({ frequency, day, time, retention })
            });
            if (result.success) {
                this.showNotification('Schedule settings saved!', 'success');
            } else {
                this.showNotification(result.error || 'Failed to save schedule', 'error');
            }
        } catch (err) {
            console.error('Error saving schedule:', err);
            this.showNotification('Server error saving schedule', 'error');
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.backup-notification');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'backup-notification';
        el.style.cssText = `
            position:fixed;top:20px;right:20px;z-index:10000;
            padding:14px 20px;border-radius:8px;font-size:14px;font-weight:500;
            color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:360px;
            background:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};`;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="margin-right:8px;"></i>${message}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }

    esc(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

document.addEventListener('DOMContentLoaded', () => new ManageBackups());
