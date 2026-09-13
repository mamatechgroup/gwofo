// Projects API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('./auth');
const { logActivity } = require('../utils/logger');

// Helper to format project object with image_url
function formatProject(p) {
    if (!p) return null;
    return {
        ...p,
        image_url: p.image || null
    };
}

// Get all projects (public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: result.rows.map(formatProject),
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get project by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({
            success: true,
            data: formatProject(result.rows[0])
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new project (admin only)
router.post('/', requireAuth, async (req, res) => {
    const { name, description, category, status, location, goal_amount, progress_percentage, start_date, end_date, manager_name, image, image_url } = req.body;
    
    if (!name || !description) {
        return res.status(400).json({ success: false, error: 'Name and description are required' });
    }
    
    try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const projectImage = image || image_url || null;
        
        const result = await pool.query(
            `INSERT INTO projects (name, slug, description, category, status, location, goal_amount, progress_percentage, start_date, end_date, manager_name, image, manager_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [name, slug, description, category, status || 'planning', location, goal_amount || 0, progress_percentage || 0, start_date, end_date, manager_name, projectImage, req.user.id]
        );
        
        await logActivity('create', 'project', result.rows[0].id, `Created project "${name}"`, req.user.id);
        
        try {
            const { notifySubscribers } = require('../utils/notifier');
            notifySubscribers('project', result.rows[0].id, name).catch(err => {
                console.error('Notification error:', err);
            });
        } catch (_) {}

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: formatProject(result.rows[0])
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update project (admin only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        const old = existing.rows[0];

        const name                = req.body.name                !== undefined ? req.body.name                : old.name;
        const description         = req.body.description         !== undefined ? req.body.description         : old.description;
        const category            = req.body.category            !== undefined ? req.body.category            : old.category;
        const status              = req.body.status              !== undefined ? req.body.status              : old.status;
        const location            = req.body.location            !== undefined ? req.body.location            : old.location;
        const goal_amount         = req.body.goal_amount         !== undefined ? req.body.goal_amount         : old.goal_amount;
        const progress_percentage = req.body.progress_percentage !== undefined ? req.body.progress_percentage : old.progress_percentage;
        const start_date          = req.body.start_date          !== undefined ? req.body.start_date          : old.start_date;
        const end_date            = req.body.end_date            !== undefined ? req.body.end_date            : old.end_date;
        const manager_name        = req.body.manager_name        !== undefined ? req.body.manager_name        : old.manager_name;
        const image               = (req.body.image !== undefined ? req.body.image : (req.body.image_url !== undefined ? req.body.image_url : old.image));

        const result = await pool.query(
            `UPDATE projects 
             SET name = $1, description = $2, category = $3, status = $4, location = $5,
                 goal_amount = $6, progress_percentage = $7, start_date = $8, end_date = $9,
                 manager_name = $10, image = $11, updated_at = CURRENT_TIMESTAMP
             WHERE id = $12
             RETURNING *`,
            [name, description, category, status, location, goal_amount, progress_percentage, start_date, end_date, manager_name, image, req.params.id]
        );
        
        await logActivity('update', 'project', result.rows[0].id, `Updated project "${name}"`, req.user.id);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: formatProject(result.rows[0])
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete project (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM projects WHERE id = $1 RETURNING id, name',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        await logActivity('delete', 'project', result.rows[0].id, `Deleted project "${result.rows[0].name}"`, req.user.id);
        
        res.json({
            success: true,
            message: 'Project deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get projects by status
router.get('/status/:status', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC',
            [req.params.status]
        );
        res.json({
            success: true,
            data: result.rows.map(formatProject),
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching projects by status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get projects by category
router.get('/category/:category', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE category = $1 ORDER BY created_at DESC',
            [req.params.category]
        );
        res.json({
            success: true,
            data: result.rows.map(formatProject),
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching projects by category:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get recent projects
router.get('/recent/:limit', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 5;
        const result = await pool.query(
            'SELECT id, name, progress_percentage, status, image FROM projects ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        res.json({
            success: true,
            data: result.rows.map(formatProject)
        });
    } catch (error) {
        console.error('Error fetching recent projects:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update project progress (admin only)
router.patch('/:id/progress', requireAuth, async (req, res) => {
    const { progress_percentage } = req.body;
    
    if (progress_percentage === undefined || progress_percentage < 0 || progress_percentage > 100) {
        return res.status(400).json({ success: false, error: 'Progress must be between 0 and 100' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE projects SET progress_percentage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [progress_percentage, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        
        await logActivity('update', 'project', result.rows[0].id, `Updated progress of project "${result.rows[0].name}" to ${progress_percentage}%`, req.user.id);

        res.json({
            success: true,
            message: 'Project progress updated',
            data: formatProject(result.rows[0])
        });
    } catch (error) {
        console.error('Error updating project progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
