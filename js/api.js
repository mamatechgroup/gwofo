// API Service Utility for Frontend Integration - GWOFO Platform
// Save as: js/api.js

// Determine API base URL dynamically based on environment
const API_BASE_URL = (() => {
    // 1. Explicit window-level override (e.g., injected via build or head script)
    if (typeof window !== 'undefined' && window.__API_URL__) {
        return window.__API_URL__.replace(/\/$/, '');
    }

    if (typeof window === 'undefined') return 'http://localhost:10000/api';
    const hostname = window.location.hostname;
    
    // 2. Production domain (gwofoliberia.org), Netlify CDN previews, or subdomains
    if (hostname === 'gwofoliberia.org' || 
        hostname === 'www.gwofoliberia.org' || 
        hostname.endsWith('.gwofoliberia.org') ||
        hostname.includes('netlify.app')) {
        return 'https://api.gwofoliberia.org/api';
    }
    
    // 3. Direct local file opening or headless testing
    if (window.location.protocol === 'file:' || !hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:10000/api';
    }
    
    // 4. Fallback: relative API on current host
    return `${window.location.protocol}//${window.location.host}/api`;
})();

window.API_BASE_URL = API_BASE_URL;

/**
 * Generic fetch wrapper with token management, error handling, and timeout safety
 */
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('adminToken');
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // 15-second timeout controller to prevent hanging connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    const config = {
        ...options,
        signal: options.signal || controller.signal,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: API Error`);
        }
        
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`API Timeout (${endpoint}): Request exceeded 15s`);
            throw new Error('Request timed out. Please check your network connection.');
        }
        console.error(`API Error (${endpoint}):`, error.message || error);
        throw error;
    }
}

// ==================== AUTHENTICATION ====================
const Auth = {
    async login(username, password) {
        return apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },
    
    async logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('currentUser');
        return apiCall('/auth/logout', { method: 'POST' }).catch(() => ({ success: true }));
    },
    
    async getCurrentUser() {
        return apiCall('/auth/user');
    },
    
    async verifyToken(token) {
        return apiCall('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    },
    
    async updateProfile(data) {
        return apiCall('/auth/update-profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async changePassword(currentPassword, newPassword) {
        return apiCall('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }
};

// ==================== STATS (PUBLIC & ZERO MOCK DATA) ====================
const Stats = {
    async getPublic() {
        return apiCall('/stats/public');
    },

    async updateImpact(data) {
        return apiCall('/stats/impact', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
};

// ==================== INQUIRIES & FORMS ====================
const Inquiries = {
    async submitContact(data) {
        return apiCall('/inquiries/contact', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async submitPartner(data) {
        return apiCall('/inquiries/partner', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async submitVolunteer(data) {
        return apiCall('/inquiries/volunteer', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getAll(type = 'contact', status = null) {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        return apiCall(`/inquiries/${type}${query}`);
    },

    async updateStatus(type, id, status) {
        return apiCall(`/inquiries/${type}/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    async delete(type, id) {
        return apiCall(`/inquiries/${type}/${id}`, {
            method: 'DELETE'
        });
    },

    async bulkDelete(type, ids) {
        return apiCall(`/inquiries/${type}/bulk-delete`, {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    },

    async getStats() {
        return apiCall('/inquiries/stats/summary');
    }
};

// ==================== COMMENTS ====================
const Comments = {
    async getForProject(projectId) {
        return apiCall(`/comments/project/${projectId}`);
    },

    async getForPost(postId) {
        return apiCall(`/comments/post/${postId}`);
    },

    async submitProjectComment(projectId, data) {
        return apiCall(`/comments/project/${projectId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async submitPostComment(postId, data) {
        return apiCall(`/comments/post/${postId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getAllAdmin(status = null, type = 'all') {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (type) params.append('type', type);
        return apiCall(`/comments/admin/all?${params.toString()}`);
    },

    async updateStatus(type, id, status) {
        return apiCall(`/comments/admin/${type}/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    async delete(type, id) {
        return apiCall(`/comments/admin/${type}/${id}`, {
            method: 'DELETE'
        });
    },

    async bulkDelete(itemsOrType, ids) {
        let body = {};
        if (Array.isArray(itemsOrType)) {
            body = { items: itemsOrType };
        } else if (typeof itemsOrType === 'string' && Array.isArray(ids)) {
            body = { type: itemsOrType, ids };
        } else if (typeof itemsOrType === 'object') {
            body = itemsOrType;
        }
        return apiCall('/comments/admin/bulk-delete', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
};

// ==================== POSTS ====================
const Posts = {
    async getAll() {
        return apiCall('/posts');
    },
    
    async getById(id) {
        return apiCall(`/posts/${id}`);
    },
    
    async create(postData) {
        return apiCall('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    },
    
    async update(id, postData) {
        return apiCall(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    },
    
    async delete(id) {
        return apiCall(`/posts/${id}`, { method: 'DELETE' });
    },
    
    async getByCategory(category) {
        return apiCall(`/posts/category/${category}`);
    },
    
    async getByStatus(status) {
        return apiCall(`/posts/status/${status}`);
    },
    
    async getRecent(limit = 5) {
        return apiCall(`/posts/recent/${limit}`);
    }
};

// ==================== PROJECTS ====================
const Projects = {
    async getAll() {
        return apiCall('/projects');
    },
    
    async getById(id) {
        return apiCall(`/projects/${id}`);
    },
    
    async create(projectData) {
        return apiCall('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },
    
    async update(id, projectData) {
        return apiCall(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    },
    
    async delete(id) {
        return apiCall(`/projects/${id}`, { method: 'DELETE' });
    },
    
    async getByStatus(status) {
        return apiCall(`/projects/status/${status}`);
    },
    
    async getByCategory(category) {
        return apiCall(`/projects/category/${category}`);
    },
    
    async getRecent(limit = 5) {
        return apiCall(`/projects/recent/${limit}`);
    },
    
    async updateProgress(id, percentage) {
        return apiCall(`/projects/${id}/progress`, {
            method: 'PATCH',
            body: JSON.stringify({ progress_percentage: percentage })
        });
    }
};

// ==================== TEAM ====================
const Team = {
    async getAll() {
        return apiCall('/team');
    },
    
    async getById(id) {
        return apiCall(`/team/${id}`);
    },
    
    async create(memberData) {
        return apiCall('/team', {
            method: 'POST',
            body: JSON.stringify(memberData)
        });
    },
    
    async update(id, memberData) {
        return apiCall(`/team/${id}`, {
            method: 'PUT',
            body: JSON.stringify(memberData)
        });
    },
    
    async delete(id) {
        return apiCall(`/team/${id}`, { method: 'DELETE' });
    },
    
    async getByDepartment(department) {
        return apiCall(`/team/department/${department}`);
    },
    
    async getByStatus(status) {
        return apiCall(`/team/status/${status}`);
    },
    
    async getStats() {
        return apiCall('/team/stats/summary');
    }
};

// ==================== PARTNERS ====================
const Partners = {
    async getAll() {
        return apiCall('/partners');
    },
    
    async getById(id) {
        return apiCall(`/partners/${id}`);
    },
    
    async create(partnerData) {
        return apiCall('/partners', {
            method: 'POST',
            body: JSON.stringify(partnerData)
        });
    },
    
    async update(id, partnerData) {
        return apiCall(`/partners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(partnerData)
        });
    },
    
    async delete(id) {
        return apiCall(`/partners/${id}`, { method: 'DELETE' });
    },
    
    async getByType(type) {
        return apiCall(`/partners/type/${type}`);
    },
    
    async getByLevel(level) {
        return apiCall(`/partners/level/${level}`);
    },
    
    async getByStatus(status) {
        return apiCall(`/partners/status/${status}`);
    },
    
    async getStats() {
        return apiCall('/partners/stats/summary');
    }
};

// ==================== SLIDES ====================
const Slides = {
    async getAll() {
        return apiCall('/slides');
    },
    
    async getById(id) {
        return apiCall(`/slides/${id}`);
    },
    
    async create(slideData) {
        return apiCall('/slides', {
            method: 'POST',
            body: JSON.stringify(slideData)
        });
    },
    
    async update(id, slideData) {
        return apiCall(`/slides/${id}`, {
            method: 'PUT',
            body: JSON.stringify(slideData)
        });
    },
    
    async delete(id) {
        return apiCall(`/slides/${id}`, { method: 'DELETE' });
    },
    
    async getActive() {
        return apiCall('/slides/status/active');
    },
    
    async getByPosition(position) {
        return apiCall(`/slides/position/${position}`);
    },
    
    async updatePosition(id, position) {
        return apiCall(`/slides/${id}/position`, {
            method: 'PATCH',
            body: JSON.stringify({ position })
        });
    }
};

// ==================== NEWSLETTER ====================
const Newsletter = {
    async getAll() {
        return apiCall('/newsletter/subscriptions');
    },

    async delete(id) {
        return apiCall(`/newsletter/subscriptions/${id}`, { method: 'DELETE' });
    },

    async unsubscribe(id) {
        return apiCall(`/newsletter/unsubscribe/${id}`, { method: 'POST' });
    },

    async subscribe(email, fullName) {
        return apiCall('/newsletter/subscribe', {
            method: 'POST',
            body: JSON.stringify({ email, fullName, full_name: fullName })
        });
    }
};

// ==================== DASHBOARD & BACKUPS ====================
const Dashboard = {
    async getStats() {
        return apiCall('/dashboard/stats');
    },
    
    async getSummary() {
        return apiCall('/dashboard/summary');
    },
    
    async getRecentActivity() {
        return apiCall('/dashboard/recent-activity');
    }
};

const Backups = {
    async getAll() {
        return apiCall('/backups');
    },

    async create(type = 'Full') {
        return apiCall('/backups', {
            method: 'POST',
            body: JSON.stringify({ type })
        });
    },

    async restore(filename) {
        return apiCall(`/backups/restore/${encodeURIComponent(filename)}`, {
            method: 'POST'
        });
    },

    async delete(filename) {
        return apiCall(`/backups/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
    },

    async getSchedule() {
        return apiCall('/backups/schedule');
    },

    async saveSchedule(data) {
        return apiCall('/backups/schedule', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ==================== SOCIAL LINKS ====================
const SocialLinks = {
    async getPublic() {
        return apiCall('/social-links');
    },
    async getAllAdmin() {
        return apiCall('/social-links/admin');
    },
    async getById(id) {
        return apiCall(`/social-links/${id}`);
    },
    async create(data) {
        return apiCall('/social-links', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return apiCall(`/social-links/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        return apiCall(`/social-links/${id}`, {
            method: 'DELETE'
        });
    }
};

// Export to window
window.Auth = Auth;
window.Stats = Stats;
window.Inquiries = Inquiries;
window.Comments = Comments;
window.Posts = Posts;
window.Projects = Projects;
window.Team = Team;
window.Partners = Partners;
window.Slides = Slides;
window.Newsletter = Newsletter;
window.Dashboard = Dashboard;
window.Backups = Backups;
window.SocialLinks = SocialLinks;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiCall, Auth, Stats, Inquiries, Comments, Posts, Projects, Team, Partners, Slides, Newsletter, Dashboard, Backups, SocialLinks };
}

