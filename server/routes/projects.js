// Projects API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all projects
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new project
router.post('/', async (req, res) => {
    const { name, description, category, status, location, goal_amount, progress_percentage, start_date, end_date, manager_name } = req.body;
    
    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }
    
    try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const result = await pool.query(
            `INSERT INTO projects (name, slug, description, category, status, location, goal_amount, progress_percentage, start_date, end_date, manager_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [name, slug, description, category, status || 'planning', location, goal_amount || 0, progress_percentage || 0, start_date, end_date, manager_name]
        );
        
        await logActivity('create', 'project', result.rows[0].id, `Created project "${name}"`);
        
        // Notify active subscribers (safeguarded against missing files)
        try {
            const { notifySubscribers } = require('../utils/notifier');
            notifySubscribers('project', result.rows[0].id, name).catch(err => {
                console.error('Notification error:', err);
            });
        } catch (notifierErr) {
            console.warn('[Notifier Warning] Could not load notifier module (ensure server/utils/notifier.js is committed):', notifierErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update project (partial-safe – merges with existing record)
router.put('/:id', async (req, res) => {
    try {
        // Fetch existing record first
        const existing = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const old = existing.rows[0];

        // Merge: use request value if provided, otherwise keep existing
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

        const result = await pool.query(
            `UPDATE projects 
             SET name = $1, description = $2, category = $3, status = $4, location = $5,
                 goal_amount = $6, progress_percentage = $7, start_date = $8, end_date = $9,
                 manager_name = $10, updated_at = CURRENT_TIMESTAMP
             WHERE id = $11
             RETURNING *`,
            [name, description, category, status, location, goal_amount, progress_percentage, start_date, end_date, manager_name, req.params.id]
        );
        
        await logActivity('update', 'project', result.rows[0].id, `Updated project "${name}"`);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM projects WHERE id = $1 RETURNING id, name',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await logActivity('delete', 'project', result.rows[0].id, `Deleted project "${result.rows[0].name}"`);
        
        res.json({
            success: true,
            message: 'Project deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: error.message });
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
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching projects by status:', error);
        res.status(500).json({ error: error.message });
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
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching projects by category:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get recent projects (for dashboard)
router.get('/recent/:limit', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 5;
        const result = await pool.query(
            'SELECT id, name, progress_percentage, status FROM projects ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent projects:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update project progress
router.patch('/:id/progress', async (req, res) => {
    const { progress_percentage } = req.body;
    
    if (progress_percentage === undefined || progress_percentage < 0 || progress_percentage > 100) {
        return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE projects SET progress_percentage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [progress_percentage, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        await logActivity('update', 'project', result.rows[0].id, `Updated progress of project "${result.rows[0].name}" to ${progress_percentage}%`);

        res.json({
            success: true,
            message: 'Project progress updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating project progress:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
