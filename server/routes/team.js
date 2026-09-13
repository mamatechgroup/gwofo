// Team Members API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');
const { requireAuth } = require('./auth');

// Get all team members
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM team_members ORDER BY created_at ASC'
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get team member by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM team_members WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Team member not found' });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new team member (Protected)
router.post('/', requireAuth, async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        position,
        department,
        bio,
        profile_image,
        linkedin_url,
        twitter_url,
        facebook_url,
        join_date,
        status
    } = req.body;
    
    if (!first_name || !last_name || !email || !position) {
        return res.status(400).json({ success: false, error: 'First name, last name, email, and position are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO team_members (first_name, last_name, email, phone, position, department, bio, profile_image, linkedin_url, twitter_url, facebook_url, join_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                first_name,
                last_name,
                email,
                phone || '',
                position,
                department || 'General',
                bio || '',
                profile_image || '',
                linkedin_url || '',
                twitter_url || '',
                facebook_url || '',
                join_date || new Date(),
                status || 'active'
            ]
        );
        
        await logActivity('create', 'team_member', result.rows[0].id, `Created team member "${first_name} ${last_name}"`);

        res.status(201).json({
            success: true,
            message: 'Team member created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update team member (Protected)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await pool.query('SELECT * FROM team_members WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Team member not found' });
        }
        const old = existing.rows[0];

        const first_name    = req.body.first_name    !== undefined ? req.body.first_name    : old.first_name;
        const last_name     = req.body.last_name     !== undefined ? req.body.last_name     : old.last_name;
        const email         = req.body.email         !== undefined ? req.body.email         : old.email;
        const phone         = req.body.phone         !== undefined ? req.body.phone         : old.phone;
        const position      = req.body.position      !== undefined ? req.body.position      : old.position;
        const department    = req.body.department    !== undefined ? req.body.department    : old.department;
        const bio           = req.body.bio           !== undefined ? req.body.bio           : old.bio;
        const profile_image = req.body.profile_image !== undefined ? req.body.profile_image : old.profile_image;
        const linkedin_url  = req.body.linkedin_url  !== undefined ? req.body.linkedin_url  : old.linkedin_url;
        const twitter_url   = req.body.twitter_url   !== undefined ? req.body.twitter_url   : old.twitter_url;
        const facebook_url  = req.body.facebook_url  !== undefined ? req.body.facebook_url  : old.facebook_url;
        const join_date     = req.body.join_date     !== undefined ? req.body.join_date     : old.join_date;
        const status        = req.body.status        !== undefined ? req.body.status        : old.status;

        const result = await pool.query(
             `UPDATE team_members 
              SET first_name = $1, last_name = $2, email = $3, phone = $4, position = $5,
                  department = $6, bio = $7, profile_image = $8, linkedin_url = $9, twitter_url = $10, facebook_url = $11,
                  join_date = $12, status = $13, updated_at = CURRENT_TIMESTAMP
              WHERE id = $14
              RETURNING *`,
             [first_name, last_name, email, phone, position, department, bio, profile_image, linkedin_url, twitter_url, facebook_url, join_date, status, req.params.id]
        );
        
        await logActivity('update', 'team_member', result.rows[0].id, `Updated team member "${first_name} ${last_name}"`);

        res.json({
            success: true,
            message: 'Team member updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete team member (Protected)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM team_members WHERE id = $1 RETURNING id, first_name, last_name',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Team member not found' });
        }

        await logActivity('delete', 'team_member', result.rows[0].id, `Deleted team member "${result.rows[0].first_name} ${result.rows[0].last_name}"`);
        
        res.json({
            success: true,
            message: 'Team member deleted successfully',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Error deleting team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get team members by department
router.get('/department/:department', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM team_members WHERE department = $1 ORDER BY created_at ASC',
            [req.params.department]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching team members by department:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get team members by status
router.get('/status/:status', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM team_members WHERE status = $1 ORDER BY created_at ASC',
            [req.params.status]
        );
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching team members by status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get team statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_members,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
                COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave_members,
                COUNT(DISTINCT department) as total_departments
             FROM team_members`
        );
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching team statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
