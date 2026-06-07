// Single Post Display – clean, comment-free, navigation by ?id= URL param

document.addEventListener('DOMContentLoaded', function () {
    loadAndDisplay();
});

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const container        = document.getElementById('singlePostContainer');
const loadingSpinner   = document.getElementById('loadingSpinner');
const prevBtn          = document.getElementById('prevBtn');
const nextBtn          = document.getElementById('nextBtn');
const currentNumEl     = document.getElementById('currentPostNumber');
const totalNumEl       = document.getElementById('totalPostsNumber');
const noPostsMsg       = document.getElementById('noPostsMessage');
const navSection       = document.querySelector('.post-navigation');  // wrapper around prev/next

// ─── State ────────────────────────────────────────────────────────────────────
let allPosts      = [];  // all published posts from API
let currentIndex  = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIdFromURL() {
    return new URLSearchParams(window.location.search).get('id');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 1) return 'Just now';
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Main Load ────────────────────────────────────────────────────────────────

async function loadAndDisplay() {
    // Show spinner while fetching
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (container)     container.innerHTML = '';
    if (noPostsMsg)    noPostsMsg.classList.add('hidden');
    if (navSection)    navSection.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/posts');
        const result   = await response.json();

        if (result.success && Array.isArray(result.data)) {
            // Only show published posts
            allPosts = result.data.filter(p => p.status === 'published');
        }
    } catch (err) {
        console.error('Error fetching posts:', err);
    }

    // Always hide spinner after fetch attempt
    if (loadingSpinner) loadingSpinner.classList.add('hidden');

    if (allPosts.length === 0) {
        showNoPosts();
        return;
    }

    // Determine starting index from URL ?id= param
    const requestedId = getIdFromURL();
    if (requestedId) {
        const idx = allPosts.findIndex(p => String(p.id) === String(requestedId));
        currentIndex = idx >= 0 ? idx : 0;
    } else {
        currentIndex = 0;
    }

    // Update total and show nav
    if (totalNumEl) totalNumEl.textContent = allPosts.length;
    if (navSection) navSection.style.display = '';

    // Wire navigation
    if (prevBtn) prevBtn.addEventListener('click', showPrev);
    if (nextBtn) nextBtn.addEventListener('click', showNext);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  showPrev();
        if (e.key === 'ArrowRight') showNext();
    });

    displayPost(currentIndex);

    // Load sidebar activities asynchronously
    loadSidebarActivities();
}

// ─── Display Post ─────────────────────────────────────────────────────────────

function displayPost(index) {
    if (index < 0 || index >= allPosts.length) return;
    currentIndex = index;

    const post = allPosts[index];

    // Update URL without reload so back/forward works
    const url = new URL(window.location.href);
    url.searchParams.set('id', post.id);
    window.history.replaceState({}, '', url);

    // Update counter
    if (currentNumEl) currentNumEl.textContent = index + 1;

    // Build post HTML
    if (container) container.innerHTML = buildPostHTML(post);

    // Wire up dropdown actions inside the rendered post
    wirePostActions(post);

    updateNavButtons();
}

// ─── Formatting & Reading Time Helpers ────────────────────────────────────────

function formatInlineMarkdown(text) {
    if (!text) return '';
    // Bold: **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (excluding already formatted strong tags or empty)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code: `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    return formatted;
}

function formatPostContent(content) {
    if (!content) return '';

    // Check if it contains HTML tags
    const containsHTML = /<[a-z][\s\S]*>/i.test(content);
    if (containsHTML) {
        return content;
    }

    // Escape basic characters to prevent XSS but keep formatting we add
    let parsed = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Restore blockquote symbol since we escaped it
    parsed = parsed.replace(/^&gt;\s+/gm, '> ');

    const lines = parsed.split(/\r?\n/);
    const blocks = [];
    let currentBlock = [];
    let currentBlockType = null; // 'p', 'ul', 'blockquote', null

    function closeCurrentBlock() {
        if (currentBlock.length === 0) return;
        const blockText = currentBlock.join('\n');
        if (currentBlockType === 'p') {
            const inlineFormatted = formatInlineMarkdown(blockText);
            const withNewlines = inlineFormatted.replace(/\n/g, '<br>');
            blocks.push(`<p>${withNewlines}</p>`);
        } else if (currentBlockType === 'ul') {
            const listItems = currentBlock.map(line => {
                const text = line.trim().substring(2);
                return `<li>${formatInlineMarkdown(text)}</li>`;
            }).join('');
            blocks.push(`<ul>${listItems}</ul>`);
        } else if (currentBlockType === 'blockquote') {
            const cleanLines = currentBlock.map(line => line.substring(2)).join('\n');
            blocks.push(`<blockquote>${formatInlineMarkdown(cleanLines)}</blockquote>`);
        }
        currentBlock = [];
        currentBlockType = null;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Empty line separates blocks
        if (trimmed === '') {
            closeCurrentBlock();
            continue;
        }

        // Headings are always single-line blocks
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
            closeCurrentBlock();
            if (trimmed.startsWith('### ')) {
                blocks.push(`<h3>${formatInlineMarkdown(trimmed.substring(4))}</h3>`);
            } else if (trimmed.startsWith('## ')) {
                blocks.push(`<h2>${formatInlineMarkdown(trimmed.substring(3))}</h2>`);
            } else if (trimmed.startsWith('# ')) {
                blocks.push(`<h1>${formatInlineMarkdown(trimmed.substring(2))}</h1>`);
            }
            continue;
        }

        // Check for blockquote line
        if (line.startsWith('> ')) {
            if (currentBlockType !== 'blockquote') {
                closeCurrentBlock();
                currentBlockType = 'blockquote';
            }
            currentBlock.push(line);
            continue;
        }

        // Check for list item line
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (currentBlockType !== 'ul') {
                closeCurrentBlock();
                currentBlockType = 'ul';
            }
            currentBlock.push(line);
            continue;
        }

        // Standard paragraph line
        if (currentBlockType !== 'p') {
            closeCurrentBlock();
            currentBlockType = 'p';
        }
        currentBlock.push(line);
    }

    // Close any remaining open block
    closeCurrentBlock();

    return blocks.join('\n');
}

function calculateReadingTime(content) {
    if (!content) return 1;
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, ' ')
                             .replace(/[#*`>_\-]/g, ' '); // Strip markdown symbols
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
    return Math.max(1, Math.ceil(words.length / 200));
}

function buildPostHTML(post) {
    const catNames = { news: 'News', updates: 'Update', stories: 'Success Story', events: 'Event' };
    const catLabel = catNames[post.category] || (post.category || 'Post');

    // Author avatar: use stored author_image, else render a gradient initials badge
    const initials = (post.author_name || 'A').charAt(0).toUpperCase();
    const avatarHtml = post.author_image
        ? `<img src="${post.author_image}" alt="${esc(post.author_name || 'Author')}" class="author-avatar-img">`
        : `<div class="author-avatar-placeholder">${initials}</div>`;

    const readingTime = calculateReadingTime(post.content);
    const contentStr = post.content || '';
    const formattedFull = formatPostContent(contentStr);
    let bodyHtml = '';

    if (contentStr.length <= 300) {
        bodyHtml = `<div class="article-body-text">${formattedFull}</div>`;
    } else {
        const truncatedText = contentStr.substring(0, 300) + '...';
        const formattedPreview = formatPostContent(truncatedText);
        bodyHtml = `
            <div class="article-body-text">
                <div id="postBodyPreview">${formattedPreview}</div>
                <div id="postBodyFull" style="display: none;">${formattedFull}</div>
                <button id="toggleContentBtn" class="read-more-btn">
                    Read More <i class="fas fa-chevron-down"></i>
                </button>
            </div>`;
    }

    return `
        <div class="modern-article" data-id="${post.id}" data-category="${esc(post.category)}">
            <div class="article-author-header">
                <div class="author-avatar-container">
                    ${avatarHtml}
                </div>
                <div class="author-metadata-container">
                    <div class="author-name-row">
                        <span class="author-name">${esc(post.author_name || 'Admin')}</span>
                        <span class="author-role-badge">Author</span>
                    </div>
                    <div class="article-meta-row">
                        <span>Published: ${formatDate(post.published_date || post.created_at)}</span>
                        <span class="meta-dot">•</span>
                        <span class="article-category-tag">${catLabel}</span>
                        <span class="meta-dot">•</span>
                        <span>${readingTime} min read</span>
                    </div>
                </div>
                <div class="post-actions-dropdown">
                    <button class="post-actions-btn" aria-label="Post options">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div class="post-dropdown-menu" id="postDropdown">
                        <button class="copy-link">
                            <i class="fas fa-link"></i> Copy Link
                        </button>
                        <button class="share-post">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                </div>
            </div>

            <div class="article-main-content">
                ${post.title ? `<h1 class="article-title">${esc(post.title)}</h1>` : ''}
                ${post.featured_image || post.image_url ? `
                    <div class="article-featured-image">
                        <img src="${post.featured_image || post.image_url}" alt="${esc(post.title || 'Post image')}" loading="lazy">
                    </div>` : ''}
                ${bodyHtml}
            </div>
        </div>`;
}

function wirePostActions(post) {
    if (!container) return;

    // Dropdown toggle
    const actionsBtn  = container.querySelector('.post-actions-btn');
    const dropdownMenu = container.querySelector('.post-dropdown-menu');
    if (actionsBtn && dropdownMenu) {
        actionsBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', function () {
            dropdownMenu.classList.remove('show');
        }, { once: false });
    }

    // Copy link
    const copyBtn = container.querySelector('.copy-link');
    if (copyBtn) copyBtn.addEventListener('click', function () {
        const url = `${window.location.origin}/single.html?id=${post.id}`;
        navigator.clipboard?.writeText(url).then(() => {
            showToast('Link copied to clipboard!');
        }).catch(() => {
            prompt('Copy this link:', url);
        });
        dropdownMenu?.classList.remove('show');
    });

    // Share
    const shareBtn = container.querySelector('.share-post');
    if (shareBtn) shareBtn.addEventListener('click', function () {
        const url  = `${window.location.origin}/single.html?id=${post.id}`;
        const text = `Check out: ${post.title || 'this post'} — Girls & Women Foundation Liberia`;

        if (navigator.share) {
            navigator.share({ title: post.title || 'Post', text, url })
                .catch(() => {});
        } else {
            navigator.clipboard?.writeText(url).then(() => showToast('Link copied!'));
        }
        dropdownMenu?.classList.remove('show');
    });

    // Read More / Read Less Toggle
    const toggleBtn = container.querySelector('#toggleContentBtn');
    const previewDiv = container.querySelector('#postBodyPreview');
    const fullDiv = container.querySelector('#postBodyFull');
    if (toggleBtn && previewDiv && fullDiv) {
        toggleBtn.addEventListener('click', function () {
            const isExpanded = fullDiv.style.display !== 'none';
            if (isExpanded) {
                fullDiv.style.display = 'none';
                previewDiv.style.display = 'block';
                toggleBtn.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
                toggleBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                fullDiv.style.display = 'block';
                previewDiv.style.display = 'none';
                toggleBtn.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
            }
        });
    }
}

function showPrev() {
    if (currentIndex > 0) displayPost(currentIndex - 1);
}

function showNext() {
    if (currentIndex < allPosts.length - 1) displayPost(currentIndex + 1);
}

function updateNavButtons() {
    if (prevBtn) {
        if (currentIndex === 0) {
            prevBtn.style.visibility = 'hidden';
            prevBtn.disabled = true;
        } else {
            prevBtn.style.visibility = 'visible';
            prevBtn.disabled = false;
        }
    }
    if (nextBtn) {
        if (currentIndex === allPosts.length - 1) {
            nextBtn.style.visibility = 'hidden';
            nextBtn.disabled = true;
        } else {
            nextBtn.style.visibility = 'visible';
            nextBtn.disabled = false;
        }
    }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function showNoPosts() {
    if (noPostsMsg) noPostsMsg.classList.remove('hidden');
    if (container)  container.innerHTML = '';
    if (navSection) navSection.style.display = 'none';
    if (prevBtn)    prevBtn.disabled = true;
    if (nextBtn)    nextBtn.disabled = true;
}

// ─── Toast Helper ─────────────────────────────────────────────────────────────

function showToast(message) {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:#1e1e2e;color:#fff;padding:10px 22px;border-radius:8px;
        font-size:.9em;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.3);`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
}

// ─── Sidebar Activities ───────────────────────────────────────────────────────

async function loadSidebarActivities() {
    const list = document.getElementById('sidebarActivities');
    if (!list) return;

    try {
        const response = await fetch('http://localhost:3000/api/dashboard/recent-activity');
        const result   = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            list.innerHTML = result.data.slice(0, 5).map(act => {
                let icon = 'fa-info-circle';
                if (act.action === 'create') icon = 'fa-plus-circle';
                else if (act.action === 'update') icon = 'fa-edit';
                else if (act.action === 'delete') icon = 'fa-trash-alt';

                const timeAgo = formatDate(act.created_at);
                const desc    = act.description || (act.action + ' ' + (act.entity_type || '').replace('_', ' '));
                return `
                    <div class="activity-item">
                        <div class="activity-icon"><i class="fas ${icon}"></i></div>
                        <div class="activity-content">
                            <p>${esc(desc)}</p>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                    </div>`;
            }).join('');
        } else {
            list.innerHTML = '<p style="padding:12px;color:#6b7280;font-size:.85em;">No recent activity logged yet.</p>';
        }
    } catch (err) {
        console.error('Error loading sidebar activities:', err);
        list.innerHTML = '<p style="padding:12px;color:#6b7280;font-size:.85em;">Could not load activities.</p>';
    }
}
