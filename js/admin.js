// admin.js - Consolidated and Optimized Admin Dashboard JavaScript

class AdminDashboard {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupCRUDOperations();
        this.setupSearchEnhancements();
        this.setupFileUploads();
        this.setupActivityAnimations();
        this.setupModals();
        this.setupLoginFunctionality();
        this.updateSidebarBadges();
        this.setupDashboardRedirects();
    }
    
    async checkAuthentication() {
        const currentPage = window.location.pathname;
        const token = localStorage.getItem('adminToken');
        
        if (currentPage.includes('login.html')) {
            if (token && token.startsWith('token-')) {
                window.location.href = 'dashboard.html';
            }
            return;
        }
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        try {
            await Auth.verifyToken(token);
            this.displayCurrentUser();
        } catch (error) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminUsername');
            window.location.href = 'login.html';
        }
    }
    
    setupLoginRedirect() {
        const token = localStorage.getItem('adminToken');
        if (token && token.startsWith('token-')) {
            window.location.href = 'dashboard.html';
        }
    }
    
    displayCurrentUser() {
        const username = localStorage.getItem('adminUsername') || 'Admin';
        document.querySelectorAll('.profile-name').forEach(el => {
            el.textContent = username;
        });
    }
    
    setupEventListeners() {
        this.setupLogoutListener();
        this.setupMobileMenu();
        // Form submissions are handled by each page-specific JS file
    }
    
    setupDashboardRedirects() {
        if (window.location.pathname.includes('dashboard.html')) {
            document.querySelectorAll('.btn-add').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const modalType = btn.dataset.modal;
                    if (modalType === 'postModal') {
                        window.location.href = 'manage-posts.html?action=add';
                    } else if (modalType === 'projectModal') {
                        window.location.href = 'manage-projects.html?action=add';
                    }
                });
            });
        }
    }
    
    setupLogoutListener() {
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    async logout() {
        try {
            await Auth.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
        }
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
    
    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        
        if (!mobileToggle || !sidebar) return;
        
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && sidebar.classList.contains('active')) {
                if (!e.target.closest('.admin-sidebar') && !e.target.closest('.mobile-toggle')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
    
    // setupFormSubmissions() removed — each manage-*.js handles its own form submit
    
    setupCRUDOperations() {
        // btn-add modal opening is handled by each page-specific JS file
        // Only set up shared helpers here
        this.setupProgressRange();
        this.setupFormValidation();
    }
    
    setupProgressRange() {
        const progressRange = document.getElementById('projectProgress');
        const progressValue = document.getElementById('progressValue');
        
        if (progressRange && progressValue) {
            progressRange.addEventListener('input', function() {
                progressValue.textContent = this.value + '%';
            });
        }
    }
    
    setupFormValidation() {
        // Validation logic handled in validateForm method
    }
    
    setupSearchEnhancements() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            this.filterTable(e.target.value.toLowerCase());
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.enhancedSearch(e.target.value.toLowerCase());
            }
        });
        
        const searchIcon = searchInput.nextElementSibling;
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                this.enhancedSearch(searchInput.value.toLowerCase());
            });
        }
    }
    
    enhancedSearch(searchTerm) {
        const tables = document.querySelectorAll('.data-table');
        let hasAnyMatches = false;
        
        tables.forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            let hasMatches = false;
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                    hasMatches = true;
                    hasAnyMatches = true;
                    this.highlightText(row, searchTerm);
                } else {
                    row.style.display = 'none';
                }
            });
            
            this.showNoResultsMessage(table, hasMatches);
        });
        
        return hasAnyMatches;
    }
    
    highlightText(element, searchTerm) {
        if (searchTerm.trim() === '') return;
        
        const highlights = element.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
        
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        const nodes = [];
        
        while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(searchTerm)) {
                nodes.push(node);
            }
        }
        
        nodes.forEach(node => {
            const text = node.textContent;
            const index = text.toLowerCase().indexOf(searchTerm);
            const before = text.substring(0, index);
            const match = text.substring(index, index + searchTerm.length);
            const after = text.substring(index + searchTerm.length);
            
            const fragment = document.createDocumentFragment();
            
            if (before) fragment.appendChild(document.createTextNode(before));
            
            const span = document.createElement('span');
            span.className = 'search-highlight';
            span.textContent = match;
            fragment.appendChild(span);
            
            if (after) fragment.appendChild(document.createTextNode(after));
            
            node.parentNode.replaceChild(fragment, node);
        });
    }
    
    showNoResultsMessage(table, hasMatches) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        let noResults = tbody.querySelector('.no-results');
        const rows = tbody.querySelectorAll('tr:not(.no-results)');
        
        if (!hasMatches && rows.length > 0) {
            if (!noResults) {
                noResults = document.createElement('tr');
                noResults.className = 'no-results';
                noResults.innerHTML = `
                    <td colspan="5">No matching results found</td>
                `;
                tbody.appendChild(noResults);
            }
            noResults.style.display = '';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }
    
    setupFileUploads() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
        });
    }
    
    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('File selected:', file.name, file.type, Math.round(file.size / 1024) + 'KB');
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)}KB)`;
            
            const fileInput = document.querySelector('input[type="file"]:focus');
            if (fileInput) {
                fileInput.parentNode.appendChild(fileInfo);
            }
        };
        reader.readAsDataURL(file);
    }
    
    setupActivityAnimations() {
        const activityItems = document.querySelectorAll('.activity-item');
        activityItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animated');
            }, index * 100);
        });
    }
    
    setupModals() {
        document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        document.querySelectorAll('.form-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        this.closeAllModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
    
    closeAllModals() {
        document.querySelectorAll('.form-modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
    
    filterTable(searchTerm) {
        const tables = document.querySelectorAll('.data-table');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    loadDashboardData() {
        // Fetch real data from API instead of using mockData
        fetch(`${API_BASE_URL}/dashboard/summary`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data) {
                    const data = result.data;
                    
                    // Update stats
                    const statsData = {
                        totalPosts: data.stats.total_posts || 0,
                        totalProjects: data.stats.total_projects || 0,
                        totalUsers: data.stats.total_subscriptions || 0
                    };
                    this.updateStats(statsData);
                    
                    // Populate tables with real data
                    this.populateTable('recentPostsTable', data.recentPosts || [], 'posts');
                    this.populateTable('recentProjectsTable', data.recentProjects || [], 'projects');
                    
                    // Load recent activities
                    this.loadRecentActivity();
                } else {
                    console.error('Failed to load dashboard data:', result.error);
                    this.showNotification('Error loading dashboard data', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching dashboard data:', error);
                this.showNotification('Error connecting to server', 'error');
            });
    }
    
    updateStats(data) {
        document.querySelectorAll('.stat-number').forEach(stat => {
            const statCard = stat.closest('.stat-card');
            if (!statCard) return; // Skip if stat-card parent not found
            
            const statType = statCard.dataset.stat;
            if (data[statType] !== undefined) {
                stat.textContent = data[statType].toLocaleString();
            }
        });
    }
    
    populateTable(tableId, data, type) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            if (type === 'posts') {
                const dateObj = new Date(item.published_date || item.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                
                row.innerHTML = `
                    <td>${item.title || ''}</td>
                    <td>${item.author_name || item.author || ''}</td>
                    <td>${dateStr}</td>
                    <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                    <td>
                        <button class="btn-edit" data-id="${item.id}" data-type="post">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" data-id="${item.id}" data-type="post">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
            } else if (type === 'projects') {
                row.innerHTML = `
                    <td>${item.name || ''}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${item.progress_percentage || 0}%"></div>
                        </div>
                        <small>${item.progress_percentage || 0}%</small>
                    </td>
                    <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                    <td>
                        <button class="btn-edit" data-id="${item.id}" data-type="project">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" data-id="${item.id}" data-type="project">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
            }
            
            tbody.appendChild(row);
        });
        
        this.attachRowEventListeners();
    }
    
    attachRowEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                this.editItem(type, id);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                this.deleteItem(type, id);
            });
        });
    }
    
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const formType = form.dataset.type;
        
        if (!this.validateForm(form, data)) return;
        
        console.log(`Submitting ${formType}:`, data);
        
        this.showNotification(
            `${formType.charAt(0).toUpperCase() + formType.slice(1)} saved successfully!`,
            'success'
        );
        
        this.closeAllModals();
        form.reset();
        
        setTimeout(() => this.loadDashboardData(), 500);
    }
    
    validateForm(form, data) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!data[field.name] || data[field.name].trim() === '') {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        const emailField = form.querySelector('input[type="email"]');
        if (emailField && data[emailField.name]) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data[emailField.name])) {
                this.showFieldError(emailField, 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentElement.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            field.parentElement.appendChild(errorElement);
        } else {
            errorElement.textContent = message;
        }
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) errorElement.remove();
    }
    
    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) existingNotification.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
    
    editItem(type, id) {
        console.log(`Editing ${type} with ID: ${id}`);
        if (type === 'post') {
            window.location.href = `manage-posts.html?action=edit&id=${id}`;
        } else if (type === 'project') {
            window.location.href = `manage-projects.html?action=edit&id=${id}`;
        }
    }
    
    async deleteItem(type, id) {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            try {
                let result;
                if (type === 'post') {
                    result = await Posts.delete(id);
                } else if (type === 'project') {
                    result = await Projects.delete(id);
                }
                
                if (result && result.success) {
                    this.showNotification(
                        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`,
                        'success'
                    );
                    this.loadDashboardData();
                    this.updateSidebarBadges();
                } else {
                    this.showNotification(result?.error || 'Failed to delete item', 'error');
                }
            } catch (error) {
                console.error(`Error deleting ${type}:`, error);
                this.showNotification('Server error - failed to delete item', 'error');
            }
        }
    }
    
    async updateSidebarBadges() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
            const result = await response.json();
            if (result.success && result.data) {
                const stats = result.data;
                this.setSidebarBadge('manage-posts.html', stats.totalPosts);
                this.setSidebarBadge('manage-projects.html', stats.totalProjects);
                this.setSidebarBadge('manage-team.html', stats.totalTeamMembers);
                this.setSidebarBadge('manage-partners.html', stats.totalPartners);
                this.setSidebarBadge('manage-subscriptions.html', stats.totalUsers);
            }
        } catch (error) {
            console.error('Error loading sidebar badges:', error);
        }
    }

    setSidebarBadge(href, count) {
        const link = document.querySelector(`.admin-menu a[href="${href}"]`);
        if (!link) return;
        let badge = link.querySelector('.badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'badge';
            link.appendChild(badge);
        }
        badge.textContent = count;
    }

    loadRecentActivity() {
        const timeline = document.querySelector('.activity-timeline');
        if (!timeline) return;
        
        fetch(`${API_BASE_URL}/dashboard/recent-activity`)
            .then(res => res.json())
            .then(result => {
                if (result.success && Array.isArray(result.data)) {
                    if (result.data.length === 0) {
                        timeline.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;"><i class="fas fa-history" style="font-size: 1.5em; display: block; margin-bottom: 8px;"></i> No activity logged yet.</div>';
                        return;
                    }
                    
                    timeline.innerHTML = result.data.map(act => {
                        let icon = 'fa-info-circle';
                        if (act.action === 'create') icon = 'fa-plus-circle';
                        else if (act.action === 'update') icon = 'fa-edit';
                        else if (act.action === 'delete') icon = 'fa-trash-alt';
                        
                        return `
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas ${icon}"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-title">${act.action.charAt(0).toUpperCase() + act.action.slice(1)} ${act.entity_type.replace('_', ' ')}</div>
                                    <div class="activity-desc">${act.description}</div>
                                    <div class="activity-time">${this.formatRelativeTime(act.created_at)}</div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            })
            .catch(err => {
                console.error('Error loading recent activity:', err);
            });
    }

    formatRelativeTime(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date)) return '';
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    setupLoginFunctionality() {
        this.setupPasswordToggle();
        this.setupLoginForm();
    }
    
    setupPasswordToggle() {
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                const eyeIcon = this.querySelector('.fa-eye');
                const eyeSlashIcon = this.querySelector('.fa-eye-slash');
                
                if (type === 'password') {
                    eyeIcon.style.display = 'inline';
                    eyeSlashIcon.style.display = 'none';
                } else {
                    eyeIcon.style.display = 'none';
                    eyeSlashIcon.style.display = 'inline';
                }
            });
        }
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('adminLoginForm');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = loginForm.querySelector('#username').value.trim();
            const password = loginForm.querySelector('#password').value.trim();
            const loginButton = loginForm.querySelector('.btn-login');
            
            if (!username || !password) {
                this.showLoginError('Please enter both username and password');
                return;
            }
            
            this.showLoadingState(loginButton, true);
            
            try {
                const isAuthenticated = await this.authenticateUser(username, password);
                
                if (isAuthenticated) {
                    localStorage.setItem('adminAuthenticated', 'true');
                    localStorage.setItem('adminUsername', username);
                    
                    this.showNotification('Login successful! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    this.showLoadingState(loginButton, false);
                    this.showLoginError('Invalid username or password');
                }
            } catch (error) {
                this.showLoadingState(loginButton, false);
                this.showLoginError('Login failed. Please try again.');
                console.error('Login error:', error);
            }
        });
    }
    
    async authenticateUser(username, password) {
        try {
            const response = await Auth.login(username, password);
            if (response.success && response.token) {
                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminUsername', response.user.username);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login authentication error:', error);
            return false;
        }
    }
    
    showLoadingState(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
    
    showLoginError(message) {
        const existingError = document.querySelector('.login-error');
        if (existingError) existingError.remove();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'login-error';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.insertBefore(errorElement, loginForm.firstChild);
        }
    }
}

// Initialize admin dashboard
let admin = null;

document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminDashboard();
    window.admin = admin;
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}