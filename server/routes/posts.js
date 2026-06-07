// Posts API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all posts
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get post by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new post
router.post('/', async (req, res) => {
    const { title, excerpt, content, category, author_name, status, tags, published_date, featured_image, author_image } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    
    try {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const result = await pool.query(
            `INSERT INTO posts (title, slug, excerpt, content, category, author_name, status, tags, published_date, featured_image, author_image)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [title, slug, excerpt, content, category, author_name, status || 'draft', tags, published_date || new Date(), featured_image || null, author_image || null]
        );
        
        await logActivity('create', 'post', result.rows[0].id, `Created post "${title}"`);
        
        // Notify active subscribers (safeguarded against missing files)
        try {
            const { notifySubscribers } = require('../utils/notifier');
            notifySubscribers('post', result.rows[0].id, title).catch(err => {
                console.error('Notification error:', err);
            });
        } catch (notifierErr) {
            console.warn('[Notifier Warning] Could not load notifier module (ensure server/utils/notifier.js is committed):', notifierErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update post (partial-safe – merges with existing record)
router.put('/:id', async (req, res) => {
    try {
        // Fetch existing record first
        const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const old = existing.rows[0];

        // Merge: use request value if provided, otherwise keep existing
        const title          = req.body.title          !== undefined ? req.body.title          : old.title;
        const excerpt        = req.body.excerpt        !== undefined ? req.body.excerpt        : old.excerpt;
        const content        = req.body.content        !== undefined ? req.body.content        : old.content;
        const category       = req.body.category       !== undefined ? req.body.category       : old.category;
        const author_name    = req.body.author_name    !== undefined ? req.body.author_name    : old.author_name;
        const status         = req.body.status         !== undefined ? req.body.status         : old.status;
        const tags           = req.body.tags           !== undefined ? req.body.tags           : old.tags;
        const featured_image = req.body.featured_image !== undefined ? req.body.featured_image : old.featured_image;
        const author_image   = req.body.author_image   !== undefined ? req.body.author_image   : old.author_image;

        const result = await pool.query(
            `UPDATE posts 
             SET title = $1, excerpt = $2, content = $3, category = $4, 
                 author_name = $5, status = $6, tags = $7, featured_image = $8,
                 author_image = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10
             RETURNING *`,
            [title, excerpt, content, category, author_name, status, tags, featured_image, author_image, req.params.id]
        );

        await logActivity('update', 'post', result.rows[0].id, `Updated post "${title}"`);

        res.json({
            success: true,
            message: 'Post updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete post
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 RETURNING id, title',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await logActivity('delete', 'post', result.rows[0].id, `Deleted post "${result.rows[0].title}"`);
        
        res.json({
            success: true,
            message: 'Post deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get posts by category
router.get('/category/:category', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM posts WHERE category = $1 ORDER BY created_at DESC',
            [req.params.category]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching posts by category:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get posts by status
router.get('/status/:status', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM posts WHERE status = $1 ORDER BY created_at DESC',
            [req.params.status]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching posts by status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get recent posts (for dashboard)
router.get('/recent/:limit', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 5;
        const result = await pool.query(
            'SELECT id, title, author_name, published_date, status FROM posts ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent posts:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
