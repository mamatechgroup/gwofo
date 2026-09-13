// Inquiries & Applications API Routes – Contact, Partner, and Volunteer
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('./auth');
const { logActivity } = require('../utils/logger');

// ─── PUBLIC SUBMISSION ENDPOINTS ──────────────────────────────────────────────

// Contact Message Submission
router.post('/contact', async (req, res) => {
    const { name, email, phone, subject, message, newsletter } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, error: 'Name, email, subject, and message are required' });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO contact_messages (name, email, phone, subject, message, status)
             VALUES ($1, $2, $3, $4, $5, 'unread')
             RETURNING *`,
            [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, subject.trim(), message.trim()]
        );

        // Opt-in to newsletter if checked
        if (newsletter) {
            try {
                await pool.query(
                    `INSERT INTO newsletter_subscriptions (email, full_name, status)
                     VALUES ($1, $2, 'active')
                     ON CONFLICT (email) DO NOTHING`,
                    [email.trim().toLowerCase(), name.trim()]
                );
            } catch (err) {
                console.warn('Newsletter auto-subscription failed:', err.message);
            }
        }

        await logActivity('create', 'contact_message', result.rows[0].id, `New contact message from "${name}" - ${subject}`);

        res.status(201).json({
            success: true,
            message: 'Thank you for reaching out! We have received your message and will respond shortly.',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Contact message submission error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit contact message' });
    }
});

// Partnership Application Submission
router.post('/partner', async (req, res) => {
    const { 
        organization_name, organization_type, organization_size,
        contact_name, contact_title, email, phone,
        partnership_type, interest, details 
    } = req.body;

    if (!organization_name || !contact_name || !email || !phone) {
        return res.status(400).json({ success: false, error: 'Organization name, contact name, email, and phone are required' });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO partnership_inquiries 
             (organization_name, organization_type, organization_size, contact_name, contact_title, email, phone, partnership_type, interest, details, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
             RETURNING *`,
            [
                organization_name.trim(),
                organization_type || 'General',
                organization_size || 'Not Specified',
                contact_name.trim(),
                contact_title || 'Representative',
                email.trim().toLowerCase(),
                phone.trim(),
                partnership_type || 'Collaboration',
                interest || null,
                details || null
            ]
        );

        await logActivity('create', 'partnership_inquiry', result.rows[0].id, `New partnership inquiry from "${organization_name}"`);

        res.status(201).json({
            success: true,
            message: 'Thank you for your partnership inquiry! Our team will contact you within 3 business days.',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Partnership inquiry submission error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit partnership inquiry' });
    }
});

// Volunteer Application Submission
router.post('/volunteer', async (req, res) => {
    const { full_name, email, phone, location, volunteer_type, skills, availability, motivation } = req.body;

    if (!full_name || !email || !location || !volunteer_type || !skills || !motivation) {
        return res.status(400).json({ success: false, error: 'Full name, email, location, volunteer type, skills, and motivation are required' });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO volunteer_applications 
             (full_name, email, phone, location, volunteer_type, skills, availability, motivation, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
             RETURNING *`,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                phone ? phone.trim() : null,
                location.trim(),
                volunteer_type.trim(),
                skills.trim(),
                availability ? availability.trim() : null,
                motivation.trim()
            ]
        );

        await logActivity('create', 'volunteer_application', result.rows[0].id, `New volunteer application from "${full_name}" (${volunteer_type})`);

        res.status(201).json({
            success: true,
            message: 'Thank you for your volunteer application! Our team will review your details and contact you.',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        console.error('Volunteer application submission error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit volunteer application' });
    }
});

// ─── ADMIN MANAGEMENT ENDPOINTS (requireAuth) ──────────────────────────────────

// Get overall stats for inquiries
router.get('/stats/summary', requireAuth, async (req, res) => {
    try {
        const [contacts, partners, volunteers] = await Promise.all([
            pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'unread' OR status = 'new' THEN 1 END) as pending FROM contact_messages"),
            pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending FROM partnership_inquiries"),
            pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending FROM volunteer_applications")
        ]);

        const totalContacts = parseInt(contacts.rows[0].total, 10) || 0;
        const pendingContacts = parseInt(contacts.rows[0].pending, 10) || 0;
        const totalPartners = parseInt(partners.rows[0].total, 10) || 0;
        const pendingPartners = parseInt(partners.rows[0].pending, 10) || 0;
        const totalVolunteers = parseInt(volunteers.rows[0].total, 10) || 0;
        const pendingVolunteers = parseInt(volunteers.rows[0].pending, 10) || 0;
        const totalPending = pendingContacts + pendingPartners + pendingVolunteers;

        res.json({
            success: true,
            data: {
                // Nested format
                contacts: { total: totalContacts, pending: pendingContacts },
                partners: { total: totalPartners, pending: pendingPartners },
                volunteers: { total: totalVolunteers, pending: pendingVolunteers },
                totalPending,

                // Flat format for direct frontend compatibility
                total_contacts: totalContacts,
                total_partnerships: totalPartners,
                total_volunteers: totalVolunteers,
                new_contacts: pendingContacts,
                pending_partners: pendingPartners,
                pending_volunteers: pendingVolunteers
            }
        });
    } catch (error) {
        console.error('Error fetching inquiry stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get items by inquiry type (contact, partner, volunteer)
router.get('/:type', requireAuth, async (req, res) => {
    const { type } = req.params;
    const { status } = req.query;

    let table = '';
    if (type === 'contact') table = 'contact_messages';
    else if (type === 'partner') table = 'partnership_inquiries';
    else if (type === 'volunteer') table = 'volunteer_applications';
    else return res.status(400).json({ success: false, error: 'Invalid inquiry type' });

    try {
        let query = `SELECT * FROM ${table}`;
        const params = [];
        if (status && status !== 'all') {
            query += ' WHERE status = $1';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error(`Error fetching ${type} inquiries:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update inquiry status
router.patch('/:type/:id/status', requireAuth, async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body;

    let table = '';
    if (type === 'contact') table = 'contact_messages';
    else if (type === 'partner') table = 'partnership_inquiries';
    else if (type === 'volunteer') table = 'volunteer_applications';
    else return res.status(400).json({ success: false, error: 'Invalid inquiry type' });

    if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE ${table} SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        await logActivity('update', `${type}_inquiry`, id, `Updated status to "${status}"`, req.user.id);

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error(`Error updating ${type} inquiry status:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk delete inquiries
router.post('/:type/bulk-delete', requireAuth, async (req, res) => {
    const { type } = req.params;
    const { ids } = req.body;

    let table = '';
    if (type === 'contact') table = 'contact_messages';
    else if (type === 'partner') table = 'partnership_inquiries';
    else if (type === 'volunteer') table = 'volunteer_applications';
    else return res.status(400).json({ success: false, error: 'Invalid inquiry type' });

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Array of inquiry IDs is required' });
    }

    const validIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid inquiry IDs provided' });
    }

    try {
        const result = await pool.query(
            `DELETE FROM ${table} WHERE id = ANY($1::int[]) RETURNING id`,
            [validIds]
        );

        const deletedCount = result.rows.length;
        await logActivity(
            'delete',
            `${type}_inquiry`,
            null,
            `Bulk deleted ${deletedCount} ${type} inquiry record(s)`,
            req.user.id
        );

        res.json({
            success: true,
            message: `Successfully deleted ${deletedCount} inquiry record(s)`,
            deletedCount,
            deletedIds: result.rows.map(r => r.id)
        });
    } catch (error) {
        console.error(`Error bulk deleting ${type} inquiries:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete inquiry
router.delete('/:type/:id', requireAuth, async (req, res) => {
    const { type, id } = req.params;

    let table = '';
    if (type === 'contact') table = 'contact_messages';
    else if (type === 'partner') table = 'partnership_inquiries';
    else if (type === 'volunteer') table = 'volunteer_applications';
    else return res.status(400).json({ success: false, error: 'Invalid inquiry type' });

    try {
        const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        await logActivity('delete', `${type}_inquiry`, id, `Deleted inquiry #${id}`, req.user.id);

        res.json({
            success: true,
            message: 'Inquiry deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting ${type} inquiry:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
