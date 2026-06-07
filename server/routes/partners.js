// Partners API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all partners
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partner by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching partner:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new partner
router.post('/', async (req, res) => {
    const { name, type, level, contact_person, email, phone, website, description, start_date, end_date, funding_amount, status } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    
    try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const result = await pool.query(
            `INSERT INTO partners (name, slug, type, level, contact_person, email, phone, website, description, start_date, end_date, funding_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [name, slug, type, level || 'bronze', contact_person, email, phone, website, description, start_date, end_date, funding_amount || 0, status || 'active']
        );
        
        await logActivity('create', 'partner', result.rows[0].id, `Created partner "${name}"`);

        res.status(201).json({
            success: true,
            message: 'Partner created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating partner:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update partner (partial-safe – merges with existing record)
router.put('/:id', async (req, res) => {
    try {
        // Fetch existing record first
        const existing = await pool.query('SELECT * FROM partners WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        const old = existing.rows[0];

        // Merge: use request value if provided, otherwise keep existing
        const name           = req.body.name           !== undefined ? req.body.name           : old.name;
        const type           = req.body.type           !== undefined ? req.body.type           : old.type;
        const level          = req.body.level          !== undefined ? req.body.level          : old.level;
        const contact_person = req.body.contact_person !== undefined ? req.body.contact_person : old.contact_person;
        const email          = req.body.email          !== undefined ? req.body.email          : old.email;
        const phone          = req.body.phone          !== undefined ? req.body.phone          : old.phone;
        const website        = req.body.website        !== undefined ? req.body.website        : old.website;
        const description    = req.body.description    !== undefined ? req.body.description    : old.description;
        const start_date     = req.body.start_date     !== undefined ? req.body.start_date     : old.start_date;
        const end_date       = req.body.end_date       !== undefined ? req.body.end_date       : old.end_date;
        const funding_amount = req.body.funding_amount !== undefined ? req.body.funding_amount : old.funding_amount;
        const status         = req.body.status         !== undefined ? req.body.status         : old.status;

        const result = await pool.query(
            `UPDATE partners 
             SET name = $1, type = $2, level = $3, contact_person = $4, email = $5, phone = $6,
                 website = $7, description = $8, start_date = $9, end_date = $10,
                 funding_amount = $11, status = $12, updated_at = CURRENT_TIMESTAMP
             WHERE id = $13
             RETURNING *`,
            [name, type, level, contact_person, email, phone, website, description, start_date, end_date, funding_amount, status, req.params.id]
        );
        
        await logActivity('update', 'partner', result.rows[0].id, `Updated partner "${name}"`);

        res.json({
            success: true,
            message: 'Partner updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete partner
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM partners WHERE id = $1 RETURNING id, name',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        await logActivity('delete', 'partner', result.rows[0].id, `Deleted partner "${result.rows[0].name}"`);
        
        res.json({
            success: true,
            message: 'Partner deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partners by type
router.get('/type/:type', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE type = $1 ORDER BY created_at DESC',
            [req.params.type]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners by type:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partners by level
router.get('/level/:level', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE level = $1 ORDER BY created_at DESC',
            [req.params.level]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners by level:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partners by status
router.get('/status/:status', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE status = $1 ORDER BY created_at DESC',
            [req.params.status]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners by status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partner statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_partners,
                COUNT(DISTINCT type) as total_types,
                SUM(funding_amount) as total_funding,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_partners
             FROM partners`
        );
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching partner statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
