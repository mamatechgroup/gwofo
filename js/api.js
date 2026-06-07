// API Service Utility for Frontend Integration
// Save as: js/api.js

// Determine API base URL based on environment
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    
    // Production (Netlify + Render)
    if (hostname.includes('netlify.app')) {
        return 'https://gwofo-backend.onrender.com/api';
    }
    
    // Staging/Preview
    if (hostname.includes('netlify-preview')) {
        return 'https://gwofo-backend.onrender.com/api';
    }
    
    // Local development
    return 'http://localhost:3000/api';
})();

/**
 * Generic fetch wrapper with error handling
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
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
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
        return apiCall('/auth/logout', { method: 'POST' });
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
    }
};

// ==================== DASHBOARD ====================

const Dashboard = {
    async getStats() {
        return apiCall('/dashboard/stats');
    },
    
    async getSummary() {
        return apiCall('/dashboard/summary');
    },
    
    async getPostsStats() {
        return apiCall('/dashboard/posts-stats');
    },
    
    async getProjectsStats() {
        return apiCall('/dashboard/projects-stats');
    },
    
    async getTeamStats() {
        return apiCall('/dashboard/team-stats');
    },
    
    async getPartnersStats() {
        return apiCall('/dashboard/partners-stats');
    },
    
    async getRecentActivity() {
        return apiCall('/dashboard/recent-activity');
    },
    
    async logActivity(activity) {
        return apiCall('/dashboard/log-activity', {
            method: 'POST',
            body: JSON.stringify(activity)
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

// ==================== NEWSLETTER / SUBSCRIPTIONS ====================

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

// Export all modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiCall, Auth, Dashboard, Posts, Projects, Team, Partners, Slides, Newsletter };
}
