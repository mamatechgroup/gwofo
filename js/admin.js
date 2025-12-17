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
    }
    
    checkAuthentication() {
        const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('login.html')) {
            this.setupLoginRedirect();
            return;
        }
        
        if (!isAuthenticated) {
            window.location.href = 'login.html';
        }
        
        this.displayCurrentUser();
    }
    
    setupLoginRedirect() {
        if (localStorage.getItem('adminAuthenticated') === 'true') {
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
        // Logout button
        this.setupLogoutListener();
        
        // Mobile menu toggle
        this.setupMobileMenu();
        
        // Form submissions
        this.setupFormSubmissions();
    }
    
    setupLogoutListener() {
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    logout() {
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
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && sidebar.classList.contains('active')) {
                if (!e.target.closest('.admin-sidebar') && !e.target.closest('.mobile-toggle')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
    
    setupFormSubmissions() {
        document.querySelectorAll('.crud-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form);
            });
        });
    }
    
    setupCRUDOperations() {
        // Add buttons for modals
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                if (modalId) this.openModal(modalId);
            });
        });
        
        // Setup progress range display
        this.setupProgressRange();
        
        // Setup form validation
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
        // This is handled in validateForm method
    }
    
    setupSearchEnhancements() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;
        
        // Real-time search
        searchInput.addEventListener('input', (e) => {
            this.filterTable(e.target.value.toLowerCase());
        });
        
        // Enter key search
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.enhancedSearch(e.target.value.toLowerCase());
            }
        });
        
        // Search icon click
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
        
        // Remove previous highlights
        const highlights = element.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
        
        // Highlight new matches
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
            span.style.backgroundColor = '#fff3cd';
            span.style.padding = '2px 4px';
            span.style.borderRadius = '3px';
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
                    <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-light);">
                        No matching results found
                    </td>
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
            input.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
        });
    }
    
    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // In a real app, display preview or upload to server
            console.log('File selected:', file.name, file.type, Math.round(file.size / 1024) + 'KB');
            
            // Example: Show file info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)}KB)`;
            fileInfo.style.marginTop = '10px';
            fileInfo.style.fontSize = '0.9rem';
            fileInfo.style.color = 'var(--text-light)';
            
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
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }
    
    setupModals() {
        // Close buttons
        document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Close modal on outside click
        document.querySelectorAll('.form-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
        
        // Add smooth transitions
        document.querySelectorAll('.form-modal').forEach(modal => {
            modal.style.transition = 'opacity 0.3s ease';
        });
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        this.closeAllModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
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
        const mockData = {
            totalPosts: 45,
            totalProjects: 18,
            totalComments: 236,
            totalUsers: 1250,
            recentPosts: [
                { id: 1, title: 'New Education Initiative', author: 'Sarah Johnson', date: '2024-01-15', status: 'published' },
                { id: 2, title: 'Annual Report 2023', author: 'Mary Kamara', date: '2024-01-12', status: 'published' },
                { id: 3, title: 'Upcoming Events', author: 'Sarah Johnson', date: '2024-01-10', status: 'draft' },
                { id: 4, title: 'Success Stories', author: 'James Cole', date: '2024-01-08', status: 'published' }
            ],
            recentProjects: [
                { id: 1, name: 'Girls Education Program', progress: 75, status: 'active' },
                { id: 2, name: 'Women Entrepreneurship', progress: 60, status: 'active' },
                { id: 3, name: 'Healthcare Access', progress: 100, status: 'completed' },
                { id: 4, name: 'Digital Literacy', progress: 30, status: 'active' }
            ]
        };
        
        this.updateStats(mockData);
        this.populateTable('recentPostsTable', mockData.recentPosts, 'posts');
        this.populateTable('recentProjectsTable', mockData.recentProjects, 'projects');
    }
    
    updateStats(data) {
        document.querySelectorAll('.stat-number').forEach(stat => {
            const statType = stat.closest('.stat-card').dataset.stat;
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
                row.innerHTML = `
                    <td>${item.title}</td>
                    <td>${item.author}</td>
                    <td>${this.formatDate(item.date)}</td>
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
                    <td>${item.name}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${item.progress}%"></div>
                        </div>
                        <small>${item.progress}%</small>
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
        
        // Attach event listeners to new buttons
        this.attachRowEventListeners();
    }
    
    attachRowEventListeners() {
        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                this.editItem(type, id);
            });
        });
        
        // Delete buttons
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
        
        // Simulate API call
        console.log(`Submitting ${formType}:`, data);
        
        // Show success message
        this.showNotification(
            `${formType.charAt(0).toUpperCase() + formType.slice(1)} saved successfully!`,
            'success'
        );
        
        // Close modal and reset form
        this.closeAllModals();
        form.reset();
        
        // Reload data
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
        
        // Email validation
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
        field.style.borderColor = 'var(--secondary-color)';
        
        let errorElement = field.parentElement.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.style.color = 'var(--secondary-color)';
            errorElement.style.fontSize = '0.85rem';
            errorElement.style.marginTop = '5px';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    clearFieldError(field) {
        field.style.borderColor = '';
        
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) errorElement.remove();
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) existingNotification.remove();
        
        // Create notification
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
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#66bb6a' : 
                        type === 'error' ? '#ff6b8b' : 
                        type === 'warning' ? '#ffb74d' : 'var(--primary-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            z-index: 3000;
            min-width: 300px;
            max-width: 400px;
        `;
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    }
    
    editItem(type, id) {
        console.log(`Editing ${type} with ID: ${id}`);
        this.openModal(`${type}Modal`);
        
        // In a real app, fetch data and populate form
        // this.populateFormWithData(type, id);
    }
    
    deleteItem(type, id) {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            console.log(`Deleting ${type} with ID: ${id}`);
            
            this.showNotification(
                `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`,
                'success'
            );
            
            // Reload data
            setTimeout(() => this.loadDashboardData(), 500);
        }
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
                this.innerHTML = type === 'password' ? 
                    '<i class="fas fa-eye"></i>' : 
                    '<i class="fas fa-eye-slash"></i>';
            });
        }
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('adminLoginForm');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = loginForm.querySelector('#username').value.trim();
            const password = loginForm.querySelector('#password').value.trim();
            
            if (!username || !password) {
                this.showLoginError('Please enter both username and password');
                return;
            }
            
            // Mock authentication (replace with real API call)
            if (this.authenticateUser(username, password)) {
                localStorage.setItem('adminAuthenticated', 'true');
                localStorage.setItem('adminUsername', username);
                window.location.href = 'dashboard.html';
            } else {
                this.showLoginError('Invalid username or password');
            }
        });
    }
    
    authenticateUser(username, password) {
        // Mock authentication - in production, make API call
        return username === 'admin' && password === 'password';
    }
    
    showLoginError(message) {
        // Remove existing error
        const existingError = document.querySelector('.login-error');
        if (existingError) existingError.remove();
        
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'login-error';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        errorElement.style.cssText = `
            color: var(--secondary-color);
            background: rgba(255, 107, 139, 0.1);
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Insert error after form header
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.insertBefore(errorElement, loginForm.firstChild);
        }
    }
    
    // Utility method to add notification styles
    static addNotificationStyles() {
        if (document.querySelector('#notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.3s ease;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize admin dashboard
let admin = null;

document.addEventListener('DOMContentLoaded', () => {
    // Add notification styles
    AdminDashboard.addNotificationStyles();
    
    // Initialize admin dashboard
    admin = new AdminDashboard();
    
    // Make admin globally accessible for debugging
    window.admin = admin;
});

// Export for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}