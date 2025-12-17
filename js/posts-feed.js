// Posts Feed JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize posts
    loadPosts();
    
    // Initialize event listeners
    initEventListeners();
});

// Sample posts data
const postsData = [
    {
        id: 1,
        author: {
            name: "Sarah Johnson",
            avatar: "assets/images/team1.jpg",
            role: "Executive Director"
        },
        date: "2 hours ago",
        category: "news",
        content: "Exciting news! Our Girls Education Program has just received funding from UNICEF Liberia. This partnership will allow us to expand our reach to 5 more rural communities and provide scholarships to 200 additional girls this year. Education is the key to empowerment, and we're committed to ensuring every girl in Liberia has access to quality education.",
        image: "assets/images/slide1.jpg",
        likes: 245,
        comments: 42,
        shares: 18,
        liked: true,
        commentsList: [
            {
                id: 1,
                author: "Mary Kamara",
                avatar: "assets/images/avatar2.jpg",
                content: "This is amazing news! As a former beneficiary of this program, I know firsthand how life-changing it can be.",
                date: "1 hour ago",
                likes: 12
            },
            {
                id: 2,
                author: "James Kollie",
                avatar: "assets/images/avatar3.jpg",
                content: "How can I volunteer for this program? I'm a retired teacher with experience working in rural areas.",
                date: "45 minutes ago",
                likes: 5
            }
        ]
    },
    {
        id: 2,
        author: {
            name: "Mary Kamara",
            avatar: "assets/images/team2.jpg",
            role: "Program Manager"
        },
        date: "1 day ago",
        category: "updates",
        content: "Our Women Entrepreneurship Workshop in Monrovia was a huge success! 50 women completed the training and received seed funding to start their small businesses. Seeing the determination and creativity of these women was truly inspiring. Special thanks to Liberia Bank for their partnership and support.",
        image: "assets/images/slide2.jpeg",
        likes: 189,
        comments: 28,
        shares: 32,
        liked: false,
        commentsList: [
            {
                id: 1,
                author: "Patricia Sherman",
                avatar: "assets/images/team4.jpg",
                content: "The workshop was transformative! I've already started planning my business.",
                date: "22 hours ago",
                likes: 8
            }
        ]
    },
    {
        id: 3,
        author: {
            name: "John Doe",
            avatar: "assets/images/team3.jpg",
            role: "Finance Director"
        },
        date: "3 days ago",
        category: "stories",
        content: "Success Story: Meet Aminata, a 16-year-old from Bong County. Through our scholarship program, she's now attending school for the first time in her life. Her dream is to become a doctor and serve her community. Stories like Aminata's remind us why we do what we do.",
        image: "assets/images/slide3.jpeg",
        likes: 312,
        comments: 56,
        shares: 45,
        liked: true,
        commentsList: [
            {
                id: 1,
                author: "Sarah Johnson",
                avatar: "assets/images/team1.jpg",
                content: "Aminata's determination is inspiring to us all. We're proud to support her journey!",
                date: "2 days ago",
                likes: 24
            }
        ]
    },
    {
        id: 4,
        author: {
            name: "Girls & Women Foundation",
            avatar: "assets/images/logo-icon.png",
            role: "Organization"
        },
        date: "1 week ago",
        category: "events",
        content: "Join us for our Annual Fundraising Gala on March 25th! This special event will feature success stories from our programs, cultural performances, and opportunities to meet our team and beneficiaries. All proceeds will go towards expanding our healthcare access initiative.",
        image: "assets/images/event.jpg",
        likes: 156,
        comments: 34,
        shares: 67,
        liked: false,
        commentsList: []
    }
];

// DOM Elements
let postsContainer = document.getElementById('postsContainer');
let loadingSpinner = document.getElementById('loadingSpinner');
let noPostsMessage = document.getElementById('noPostsMessage');
let filterButtons = document.querySelectorAll('.filter-btn');
let searchInput = document.getElementById('postSearch');
let publishButton = document.getElementById('publishPost');
let newPostContent = document.getElementById('newPostContent');
let modal = document.getElementById('postDetailModal');
let closeModal = document.getElementById('closeModal');
let modalBody = document.getElementById('modalBody');

// Current state
let currentFilter = 'all';
let currentPosts = [...postsData];
let isLoading = false;
let currentUser = {
    name: "You",
    avatar: "assets/images/avatar-default.jpg"
};

// Load and display posts
function loadPosts() {
    if (currentPosts.length === 0) {
        noPostsMessage.style.display = 'block';
        loadingSpinner.style.display = 'none';
        return;
    }
    
    noPostsMessage.style.display = 'none';
    postsContainer.innerHTML = '';
    
    // Sort posts by date (newest first)
    currentPosts.sort((a, b) => {
        // Simple sorting based on id (in real app, use actual dates)
        return b.id - a.id;
    });
    
    currentPosts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
    
    loadingSpinner.style.display = 'none';
}

// Create a post element
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.id = post.id;
    postElement.dataset.category = post.category;
    
    // Format category display name
    const categoryNames = {
        'news': 'News',
        'updates': 'Update',
        'stories': 'Success Story',
        'events': 'Event'
    };
    
    const postHTML = `
        <div class="post-header">
            <div class="post-author-avatar">
                <img src="${post.author.avatar}" alt="${post.author.name}">
            </div>
            <div class="post-author-info">
                <div class="post-author-name">${post.author.name}</div>
                <div class="post-meta">
                    <span class="post-date">${post.date}</span>
                    <span class="post-category ${post.category}">${categoryNames[post.category]}</span>
                    ${post.author.role ? `<span class="post-role">${post.author.role}</span>` : ''}
                </div>
            </div>
            <div class="post-actions-dropdown">
                <button class="post-actions-btn">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="post-dropdown-menu">
                    <button class="save-post">
                        <i class="far fa-bookmark"></i> Save Post
                    </button>
                    <button class="report-post">
                        <i class="far fa-flag"></i> Report Post
                    </button>
                    <button class="copy-link">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                </div>
            </div>
        </div>
        
        <div class="post-content">
            <div class="post-text">${post.content}</div>
            ${post.image ? `
                <div class="post-image">
                    <img src="${post.image}" alt="Post image">
                </div>
            ` : ''}
        </div>
        
        <div class="post-stats">
            <div class="likes-count">
                <i class="fas fa-thumbs-up"></i>
                <span>${post.likes}</span>
            </div>
            <div class="comments-count">
                <i class="far fa-comment"></i>
                <span>${post.comments}</span>
            </div>
            <div class="shares-count">
                <i class="fas fa-share"></i>
                <span>${post.shares}</span>
            </div>
        </div>
        
        <div class="post-actions">
            <button class="action-btn like-btn ${post.liked ? 'liked' : ''}">
                <i class="${post.liked ? 'fas' : 'far'} fa-thumbs-up"></i>
                <span>Like</span>
            </button>
            <button class="action-btn comment-btn">
                <i class="far fa-comment"></i>
                <span>Comment</span>
            </button>
            <button class="action-btn share-btn">
                <i class="fas fa-share"></i>
                <span>Share</span>
            </button>
        </div>
        
        <div class="comments-section" id="comments-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}">
                ${post.commentsList.map(comment => `
                    <div class="comment" data-id="${comment.id}">
                        <div class="comment-avatar">
                            <img src="${comment.avatar}" alt="${comment.author}">
                        </div>
                        <div class="comment-content">
                            <div class="comment-author">${comment.author}</div>
                            <div class="comment-text">${comment.content}</div>
                            <div class="comment-actions">
                                <button class="comment-action like-comment">
                                    <i class="far fa-thumbs-up"></i> ${comment.likes}
                                </button>
                                <button class="comment-action reply-comment">
                                    Reply
                                </button>
                                <span class="comment-date">${comment.date}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="add-comment">
                <div class="comment-avatar">
                    <img src="${currentUser.avatar}" alt="Your Avatar">
                </div>
                <textarea placeholder="Write a comment..." rows="1"></textarea>
                <button class="post-comment-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    postElement.innerHTML = postHTML;
    
    // Add event listeners to this specific post
    addPostEventListeners(postElement, post);
    
    return postElement;
}

// Add event listeners to a post element
function addPostEventListeners(postElement, post) {
    const postId = post.id;
    
    // Like button
    const likeBtn = postElement.querySelector('.like-btn');
    likeBtn.addEventListener('click', function() {
        const isLiked = this.classList.contains('liked');
        const likeIcon = this.querySelector('i');
        const likeCountElement = postElement.querySelector('.likes-count span');
        
        if (isLiked) {
            this.classList.remove('liked');
            likeIcon.className = 'far fa-thumbs-up';
            post.likes--;
        } else {
            this.classList.add('liked');
            likeIcon.className = 'fas fa-thumbs-up';
            post.likes++;
            
            // Add animation
            likeIcon.style.animation = 'likeAnimation 0.5s ease';
            setTimeout(() => {
                likeIcon.style.animation = '';
            }, 500);
        }
        
        likeCountElement.textContent = post.likes;
    });
    
    // Comment button - toggle comments section
    const commentBtn = postElement.querySelector('.comment-btn');
    const commentsSection = postElement.querySelector('.comments-section');
    
    commentBtn.addEventListener('click', function() {
        commentsSection.classList.toggle('show');
        
        // Focus on comment input when opened
        if (commentsSection.classList.contains('show')) {
            const commentInput = commentsSection.querySelector('textarea');
            commentInput.focus();
        }
    });
    
    // Share button
    const shareBtn = postElement.querySelector('.share-btn');
    shareBtn.addEventListener('click', function() {
        post.shares++;
        const shareCountElement = postElement.querySelector('.shares-count span');
        shareCountElement.textContent = post.shares;
        
        // Show share options
        showShareOptions(post);
    });
    
    // Post actions dropdown
    const actionsBtn = postElement.querySelector('.post-actions-btn');
    const dropdownMenu = postElement.querySelector('.post-dropdown-menu');
    
    actionsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
    });
    
    // Dropdown menu items
    const saveBtn = postElement.querySelector('.save-post');
    saveBtn.addEventListener('click', function() {
        alert('Post saved!');
        dropdownMenu.classList.remove('show');
    });
    
    const reportBtn = postElement.querySelector('.report-post');
    reportBtn.addEventListener('click', function() {
        alert('Thank you for reporting. We will review this post.');
        dropdownMenu.classList.remove('show');
    });
    
    const copyLinkBtn = postElement.querySelector('.copy-link');
    copyLinkBtn.addEventListener('click', function() {
        const postUrl = `${window.location.origin}/post.html?id=${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            alert('Link copied to clipboard!');
        });
        dropdownMenu.classList.remove('show');
    });
    
    // Post comment
    const postCommentBtn = postElement.querySelector('.post-comment-btn');
    const commentInput = postElement.querySelector('.add-comment textarea');
    
    postCommentBtn.addEventListener('click', function() {
        addComment(post, commentInput.value);
        commentInput.value = '';
    });
    
    commentInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addComment(post, commentInput.value);
            commentInput.value = '';
        }
    });
    
    // Auto-resize textarea
    commentInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Like comment
    const likeCommentBtns = postElement.querySelectorAll('.like-comment');
    likeCommentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.closest('.comment').dataset.id;
            const comment = post.commentsList.find(c => c.id == commentId);
            
            if (comment) {
                comment.likes++;
                this.innerHTML = `<i class="far fa-thumbs-up"></i> ${comment.likes}`;
            }
        });
    });
    
    // View post details (click on post content)
    const postContent = postElement.querySelector('.post-content');
    postContent.addEventListener('click', function(e) {
        if (!e.target.closest('button') && !e.target.closest('textarea')) {
            showPostDetail(post);
        }
    });
}

// Add a comment to a post
function addComment(post, content) {
    if (!content.trim()) return;
    
    const newComment = {
        id: Date.now(),
        author: currentUser.name,
        avatar: currentUser.avatar,
        content: content,
        date: 'Just now',
        likes: 0
    };
    
    post.commentsList.unshift(newComment);
    post.comments++;
    
    // Update comments count
    const postElement = document.querySelector(`.post-card[data-id="${post.id}"]`);
    if (postElement) {
        const commentsCount = postElement.querySelector('.comments-count span');
        commentsCount.textContent = post.comments;
        
        const commentsList = postElement.querySelector('.comments-list');
        const newCommentElement = createCommentElement(newComment);
        commentsList.insertBefore(newCommentElement, commentsList.firstChild);
    }
}

// Create comment element
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.dataset.id = comment.id;
    
    commentElement.innerHTML = `
        <div class="comment-avatar">
            <img src="${comment.avatar}" alt="${comment.author}">
        </div>
        <div class="comment-content">
            <div class="comment-author">${comment.author}</div>
            <div class="comment-text">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-action like-comment">
                    <i class="far fa-thumbs-up"></i> ${comment.likes}
                </button>
                <button class="comment-action reply-comment">
                    Reply
                </button>
                <span class="comment-date">${comment.date}</span>
            </div>
        </div>
    `;
    
    return commentElement;
}

// Show share options
function showShareOptions(post) {
    const shareUrl = `${window.location.origin}/post.html?id=${post.id}`;
    const shareText = `Check out this post from Girls and Women Foundation Liberia: ${post.content.substring(0, 100)}...`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Girls & Women Foundation Liberia',
            text: shareText,
            url: shareUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Post link copied to clipboard! You can now share it.');
        });
    }
}

// Show post detail in modal
function showPostDetail(post) {
    const postElement = document.querySelector(`.post-card[data-id="${post.id}"]`);
    const clonedPost = postElement.cloneNode(true);
    
    // Remove event listeners from cloned element
    const cleanElement = clonedPost.cloneNode(true);
    
    // Show comments section
    const commentsSection = cleanElement.querySelector('.comments-section');
    commentsSection.classList.add('show');
    
    modalBody.innerHTML = '';
    modalBody.appendChild(cleanElement);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closePostModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Filter posts by category
function filterPosts(category) {
    loadingSpinner.style.display = 'block';
    
    if (category === 'all') {
        currentPosts = [...postsData];
    } else {
        currentPosts = postsData.filter(post => post.category === category);
    }
    
    // Simulate loading delay
    setTimeout(() => {
        loadPosts();
    }, 500);
}

// Search posts
function searchPosts(query) {
    if (!query.trim()) {
        filterPosts(currentFilter);
        return;
    }
    
    loadingSpinner.style.display = 'block';
    
    const searchTerm = query.toLowerCase();
    currentPosts = postsData.filter(post => 
        post.content.toLowerCase().includes(searchTerm) ||
        post.author.name.toLowerCase().includes(searchTerm)
    );
    
    // Simulate loading delay
    setTimeout(() => {
        loadPosts();
    }, 500);
}

// Publish new post
function publishNewPost() {
    const content = newPostContent.value.trim();
    
    if (!content) {
        alert('Please write something to share!');
        return;
    }
    
    const newPost = {
        id: Date.now(),
        author: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: "Foundation Member"
        },
        date: "Just now",
        category: "updates",
        content: content,
        image: "",
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        commentsList: []
    };
    
    // Add to beginning of posts array
    postsData.unshift(newPost);
    currentPosts.unshift(newPost);
    
    // Clear input
    newPostContent.value = '';
    
    // Reload posts
    loadPosts();
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Post published successfully!';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.remove();
    }, 3000);
}

// Initialize event listeners
function initEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter posts
            currentFilter = this.dataset.filter;
            filterPosts(currentFilter);
        });
    });
    
    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchPosts(this.value);
        }, 500);
    });
    
    // Publish post
    publishButton.addEventListener('click', publishNewPost);
    
    // Auto-resize new post textarea
    newPostContent.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Close modal
    closeModal.addEventListener('click', closePostModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePostModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closePostModal();
        }
    });
    
    // Topic tags
    const topicTags = document.querySelectorAll('.topic-tag');
    topicTags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            const tagName = this.dataset.tag;
            searchInput.value = tagName;
            searchPosts(tagName);
        });
    });
    
    // Infinite scroll simulation
    window.addEventListener('scroll', function() {
        if (isLoading) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight - 100;
        
        if (scrollPosition >= pageHeight) {
            // Simulate loading more posts
            isLoading = true;
            loadingSpinner.style.display = 'block';
            
            setTimeout(() => {
                // In a real app, you would fetch more posts from an API
                isLoading = false;
                loadingSpinner.style.display = 'none';
                
                // Show message that there are no more posts
                if (currentPosts.length >= 8) {
                    const endMessage = document.createElement('div');
                    endMessage.className = 'end-message';
                    endMessage.innerHTML = '<p>You\'ve reached the end of the feed!</p>';
                    postsContainer.appendChild(endMessage);
                }
            }, 1500);
        }
    });
}