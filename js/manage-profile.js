// manage-profile.js – Frontend Profile Settings handling on settings.html
// Requires api.js (for Auth) and admin.js (for layout management) to be loaded first

class ManageProfile {
    constructor() {
        this.form = document.getElementById('profileForm');
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.setupEventListeners();
    }

    async loadCurrentUser() {
        try {
            const result = await Auth.getCurrentUser();
            if (result.success && result.user) {
                const user = result.user;
                const usernameInput = document.getElementById('profileUsername');
                const emailInput = document.getElementById('profileEmail');
                if (usernameInput) usernameInput.value = user.username || '';
                if (emailInput) emailInput.value = user.email || '';
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            this.showNotification('Failed to load user details', 'error');
        }
    }

    setupEventListeners() {
        this.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('profileUsername')?.value.trim();
            const email = document.getElementById('profileEmail')?.value.trim();
            const password = document.getElementById('profilePassword')?.value;
            const confirmPassword = document.getElementById('profileConfirmPassword')?.value;

            if (!username || !email) {
                this.showNotification('Username and email are required', 'error');
                return;
            }

            if (password) {
                if (password.length < 6) {
                    this.showNotification('Password must be at least 6 characters long', 'error');
                    return;
                }
                if (password !== confirmPassword) {
                    this.showNotification('Passwords do not match', 'error');
                    return;
                }
            }

            const submitBtn = this.form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }

            try {
                const updateData = { username, email };
                if (password) {
                    updateData.password = password;
                }

                const result = await Auth.updateProfile(updateData);
                if (result.success) {
                    this.showNotification('Profile updated successfully!', 'success');
                    
                    // Update username in localStorage and display
                    localStorage.setItem('adminUsername', result.user.username);
                    document.querySelectorAll('.profile-name').forEach(el => {
                        el.textContent = result.user.username;
                    });
                    
                    // Clear password fields
                    const passwordInput = document.getElementById('profilePassword');
                    const confirmInput = document.getElementById('profileConfirmPassword');
                    if (passwordInput) passwordInput.value = '';
                    if (confirmInput) confirmInput.value = '';
                    
                    // Reload current user details
                    await this.loadCurrentUser();
                } else {
                    this.showNotification(result.error || 'Update failed', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                this.showNotification(error.message || 'Server error', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
                }
            }
        });
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.profile-notification');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'profile-notification';
        el.style.cssText = `
            position:fixed;top:20px;right:20px;z-index:10000;
            padding:14px 20px;border-radius:8px;font-size:14px;font-weight:500;
            color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:360px;
            background:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};`;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="margin-right:8px;"></i>${message}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => new ManageProfile());
