// Comments API Routes – Project and Post Comments with Moderation
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('./auth');
const { logActivity } = require('../utils/logger');

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

// Get approved comments for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        let projectId = parseInt(req.params.projectId, 10);
        let exists = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
        if (exists.rows.length === 0) {
            const allProjects = await pool.query('SELECT id FROM projects ORDER BY id ASC');
            if (projectId > 0 && projectId <= allProjects.rows.length) {
                projectId = allProjects.rows[projectId - 1].id;
            } else if (allProjects.rows.length > 0) {
                projectId = allProjects.rows[0].id;
            }
        }

        const result = await pool.query(
            `SELECT id, project_id, author_name, content, created_at 
             FROM project_comments 
             WHERE project_id = $1 AND status = 'approved' 
             ORDER BY created_at DESC`,
            [projectId]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching project comments:', error);
        res.status(500).json({ success: false, error: 'Failed to load comments' });
    }
});

// Post a comment on a project (default: pending moderation)
router.post('/project/:projectId', async (req, res) => {
    const { author_name, author_email, content } = req.body;
    let projectId = parseInt(req.params.projectId, 10);

    if (!author_name || !author_email || !content) {
        return res.status(400).json({ success: false, error: 'Name, email, and comment are required' });
    }

    if (!author_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    try {
        // Check if project exists by ID or index
        let projectCheck = await pool.query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
        if (projectCheck.rows.length === 0) {
            const allProjects = await pool.query('SELECT id, name FROM projects ORDER BY id ASC');
            if (projectId > 0 && projectId <= allProjects.rows.length) {
                const targetProject = allProjects.rows[projectId - 1];
                projectId = targetProject.id;
                projectCheck = { rows: [targetProject] };
            } else if (allProjects.rows.length > 0) {
                const targetProject = allProjects.rows[0];
                projectId = targetProject.id;
                projectCheck = { rows: [targetProject] };
            } else {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }
        }

        const result = await pool.query(
            `INSERT INTO project_comments (project_id, author_name, author_email, content, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING id, project_id, author_name, status, created_at`,
            [projectId, author_name.trim(), author_email.trim().toLowerCase(), content.trim()]
        );

        await logActivity('create', 'project_comment', result.rows[0].id, `New comment pending review on project "${projectCheck.rows[0].name}"`);

        res.status(201).json({
            success: true,
            message: 'Thank you! Your reflection has been submitted and is pending review by our team.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting project comment:', error);
        res.status(500).json({ success: false, error: 'Failed to submit comment' });
    }
});

// Get approved comments for a blog post
router.get('/post/:postId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, post_id, author_name, content, created_at 
             FROM post_comments 
             WHERE post_id = $1 AND status = 'approved' 
             ORDER BY created_at DESC`,
            [req.params.postId]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching post comments:', error);
        res.status(500).json({ success: false, error: 'Failed to load comments' });
    }
});

// Post a comment on a blog post (default: pending moderation)
router.post('/post/:postId', async (req, res) => {
    const { author_name, author_email, content } = req.body;
    const postId = parseInt(req.params.postId, 10);

    if (!author_name || !author_email || !content) {
        return res.status(400).json({ success: false, error: 'Name, email, and comment are required' });
    }

    if (!author_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    try {
        const postCheck = await pool.query('SELECT id, title FROM posts WHERE id = $1', [postId]);
        if (postCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        const result = await pool.query(
            `INSERT INTO post_comments (post_id, author_name, author_email, content, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING id, post_id, author_name, status, created_at`,
            [postId, author_name.trim(), author_email.trim().toLowerCase(), content.trim()]
        );

        await logActivity('create', 'post_comment', result.rows[0].id, `New comment pending review on post "${postCheck.rows[0].title}"`);

        res.status(201).json({
            success: true,
            message: 'Thank you! Your comment has been submitted and is pending moderation.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting post comment:', error);
        res.status(500).json({ success: false, error: 'Failed to submit comment' });
    }
});

// ─── ADMIN ENDPOINTS (Protected with requireAuth) ──────────────────────────────

// Get all comments (both project and post) with status and type filter
router.get('/admin/all', requireAuth, async (req, res) => {
    try {
        const { status, type } = req.query;
        let projectQuery = `
            SELECT pc.id, 'project' as type, pc.project_id as target_id, p.name as target_title,
                   pc.author_name, pc.author_email, pc.content, pc.status, pc.created_at
            FROM project_comments pc
            LEFT JOIN projects p ON pc.project_id = p.id
        `;
        let postQuery = `
            SELECT pc.id, 'post' as type, pc.post_id as target_id, p.title as target_title,
                   pc.author_name, pc.author_email, pc.content, pc.status, pc.created_at
            FROM post_comments pc
            LEFT JOIN posts p ON pc.post_id = p.id
        `;

        let rows = [];
        if (!type || type === 'all' || type === 'project') {
            let q = projectQuery;
            let params = [];
            if (status && status !== 'all') {
                q += ' WHERE pc.status = $1';
                params.push(status);
            }
            const resProj = await pool.query(q, params);
            rows.push(...resProj.rows);
        }

        if (!type || type === 'all' || type === 'post') {
            let q = postQuery;
            let params = [];
            if (status && status !== 'all') {
                q += ' WHERE pc.status = $1';
                params.push(status);
            }
            const resPost = await pool.query(q, params);
            rows.push(...resPost.rows);
        }

        // Sort descending by created_at
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Get pending count for badges
        const pendingRes = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM project_comments WHERE status = 'pending') +
                (SELECT COUNT(*) FROM post_comments WHERE status = 'pending') as total_pending
        `);

        res.json({
            success: true,
            data: rows,
            count: rows.length,
            pendingCount: parseInt(pendingRes.rows[0].total_pending, 10) || 0
        });
    } catch (error) {
        console.error('Error fetching admin comments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update comment status (approve, reject, pending)
router.patch('/admin/:type/:id/status', requireAuth, async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be pending, approved, or rejected' });
    }

    try {
        const table = type === 'post' ? 'post_comments' : 'project_comments';
        const result = await pool.query(
            `UPDATE ${table} 
             SET status = $1, approved_date = ${status === 'approved' ? 'CURRENT_TIMESTAMP' : 'NULL'}, 
                 approved_by = ${status === 'approved' ? '$2' : 'NULL'}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            status === 'approved' ? [status, req.user.id, id] : [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        await logActivity('update', `${type}_comment`, id, `Changed comment #${id} status to ${status}`, req.user.id);

        res.json({
            success: true,
            message: `Comment status updated to ${status}`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating comment status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete comment
router.delete('/admin/:type/:id', requireAuth, async (req, res) => {
    const { type, id } = req.params;
    try {
        const table = type === 'post' ? 'post_comments' : 'project_comments';
        const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        await logActivity('delete', `${type}_comment`, id, `Deleted comment #${id}`, req.user.id);

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
