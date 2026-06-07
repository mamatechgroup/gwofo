// Newsletter subscription routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../utils/logger');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email, fullName } = req.body;

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Check if already subscribed
        const existingResult = await pool.query(
            'SELECT id FROM newsletter_subscriptions WHERE email = $1 AND status = $2',
            [email, 'active']
        );

        if (existingResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Email already subscribed'
            });
        }

        // Insert or update subscription
        const result = await pool.query(
            `INSERT INTO newsletter_subscriptions (email, full_name, status, subscribe_date)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (email) DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
             RETURNING id, email, full_name, status, subscribe_date`,
            [email, fullName || null, 'active']
        );

        await logActivity('create', 'newsletter', result.rows[0].id, `New newsletter subscription: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to subscribe to newsletter'
        });
    }
});

// Get all subscriptions (admin only)
router.get('/subscriptions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, full_name, status, subscribe_date, unsubscribe_date, created_at
             FROM newsletter_subscriptions
             ORDER BY subscribe_date DESC`
        );

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscriptions'
        });
    }
});

// Get subscription stats
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
                COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed,
                COUNT(*) as total_subscriptions
             FROM newsletter_subscriptions`
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching subscription stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    }
});

// Unsubscribe from newsletter
router.post('/unsubscribe/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE newsletter_subscriptions
             SET status = 'unsubscribed', unsubscribe_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, email, status`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }

        await logActivity('update', 'newsletter', result.rows[0].id, `Newsletter subscription unsubscribed: ${result.rows[0].email}`);

        res.json({
            success: true,
            message: 'Successfully unsubscribed from newsletter',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unsubscribe'
        });
    }
});

// Delete subscription (admin)
router.delete('/subscriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM newsletter_subscriptions WHERE id = $1 RETURNING id, email',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }

        await logActivity('delete', 'newsletter', result.rows[0].id, `Deleted newsletter subscription: ${result.rows[0].email}`);

        res.json({
            success: true,
            message: 'Subscription deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete subscription'
        });
    }
});

module.exports = router;
