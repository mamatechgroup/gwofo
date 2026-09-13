// Social Links API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');
const { requireAuth } = require('./auth');

// Get all active social links (Public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM social_links WHERE is_active = true ORDER BY display_order ASC, id ASC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching public social links:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all social links including inactive (Protected - Admin)
router.get('/admin', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM social_links ORDER BY display_order ASC, id ASC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching admin social links:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single social link by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM social_links WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Social link not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching social link:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new social link (Protected)
router.post('/', requireAuth, async (req, res) => {
    const {
        platform,
        display_name,
        url,
        icon_class,
        color_class,
        is_active = true,
        display_order = 0
    } = req.body;

    if (!platform || !display_name || !url) {
        return res.status(400).json({ 
            success: false, 
            error: 'Platform, display name, and URL are required' 
        });
    }

    try {
        const cleanPlatform = platform.toLowerCase().trim();
        const icon = icon_class || `fab fa-${cleanPlatform}`;
        const color = color_class || cleanPlatform;

        const result = await pool.query(
            `INSERT INTO social_links (platform, display_name, url, icon_class, color_class, is_active, display_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [cleanPlatform, display_name.trim(), url.trim(), icon, color, Boolean(is_active), parseInt(display_order) || 0]
        );

        await logActivity('create', 'social_link', result.rows[0].id, `Added social link "${display_name}" (${cleanPlatform})`);

        res.status(201).json({
            success: true,
            message: 'Social link created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating social link:', error);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: `A link for platform "${platform}" already exists.` });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update social link (Protected)
router.put('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const {
        platform,
        display_name,
        url,
        icon_class,
        color_class,
        is_active,
        display_order
    } = req.body;

    try {
        // Verify existence
        const check = await pool.query('SELECT * FROM social_links WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Social link not found' });
        }

        const existing = check.rows[0];
        const newPlatform = platform !== undefined ? platform.toLowerCase().trim() : existing.platform;
        const newDisplayName = display_name !== undefined ? display_name.trim() : existing.display_name;
        const newUrl = url !== undefined ? url.trim() : existing.url;
        const newIconClass = icon_class !== undefined ? icon_class.trim() : existing.icon_class;
        const newColorClass = color_class !== undefined ? color_class.trim() : existing.color_class;
        const newIsActive = is_active !== undefined ? Boolean(is_active) : existing.is_active;
        const newDisplayOrder = display_order !== undefined ? parseInt(display_order) : existing.display_order;

        const result = await pool.query(
            `UPDATE social_links 
             SET platform = $1, display_name = $2, url = $3, icon_class = $4, 
                 color_class = $5, is_active = $6, display_order = $7, updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [newPlatform, newDisplayName, newUrl, newIconClass, newColorClass, newIsActive, newDisplayOrder, id]
        );

        await logActivity('update', 'social_link', id, `Updated social link "${newDisplayName}"`);

        res.json({
            success: true,
            message: 'Social link updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating social link:', error);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: `A link for platform "${platform}" already exists.` });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete social link (Protected)
router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM social_links WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Social link not found' });
        }

        await logActivity('delete', 'social_link', id, `Deleted social link "${result.rows[0].display_name}"`);

        res.json({
            success: true,
            message: 'Social link deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting social link:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
