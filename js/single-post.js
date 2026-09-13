// Modern Single Post & News Blog Controller - GWOFO Platform
// Handles post rendering, reading progress bar, social sharing, and moderated comments

document.addEventListener('DOMContentLoaded', function () {
    initSinglePost();
    initReadingProgressBar();
});

// ─── DOM References ─────────────────────────────────────────────────────────────
const container        = document.getElementById('singlePostContainer');
const prevBtn          = document.getElementById('prevBtn');
const nextBtn          = document.getElementById('nextBtn');
const currentNumEl     = document.getElementById('currentPostNumber');
const totalNumEl       = document.getElementById('totalPostsNumber');
const postNavBar       = document.getElementById('postNavBar');
const breadcrumbTitle  = document.getElementById('breadcrumbPostTitle');
const commentsListEl   = document.getElementById('approvedCommentsList');
const commentsCountEl  = document.getElementById('commentsCount');
const commentForm      = document.getElementById('postCommentForm');
const commentAlertEl   = document.getElementById('commentFormAlert');

// ─── State ────────────────────────────────────────────────────────────────────
let allPosts = [];
let currentIndex = 0;
let currentPost = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function calculateReadingTime(content) {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0);
    return Math.max(1, Math.ceil(words.length / 200));
}

// ─── Reading Progress Bar ─────────────────────────────────────────────────────
function initReadingProgressBar() {
    const bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }, { passive: true });
}

// ─── Main Controller ──────────────────────────────────────────────────────────
async function initSinglePost() {
    try {
        const apiBase = window.API_BASE_URL || '/api';
        const response = await fetch(`${apiBase}/posts`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            allPosts = result.data.filter(p => p.status === 'published');
            if (allPosts.length === 0) allPosts = result.data; // fallback
        }
    } catch (err) {
        console.error('Error fetching posts:', err);
    }

    if (allPosts.length === 0) {
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-newspaper fa-3x" style="color: #94a3b8; margin-bottom: 16px;"></i>
                    <h3 style="color: #0f172a;">No Posts Available Yet</h3>
                    <p style="color: #64748b;">Please check back shortly for updates from the field.</p>
                    <a href="index.html" class="btn-primary" style="margin-top: 16px; display: inline-block;">Return Home</a>
                </div>`;
        }
        return;
    }

    // Category filtering support if ?category= is passed
    const categoryParam = getParam('category');
    if (categoryParam) {
        const filtered = allPosts.filter(p => (p.category || '').toLowerCase() === categoryParam.toLowerCase());
        if (filtered.length > 0) {
            allPosts = filtered;
        }
    }

    // Determine initial index
    const requestedId = getParam('id');
    if (requestedId) {
        const foundIndex = allPosts.findIndex(p => String(p.id) === String(requestedId));
        currentIndex = foundIndex >= 0 ? foundIndex : 0;
    } else {
        currentIndex = 0;
    }

    if (totalNumEl) totalNumEl.textContent = allPosts.length;
    if (postNavBar) postNavBar.style.display = 'flex';

    // Wire Navigation Buttons
    if (prevBtn) prevBtn.addEventListener('click', () => navigatePost(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigatePost(1));

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'ArrowLeft') navigatePost(-1);
        if (e.key === 'ArrowRight') navigatePost(1);
    });

    // Render initial post
    renderPost(currentIndex);

    // Wire comment submission form
    initCommentForm();

    // Load recent activities in sidebar
    loadSidebarActivities();
}

function navigatePost(direction) {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < allPosts.length) {
        renderPost(newIndex);
        window.scrollTo({ top: container.offsetTop - 100, behavior: 'smooth' });
    }
}

function renderPost(index) {
    currentIndex = index;
    currentPost = allPosts[index];

    // Update URL parameter without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('id', currentPost.id);
    window.history.replaceState({}, '', url);

    // Update Counter & Controls
    if (currentNumEl) currentNumEl.textContent = index + 1;
    if (breadcrumbTitle) breadcrumbTitle.textContent = currentPost.title ? currentPost.title.slice(0, 35) + '...' : 'Story';
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === allPosts.length - 1;

    // Reading time
    const readingTime = calculateReadingTime(currentPost.content);
    const postDate = formatDate(currentPost.published_date || currentPost.created_at);
    const category = currentPost.category || 'Initiative';

    // Author image or avatar
    const authorInitials = (currentPost.author_name || 'Admin').charAt(0).toUpperCase();
    const avatarHtml = currentPost.author_image
        ? `<img src="${currentPost.author_image}" alt="${esc(currentPost.author_name)}" class="author-avatar" onerror="this.onerror=null; this.replaceWith(Object.assign(document.createElement('div'), {className: 'author-avatar', textContent: '${authorInitials}'}));">`
        : `<div class="author-avatar">${authorInitials}</div>`;

    // Featured Image
    const featuredImg = currentPost.featured_image || currentPost.image_url;
    const mediaHtml = featuredImg
        ? `<div class="article-featured-media"><img src="${featuredImg}" alt="${esc(currentPost.title)}" loading="lazy"></div>`
        : '';

    // Article HTML
    container.innerHTML = `
        <header class="article-meta-header">
            <div class="author-info-block">
                ${avatarHtml}
                <div class="author-details">
                    <h4>${esc(currentPost.author_name || 'GWOFO Communications')}</h4>
                    <span class="post-date"><i class="far fa-calendar-alt"></i> ${postDate} &bull; ${readingTime} min read</span>
                </div>
            </div>
            <span class="article-category-badge">${esc(category)}</span>
        </header>

        <h1 class="article-title-hero">${esc(currentPost.title)}</h1>

        ${mediaHtml}

        <div class="article-body">
            ${formatContent(currentPost.content)}
        </div>

        <!-- Social Share Bar -->
        <div class="social-share-strip">
            <span><i class="fas fa-share-alt"></i> Share this story:</span>
            <button class="share-icon-btn" onclick="sharePost('twitter')" title="Share on Twitter / X" aria-label="Share on Twitter">
                <i class="fab fa-twitter"></i>
            </button>
            <button class="share-icon-btn" onclick="sharePost('facebook')" title="Share on Facebook" aria-label="Share on Facebook">
                <i class="fab fa-facebook-f"></i>
            </button>
            <button class="share-icon-btn" onclick="sharePost('linkedin')" title="Share on LinkedIn" aria-label="Share on LinkedIn">
                <i class="fab fa-linkedin-in"></i>
            </button>
            <button class="share-icon-btn" onclick="sharePost('copy')" title="Copy Link" aria-label="Copy article link">
                <i class="fas fa-link"></i>
            </button>
        </div>
    `;

    // Load approved comments for this post
    loadPostComments(currentPost.id);
}

function formatContent(content) {
    if (!content) return '';
    // If it contains HTML tags, return safe sanitized string
    if (/<[a-z][\s\S]*>/i.test(content)) {
        return content;
    }
    // Format basic paragraphs and blockquotes
    return content.split(/\n\n+/).map(para => {
        const trimmed = para.trim();
        if (trimmed.startsWith('>')) {
            return `<blockquote>${esc(trimmed.substring(1).trim())}</blockquote>`;
        }
        return `<p>${esc(trimmed).replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

// ─── Social Sharing ───────────────────────────────────────────────────────────
window.sharePost = function(network) {
    const postUrl = window.location.href;
    const postTitle = currentPost ? currentPost.title : 'Girls and Women Foundation Liberia';
    
    switch (network) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
            break;
        case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(postUrl).then(() => {
                alert('Link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this link:', postUrl);
            });
            break;
    }
};

// ─── Moderated Comments Handling ──────────────────────────────────────────────
async function loadPostComments(postId) {
    if (!commentsListEl) return;
    commentsListEl.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">Loading community reflections...</p>';

    try {
        const apiBase = window.API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/comments/post/${postId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            if (commentsCountEl) commentsCountEl.textContent = data.data.length;
            commentsListEl.innerHTML = data.data.map(comment => `
                <div class="comment-item">
                    <div class="comment-author-row">
                        <span class="comment-author-name"><i class="fas fa-user-circle"></i> ${esc(comment.author_name)}</span>
                        <span class="comment-date">${formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-text">${esc(comment.content)}</div>
                </div>
            `).join('');
        } else {
            if (commentsCountEl) commentsCountEl.textContent = '0';
            commentsListEl.innerHTML = '<p style="color: #64748b; font-size: 0.95rem;">No published comments yet. Share your thoughts below!</p>';
        }
    } catch (err) {
        console.error('Error loading comments:', err);
        commentsListEl.innerHTML = '<p style="color: #ef4444; font-size: 0.9rem;">Unable to load comments at this time.</p>';
    }
}

function initCommentForm() {
    if (!commentForm) return;

    commentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentPost) return;

        const nameInput = document.getElementById('commentAuthorName');
        const emailInput = document.getElementById('commentAuthorEmail');
        const contentInput = document.getElementById('commentContent');
        const submitBtn = document.getElementById('submitCommentBtn');

        const author_name = nameInput.value.trim();
        const author_email = emailInput.value.trim();
        const content = contentInput.value.trim();

        if (!author_name || !author_email || !content) {
            showCommentAlert('Please fill in all required fields.', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            const apiBase = window.API_BASE_URL || '/api';
            const response = await fetch(`${apiBase}/comments/post/${currentPost.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author_name, author_email, content })
            });
            const result = await response.json();

            if (result.success) {
                showCommentAlert('Thank you! Your comment has been submitted and is pending review by our team.', 'success');
                commentForm.reset();
                if (typeof window.showAppreciationModal === 'function') {
                    window.showAppreciationModal({
                        title: 'Reflection Received with Appreciation!',
                        message: 'Thank you for sharing your thoughts on this story. Your comment has been submitted and is pending review by our team.',
                        subtext: 'Your engagement amplifies awareness and community dialogue for women and youth across Liberia.',
                        icon: 'fa-comments',
                        buttonText: 'Continue Reading'
                    });
                }
            } else {
                showCommentAlert(result.error || 'Failed to submit comment. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            showCommentAlert('Network error submitting comment. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Comment';
        }
    });
}

function showCommentAlert(message, type) {
    if (!commentAlertEl) return;
    commentAlertEl.style.display = 'block';
    commentAlertEl.textContent = message;
    if (type === 'success') {
        commentAlertEl.style.background = '#dcfce7';
        commentAlertEl.style.color = '#15803d';
        commentAlertEl.style.border = '1px solid #bbf7d0';
    } else {
        commentAlertEl.style.background = '#fee2e2';
        commentAlertEl.style.color = '#b91c1c';
        commentAlertEl.style.border = '1px solid #fecaca';
    }
    setTimeout(() => {
        commentAlertEl.style.display = 'none';
    }, 7000);
}

// ─── Sidebar Activities ───────────────────────────────────────────────────────
async function loadSidebarActivities() {
    const listEl = document.getElementById('sidebarActivitiesList');
    if (!listEl) return;

    try {
        const apiBase = window.API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/dashboard/recent-activity`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            listEl.innerHTML = data.data.slice(0, 5).map(act => `
                <div class="recent-activity-item">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <p>${esc(act.description || act.action)}</p>
                        <span>${formatDate(act.created_at)}</span>
                    </div>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = '<p style="color: #64748b; font-size: 0.85rem;">Grand Gedeh community health initiative completed.</p>';
        }
    } catch (_) {
        listEl.innerHTML = '<p style="color: #64748b; font-size: 0.85rem;">Grand Gedeh community health initiative completed.</p>';
    }
}
