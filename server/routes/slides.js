// Slides API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');
const { requireAuth } = require('./auth');

// Get all slides (public/admin)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides ORDER BY position ASC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching slides:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get active slides (for homepage hero slider)
router.get('/status/active', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides WHERE status = $1 ORDER BY position ASC',
            ['active']
        );

        // Asynchronously increment views for active slides
        pool.query('UPDATE slides SET views_count = COALESCE(views_count, 0) + 1 WHERE status = $1', ['active'])
            .catch(err => console.error('Error incrementing slide views:', err.message));

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching active slides:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Record slide CTA click
router.post('/:id/click', async (req, res) => {
    try {
        await pool.query(
            'UPDATE slides SET clicks_count = COALESCE(clicks_count, 0) + 1 WHERE id = $1',
            [req.params.id]
        );
        res.json({ success: true, message: 'Click recorded' });
    } catch (error) {
        console.error('Error recording slide click:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get slide by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching slide:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new slide (Protected)
router.post('/', requireAuth, async (req, res) => {
    const {
        title,
        subtitle,
        description,
        position,
        status,
        image_url,
        image,
        button_text,
        button_link,
        text_color,
        overlay_opacity,
        display_duration,
        overlay_enabled,
        button_enabled
    } = req.body;
    
    if (!title || !description || !position) {
        return res.status(400).json({ success: false, error: 'Title, description, and position are required' });
    }

    const finalImage = image_url || image || '';
    
    try {
        const result = await pool.query(
            `INSERT INTO slides (title, subtitle, description, position, status, image_url, button_text, button_link, text_color, overlay_opacity, display_duration, overlay_enabled, button_enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                title,
                subtitle || '',
                description,
                position,
                status || 'active',
                finalImage,
                button_text || 'Learn More',
                button_link || '#about',
                text_color || '#ffffff',
                overlay_opacity !== undefined ? overlay_opacity : 30,
                display_duration || 5,
                overlay_enabled !== false,
                button_enabled !== false
            ]
        );
        
        await logActivity('create', 'slide', result.rows[0].id, `Created slide "${title}"`);

        res.status(201).json({
            success: true,
            message: 'Slide created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating slide:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update slide (Protected)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }
        const old = existing.rows[0];

        const title            = req.body.title            !== undefined ? req.body.title            : old.title;
        const subtitle         = req.body.subtitle         !== undefined ? req.body.subtitle         : old.subtitle;
        const description      = req.body.description      !== undefined ? req.body.description      : old.description;
        const position         = req.body.position         !== undefined ? req.body.position         : old.position;
        const status           = req.body.status           !== undefined ? req.body.status           : old.status;
        const image_url        = req.body.image_url        !== undefined ? req.body.image_url        : (req.body.image !== undefined ? req.body.image : old.image_url);
        const button_text      = req.body.button_text      !== undefined ? req.body.button_text      : old.button_text;
        const button_link      = req.body.button_link      !== undefined ? req.body.button_link      : old.button_link;
        const text_color       = req.body.text_color       !== undefined ? req.body.text_color       : old.text_color;
        const overlay_opacity  = req.body.overlay_opacity  !== undefined ? req.body.overlay_opacity  : old.overlay_opacity;
        const display_duration = req.body.display_duration !== undefined ? req.body.display_duration : old.display_duration;
        const overlay_enabled  = req.body.overlay_enabled  !== undefined ? req.body.overlay_enabled  : old.overlay_enabled;
        const button_enabled   = req.body.button_enabled   !== undefined ? req.body.button_enabled   : old.button_enabled;

        const result = await pool.query(
            `UPDATE slides 
             SET title = $1, subtitle = $2, description = $3, position = $4, status = $5,
                 image_url = $6, button_text = $7, button_link = $8, text_color = $9, overlay_opacity = $10,
                 display_duration = $11, overlay_enabled = $12, button_enabled = $13,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $14
             RETURNING *`,
            [title, subtitle, description, position, status, image_url, button_text, button_link, text_color, overlay_opacity, display_duration, overlay_enabled, button_enabled, req.params.id]
        );
        
        await logActivity('update', 'slide', result.rows[0].id, `Updated slide "${title}"`);

        res.json({
            success: true,
            message: 'Slide updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating slide:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete slide (Protected)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM slides WHERE id = $1 RETURNING id, title',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }

        await logActivity('delete', 'slide', result.rows[0].id, `Deleted slide "${result.rows[0].title}"`);
        
        res.json({
            success: true,
            message: 'Slide deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting slide:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update slide position (Protected)
router.patch('/:id/position', requireAuth, async (req, res) => {
    const { position } = req.body;
    
    if (position === undefined || position < 1 || position > 10) {
        return res.status(400).json({ success: false, error: 'Position must be between 1 and 10' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE slides SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [position, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }
        
        await logActivity('update', 'slide', result.rows[0].id, `Changed slide "${result.rows[0].title}" position to ${position}`);

        res.json({
            success: true,
            message: 'Slide position updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating slide position:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
