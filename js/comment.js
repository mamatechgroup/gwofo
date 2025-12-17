// Comments System JavaScript
class CommentSystem {
    constructor() {
        this.comments = [];
        this.nextCommentId = 1;
        this.nextReplyId = 1;
        this.currentUser = null;
        this.initialize();
    }
    
    initialize() {
        this.loadComments();
        this.setupEventListeners();
        this.setupUserSession();
    }
    
    setupUserSession() {
        // Try to get existing user session
        const savedUser = localStorage.getItem('commentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }
    
    loadComments() {
        // In a real app, this would fetch from an API
        // For demo, we'll use sample data
        this.comments = [
            {
                id: 1,
                postId: 'project1',
                parentId: null,
                userName: 'Sarah M. Johnson',
                userEmail: 'sarah@example.com',
                content: 'This is an amazing initiative! As a former beneficiary of similar programs, I can attest to the life-changing impact education has on girls.',
                likes: 24,
                isApproved: true,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                replies: [
                    {
                        id: 2,
                        parentId: 1,
                        userName: 'Project Team',
                        userEmail: 'team@foundation.org',
                        content: 'Thank you for sharing your experience, Sarah! Your success story inspires us to continue this important work.',
                        likes: 8,
                        isApproved: true,
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
                    }
                ]
            },
            {
                id: 3,
                postId: 'project1',
                parentId: null,
                userName: 'James Kollie',
                userEmail: 'james@example.com',
                content: 'How can I volunteer for this program? I\'m a retired teacher with experience working with girls in rural communities.',
                likes: 15,
                isApproved: true,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                replies: []
            }
        ];
        
        this.renderComments();
    }
    
    setupEventListeners() {
        // Comment form submission
        const commentForms = document.querySelectorAll('.comment-form form');
        commentForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        });
        
        // Like buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) {
                this.handleLike(e.target.closest('.like-btn'));
            }
            
            if (e.target.closest('.reply-btn')) {
                this.handleReplyToggle(e.target.closest('.reply-btn'));
            }
            
            if (e.target.closest('.share-btn')) {
                this.handleShare(e.target.closest('.share-btn'));
            }
        });
        
        // Reply form submission
        document.addEventListener('submit', (e) => {
            if (e.target.closest('.reply-form form')) {
                this.handleReplySubmit(e);
            }
        });
    }
    
    handleCommentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const postId = form.closest('.comment-section').dataset.postId || 'project1';
        const name = form.querySelector('#name').value.trim();
        const email = form.querySelector('#email').value.trim();
        const comment = form.querySelector('#comment').value.trim();
        
        if (!name || !email || !comment) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Save user info for future
        this.currentUser = { name, email };
        localStorage.setItem('commentUser', JSON.stringify(this.currentUser));
        
        // Create new comment
        const newComment = {
            id: this.nextCommentId++,
            postId: postId,
            parentId: null,
            userName: name,
            userEmail: email,
            content: comment,
            likes: 0,
            isApproved: false, // Would need approval in real app
            createdAt: new Date(),
            replies: []
        };
        
        this.comments.unshift(newComment);
        this.renderComments();
        this.showMessage('Comment submitted! It will appear after moderation.', 'success');
        
        // Reset form
        form.reset();
        
        // Auto-fill name and email for next time
        this.autoFillUserInfo();
    }
    
    handleReplySubmit(e) {
        e.preventDefault();
        const form = e.target;
        const commentId = parseInt(form.dataset.commentId);
        const name = form.querySelector('#reply-name').value.trim();
        const reply = form.querySelector('#reply-text').value.trim();
        
        if (!name || !reply) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Find parent comment
        const parentComment = this.findCommentById(commentId);
        if (!parentComment) return;
        
        // Create new reply
        const newReply = {
            id: this.nextReplyId++,
            parentId: commentId,
            userName: name,
            userEmail: this.currentUser?.email || '',
            content: reply,
            likes: 0,
            isApproved: false,
            createdAt: new Date()
        };
        
        parentComment.replies.push(newReply);
        this.renderComments();
        this.showMessage('Reply submitted!', 'success');
        
        // Reset form and hide it
        form.reset();
        const replyForm = form.closest('.reply-form');
        if (replyForm) {
            replyForm.classList.remove('active');
        }
    }
    
    handleLike(button) {
        const commentId = parseInt(button.dataset.commentId);
        const comment = this.findCommentById(commentId);
        
        if (!comment) {
            // Check if it's a reply
            const reply = this.findReplyById(commentId);
            if (reply) {
                this.toggleLike(reply, button);
            }
            return;
        }
        
        this.toggleLike(comment, button);
    }
    
    toggleLike(comment, button) {
        // In a real app, this would track user-specific likes
        // For demo, we'll just toggle locally
        
        const isLiked = button.classList.contains('liked');
        const likeCount = button.querySelector('.like-count');
        
        if (isLiked) {
            comment.likes--;
            button.classList.remove('liked');
            button.innerHTML = `<i class="far fa-heart"></i> Like <span class="like-count">${comment.likes}</span>`;
            this.showMessage('Like removed', 'info');
        } else {
            comment.likes++;
            button.classList.add('liked');
            button.innerHTML = `<i class="fas fa-heart"></i> Liked <span class="like-count">${comment.likes}</span>`;
            this.showMessage('Comment liked!', 'success');
        }
    }
    
    handleReplyToggle(button) {
        const commentId = parseInt(button.dataset.commentId);
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        
        if (replyForm) {
            replyForm.classList.toggle('active');
            
            if (replyForm.classList.contains('active')) {
                const textarea = replyForm.querySelector('textarea');
                if (textarea) {
                    textarea.focus();
                    
                    // Auto-fill name if user is logged in
                    if (this.currentUser?.name) {
                        const nameInput = replyForm.querySelector('input[type="text"]');
                        if (nameInput && !nameInput.value) {
                            nameInput.value = this.currentUser.name;
                        }
                    }
                }
            }
        }
    }
    
    handleShare(button) {
        const url = window.location.href;
        const title = document.title;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url,
                text: 'Check out this comment on Girls and Women Foundation Liberia website'
            }).then(() => {
                this.showMessage('Shared successfully!', 'success');
            }).catch(err => {
                console.log('Error sharing:', err);
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                this.showMessage('Link copied to clipboard!', 'success');
            }).catch(err => {
                console.log('Error copying:', err);
                this.showMessage('Failed to copy link', 'error');
            });
        }
    }
    
    renderComments() {
        const commentsList = document.querySelector('.comments-list');
        if (!commentsList) return;
        
        commentsList.innerHTML = '';
        
        // Sort comments by date (newest first)
        const sortedComments = [...this.comments].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Filter approved comments (in real app)
        const approvedComments = sortedComments.filter(comment => 
            comment.isApproved || true // Show all for demo
        );
        
        approvedComments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
            
            // Add replies if any
            if (comment.replies && comment.replies.length > 0) {
                const repliesContainer = commentElement.querySelector('.replies');
                if (repliesContainer) {
                    // Sort replies by date
                    const sortedReplies = [...comment.replies].sort((a, b) => 
                        new Date(a.createdAt) - new Date(b.createdAt)
                    );
                    
                    sortedReplies.forEach(reply => {
                        if (reply.isApproved || true) { // Show all for demo
                            const replyElement = this.createReplyElement(reply);
                            repliesContainer.appendChild(replyElement);
                        }
                    });
                }
            }
        });
        
        // If no comments, show message
        if (approvedComments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comment-slash"></i>
                    <h4>No comments yet</h4>
                    <p>Be the first to share your thoughts!</p>
                </div>
            `;
        }
    }
    
    createCommentElement(comment) {
        const timeAgo = this.getTimeAgo(comment.createdAt);
        const commentId = comment.id;
        
        return document.createRange().createContextualFragment(`
            <div class="comment" id="comment-${commentId}">
                <div class="comment-header">
                    <div class="comment-author">
                        <strong>${comment.userName}</strong>
                        <span class="comment-date">${timeAgo}</span>
                    </div>
                    <div class="comment-actions">
                        <button class="like-btn" data-comment-id="${commentId}">
                            <i class="${comment.likes > 0 ? 'fas' : 'far'} fa-heart"></i> 
                            <span class="like-count">${comment.likes}</span>
                        </button>
                        <button class="reply-btn" data-comment-id="${commentId}">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button class="share-btn">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                </div>
                <div class="comment-content">
                    <p>${this.escapeHtml(comment.content)}</p>
                </div>
                <div class="replies" id="replies-${commentId}"></div>
                <div class="reply-form" id="reply-form-${commentId}">
                    <form data-comment-id="${commentId}">
                        <div class="form-group">
                            <input type="text" id="reply-name-${commentId}" placeholder="Your Name" required>
                        </div>
                        <div class="form-group">
                            <textarea id="reply-text-${commentId}" placeholder="Your Reply" rows="2" required></textarea>
                        </div>
                        <button type="submit" class="btn-secondary">Post Reply</button>
                    </form>
                </div>
            </div>
        `).firstElementChild;
    }
    
    createReplyElement(reply) {
        const timeAgo = this.getTimeAgo(reply.createdAt);
        const replyId = reply.id;
        
        return document.createRange().createContextualFragment(`
            <div class="comment reply" id="reply-${replyId}">
                <div class="comment-header">
                    <div class="comment-author">
                        <strong>${reply.userName}</strong>
                        <span class="comment-date">${timeAgo}</span>
                    </div>
                    <div class="comment-actions">
                        <button class="like-btn" data-comment-id="${replyId}">
                            <i class="${reply.likes > 0 ? 'fas' : 'far'} fa-heart"></i> 
                            <span class="like-count">${reply.likes}</span>
                        </button>
                        <button class="share-btn">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                </div>
                <div class="comment-content">
                    <p>${this.escapeHtml(reply.content)}</p>
                </div>
            </div>
        `).firstElementChild;
    }
    
    findCommentById(id) {
        return this.comments.find(comment => comment.id === id);
    }
    
    findReplyById(id) {
        for (const comment of this.comments) {
            const reply = comment.replies.find(reply => reply.id === id);
            if (reply) return reply;
        }
        return null;
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        const year = day * 365;
        
        if (diff < minute) {
            return 'Just now';
        } else if (diff < hour) {
            const minutes = Math.floor(diff / minute);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diff < day) {
            const hours = Math.floor(diff / hour);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diff < week) {
            const days = Math.floor(diff / day);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else if (diff < month) {
            const weeks = Math.floor(diff / week);
            return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
        } else if (diff < year) {
            const months = Math.floor(diff / month);
            return `${months} month${months !== 1 ? 's' : ''} ago`;
        } else {
            const years = Math.floor(diff / year);
            return `${years} year${years !== 1 ? 's' : ''} ago`;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    autoFillUserInfo() {
        if (this.currentUser) {
            const nameInputs = document.querySelectorAll('input[type="text"][id="name"]');
            const emailInputs = document.querySelectorAll('input[type="email"][id="email"]');
            
            nameInputs.forEach(input => {
                if (!input.value && this.currentUser.name) {
                    input.value = this.currentUser.name;
                }
            });
            
            emailInputs.forEach(input => {
                if (!input.value && this.currentUser.email) {
                    input.value = this.currentUser.email;
                }
            });
        }
    }
    
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.comment-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `comment-message comment-message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : 
                        type === 'error' ? '#f44336' : 
                        '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        // Add to document
        document.body.appendChild(messageDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Add CSS animations
        const style = document.createElement('style');
        if (!document.querySelector('#comment-message-animations')) {
            style.id = 'comment-message-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize comment system
let commentSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    commentSystem = new CommentSystem();
    
    // Add additional styles for comment system
    const style = document.createElement('style');
    style.textContent = `
        .no-comments {
            text-align: center;
            padding: 40px;
            color: var(--text-light);
        }
        
        .no-comments i {
            font-size: 3rem;
            margin-bottom: 20px;
            color: var(--gray);
        }
        
        .no-comments h4 {
            margin-bottom: 10px;
            color: var(--dark-color);
        }
        
        .comment-message {
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .like-btn.liked i {
            color: #e74c3c;
        }
        
        .reply-form {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .reply-form.active {
            max-height: 300px;
            margin-top: 20px;
        }
        
        .comment .replies {
            margin-left: 30px;
            padding-left: 20px;
            border-left: 2px solid var(--gray-light);
        }
        
        @media (max-width: 768px) {
            .comment .replies {
                margin-left: 15px;
                padding-left: 15px;
            }
        }
    `;
    document.head.appendChild(style);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CommentSystem };
}