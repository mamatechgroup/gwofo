// Partners API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');
const { requireAuth } = require('./auth');

// Get all partners
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners ORDER BY created_at ASC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ success: false, error: error.message });
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
            return res.status(404).json({ success: false, error: 'Partner not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching partner:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new partner (Protected)
router.post('/', requireAuth, async (req, res) => {
    const {
        name,
        type,
        level,
        contact_person,
        email,
        phone,
        website,
        description,
        logo_url,
        start_date,
        end_date,
        funding_amount,
        status
    } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required' });
    }
    
    try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const result = await pool.query(
            `INSERT INTO partners (name, slug, type, level, contact_person, email, phone, website, description, logo_url, start_date, end_date, funding_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                name,
                slug,
                type || 'NGO',
                level || 'bronze',
                contact_person || '',
                email,
                phone || '',
                website || '',
                description || '',
                logo_url || '',
                start_date || new Date(),
                end_date || null,
                funding_amount || 0,
                status || 'active'
            ]
        );
        
        await logActivity('create', 'partner', result.rows[0].id, `Created partner "${name}"`);

        res.status(201).json({
            success: true,
            message: 'Partner created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating partner:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update partner (Protected)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await pool.query('SELECT * FROM partners WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Partner not found' });
        }
        const old = existing.rows[0];

        const name           = req.body.name           !== undefined ? req.body.name           : old.name;
        const type           = req.body.type           !== undefined ? req.body.type           : old.type;
        const level          = req.body.level          !== undefined ? req.body.level          : old.level;
        const contact_person = req.body.contact_person !== undefined ? req.body.contact_person : old.contact_person;
        const email          = req.body.email          !== undefined ? req.body.email          : old.email;
        const phone          = req.body.phone          !== undefined ? req.body.phone          : old.phone;
        const website        = req.body.website        !== undefined ? req.body.website        : old.website;
        const description    = req.body.description    !== undefined ? req.body.description    : old.description;
        const logo_url       = req.body.logo_url       !== undefined ? req.body.logo_url       : old.logo_url;
        const start_date     = req.body.start_date     !== undefined ? req.body.start_date     : old.start_date;
        const end_date       = req.body.end_date       !== undefined ? req.body.end_date       : old.end_date;
        const funding_amount = req.body.funding_amount !== undefined ? req.body.funding_amount : old.funding_amount;
        const status         = req.body.status         !== undefined ? req.body.status         : old.status;

        const result = await pool.query(
            `UPDATE partners 
             SET name = $1, type = $2, level = $3, contact_person = $4, email = $5, phone = $6,
                 website = $7, description = $8, logo_url = $9, start_date = $10, end_date = $11,
                 funding_amount = $12, status = $13, updated_at = CURRENT_TIMESTAMP
             WHERE id = $14
             RETURNING *`,
            [name, type, level, contact_person, email, phone, website, description, logo_url, start_date, end_date, funding_amount, status, req.params.id]
        );
        
        await logActivity('update', 'partner', result.rows[0].id, `Updated partner "${name}"`);

        res.json({
            success: true,
            message: 'Partner updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete partner (Protected)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM partners WHERE id = $1 RETURNING id, name',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Partner not found' });
        }

        await logActivity('delete', 'partner', result.rows[0].id, `Deleted partner "${result.rows[0].name}"`);
        
        res.json({
            success: true,
            message: 'Partner deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get partners by type
router.get('/type/:type', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE type = $1 ORDER BY created_at ASC',
            [req.params.type]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners by type:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get partners by level
router.get('/level/:level', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE level = $1 ORDER BY created_at ASC',
            [req.params.level]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners by level:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get partners by status
router.get('/status/:status', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM partners WHERE status = $1 ORDER BY created_at ASC',
            [req.params.status]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching partners by status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get partner statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_partners,
                COUNT(DISTINCT type) as total_types,
                COALESCE(SUM(funding_amount), 0) as total_funding,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_partners
             FROM partners`
        );
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching partner statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
