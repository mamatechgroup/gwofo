// Slides API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all slides
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
        res.status(500).json({ error: error.message });
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
            return res.status(404).json({ error: 'Slide not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching slide:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new slide
router.post('/', async (req, res) => {
    const { title, subtitle, description, position, status, button_text, button_link, text_color, overlay_opacity, display_duration, overlay_enabled, button_enabled } = req.body;
    
    if (!title || !description || !position) {
        return res.status(400).json({ error: 'Title, description, and position are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO slides (title, subtitle, description, position, status, button_text, button_link, text_color, overlay_opacity, display_duration, overlay_enabled, button_enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [title, subtitle, description, position, status || 'active', button_text, button_link, text_color || '#ffffff', overlay_opacity || 30, display_duration || 5, overlay_enabled !== false, button_enabled !== false]
        );
        
        await logActivity('create', 'slide', result.rows[0].id, `Created slide "${title}"`);

        res.status(201).json({
            success: true,
            message: 'Slide created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating slide:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update slide (partial-safe – merges with existing record)
router.put('/:id', async (req, res) => {
    try {
        // Fetch existing record first
        const existing = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Slide not found' });
        }
        const old = existing.rows[0];

        // Merge: use request value if provided, otherwise keep existing
        const title            = req.body.title            !== undefined ? req.body.title            : old.title;
        const subtitle         = req.body.subtitle         !== undefined ? req.body.subtitle         : old.subtitle;
        const description      = req.body.description      !== undefined ? req.body.description      : old.description;
        const position         = req.body.position         !== undefined ? req.body.position         : old.position;
        const status           = req.body.status           !== undefined ? req.body.status           : old.status;
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
                 button_text = $6, button_link = $7, text_color = $8, overlay_opacity = $9,
                 display_duration = $10, overlay_enabled = $11, button_enabled = $12,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $13
             RETURNING *`,
            [title, subtitle, description, position, status, button_text, button_link, text_color, overlay_opacity, display_duration, overlay_enabled, button_enabled, req.params.id]
        );
        
        await logActivity('update', 'slide', result.rows[0].id, `Updated slide "${title}"`);

        res.json({
            success: true,
            message: 'Slide updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating slide:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete slide
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM slides WHERE id = $1 RETURNING id, title',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Slide not found' });
        }

        await logActivity('delete', 'slide', result.rows[0].id, `Deleted slide "${result.rows[0].title}"`);
        
        res.json({
            success: true,
            message: 'Slide deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting slide:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active slides (for homepage)
router.get('/status/active', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides WHERE status = $1 ORDER BY position ASC',
            ['active']
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching active slides:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update slide position
router.patch('/:id/position', async (req, res) => {
    const { position } = req.body;
    
    if (position === undefined || position < 1 || position > 6) {
        return res.status(400).json({ error: 'Position must be between 1 and 6' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE slides SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [position, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Slide not found' });
        }
        
        await logActivity('update', 'slide', result.rows[0].id, `Changed slide "${result.rows[0].title}" position to ${position}`);

        res.json({
            success: true,
            message: 'Slide position updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating slide position:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get slide by position
router.get('/position/:position', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides WHERE position = $1',
            [req.params.position]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Slide not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching slide by position:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
