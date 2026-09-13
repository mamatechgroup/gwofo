// Project Comments Controller - GWOFO Platform
// Handles comment submission, pending moderation notifications, approved reflections rendering, and appreciation modal

(function() {
    function init() {
        initAllProjectCommentSections();
        hookProjectSidebar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function initAllProjectCommentSections() {
        const projectDetails = document.querySelectorAll('.project-detail');
        if (projectDetails.length === 0) {
            // Check if there's an isolated comment form
            const fallbackForm = document.getElementById('project1CommentForm');
            if (fallbackForm) {
                bindCommentForm(1, fallbackForm);
                loadApprovedProjectComments(1);
            }
            return;
        }

        projectDetails.forEach((detail, index) => {
            const rawId = detail.id || '';
            const match = rawId.match(/\d+/);
            const numId = match ? parseInt(match[0], 10) : (index + 1);

            // Ensure comment section exists in each project detail
            let section = detail.querySelector('.comment-section');
            if (!section) {
                section = document.createElement('div');
                section.className = 'comment-section';
                section.innerHTML = `
                    <div class="comment-header">
                        <h3>Project Comments &amp; Support</h3>
                        <p>Join the conversation and share your thoughts for this initiative</p>
                    </div>
                    <div id="project${numId}ApprovedComments" class="approved-comments-list"></div>
                    <div class="comment-form">
                        <h4>Leave a Comment</h4>
                        <form id="project${numId}CommentForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <input type="text" id="project${numId}Name" placeholder="Your Name" required>
                                </div>
                                <div class="form-group">
                                    <input type="email" id="project${numId}Email" placeholder="Your Email" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <textarea id="project${numId}Comment" placeholder="Your Comment or Reflection" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="btn-primary">Post Comment</button>
                        </form>
                        <div id="project${numId}Message" class="form-message hidden"></div>
                    </div>
                `;
                detail.appendChild(section);
            } else {
                // Check if approved comments container exists
                let approvedContainer = section.querySelector('.approved-comments-list');
                if (!approvedContainer) {
                    approvedContainer = document.createElement('div');
                    approvedContainer.id = `project${numId}ApprovedComments`;
                    approvedContainer.className = 'approved-comments-list';
                    const formBox = section.querySelector('.comment-form');
                    if (formBox) {
                        section.insertBefore(approvedContainer, formBox);
                    } else {
                        section.appendChild(approvedContainer);
                    }
                }
            }

            const form = detail.querySelector(`#project${numId}CommentForm`) || detail.querySelector('form');
            if (form) {
                bindCommentForm(numId, form);
            }

            // Load approved comments for this project
            loadApprovedProjectComments(numId);
        });
    }

    function hookProjectSidebar() {
        const sidebarLinks = document.querySelectorAll('.projects-list .project-item');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                const href = this.getAttribute('href') || '';
                const match = href.match(/\d+/);
                if (match) {
                    const numId = parseInt(match[0], 10);
                    setTimeout(() => {
                        loadApprovedProjectComments(numId);
                    }, 50);
                }
            });
        });
    }

    function bindCommentForm(projectId, form) {
        if (!form || form.dataset.bound) return;
        form.dataset.bound = 'true';

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nameInput = form.querySelector(`input[type="text"]`) || document.getElementById(`project${projectId}Name`);
            const emailInput = form.querySelector(`input[type="email"]`) || document.getElementById(`project${projectId}Email`);
            const commentInput = form.querySelector('textarea') || document.getElementById(`project${projectId}Comment`);
            const messageDiv = form.parentElement.querySelector('.form-message') || document.getElementById(`project${projectId}Message`);
            const submitBtn = form.querySelector('button[type="submit"]');

            const author_name = nameInput ? nameInput.value.trim() : '';
            const author_email = emailInput ? emailInput.value.trim() : '';
            const content = commentInput ? commentInput.value.trim() : '';

            if (!author_name || !author_email || !content) {
                displayFormMessage(messageDiv, 'Please fill in all required fields.', 'error');
                return;
            }

            const origBtnHtml = submitBtn ? submitBtn.innerHTML : 'Post Comment';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }

            try {
                const apiBase = window.API_BASE_URL || '/api';
                const response = await fetch(`${apiBase}/comments/project/${projectId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ author_name, author_email, content })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    form.reset();
                    displayFormMessage(
                        messageDiv,
                        'Thank you! Your reflection has been submitted and is pending review by our team.',
                        'success'
                    );

                    // Show Appreciation Popup Card
                    if (typeof window.showAppreciationModal === 'function') {
                        window.showAppreciationModal({
                            title: 'Thank You for Your Voice & Support!',
                            message: 'Your comment has been submitted and received by the GWOFO team. It will appear on the project showcase once approved by our moderators.',
                            subtext: 'Your engagement strengthens grassroots advocacy for women and youth in Liberia.',
                            icon: 'fa-heart',
                            buttonText: 'Continue Exploring'
                        });
                    }
                } else {
                    displayFormMessage(
                        messageDiv,
                        result.error || result.message || 'Unable to submit comment. Please try again.',
                        'error'
                    );
                }
            } catch (err) {
                console.error('Error posting project comment:', err);
                displayFormMessage(messageDiv, 'Network error. Please check your connection and try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnHtml;
                }
            }
        });
    }

    async function loadApprovedProjectComments(projectId) {
        const container = document.getElementById(`project${projectId}ApprovedComments`);
        if (!container) return;

        try {
            const apiBase = window.API_BASE_URL || '/api';
            const response = await fetch(`${apiBase}/comments/project/${projectId}`);
            const result = await response.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                container.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-size: 1.15rem; color: #003366; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-comments"></i> Community Reflections (${result.data.length})
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${result.data.map(comment => `
                                <div class="comment-item" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; transition: all 0.2s ease;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                                            <i class="fas fa-user-circle" style="color: #003366;"></i> ${escapeHtml(comment.author_name)}
                                        </span>
                                        <small style="color: #94a3b8; font-size: 0.85rem;">${formatCommentDate(comment.created_at)}</small>
                                    </div>
                                    <p style="margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.55;">${escapeHtml(comment.content)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="padding: 14px 18px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; margin-bottom: 18px; text-align: center;">
                        <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
                            <i class="fas fa-comment-dots" style="margin-right: 6px; color: #94a3b8;"></i>
                            Be the first to share your encouragement or reflection on this program!
                        </p>
                    </div>
                `;
            }
        } catch (err) {
            console.error(`Error loading comments for project ${projectId}:`, err);
        }
    }

    function displayFormMessage(el, text, type) {
        if (!el) return;
        el.classList.remove('hidden', 'loading', 'success', 'error');
        el.style.display = 'block';
        el.textContent = text;
        if (type === 'success') {
            el.style.background = '#dcfce7';
            el.style.color = '#166534';
            el.style.border = '1px solid #bbf7d0';
            el.style.padding = '12px 16px';
            el.style.borderRadius = '8px';
            el.style.marginTop = '14px';
        } else {
            el.style.background = '#fee2e2';
            el.style.color = '#991b1b';
            el.style.border = '1px solid #fecaca';
            el.style.padding = '12px 16px';
            el.style.borderRadius = '8px';
            el.style.marginTop = '14px';
        }
    }

    function formatCommentDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
})();

