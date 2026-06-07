// Dashboard API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get dashboard overview statistics
router.get('/stats', async (req, res) => {
    try {
        const [posts, projects, team, partners, subs] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM posts'),
            pool.query('SELECT COUNT(*) as count FROM projects'),
            pool.query('SELECT COUNT(*) as count FROM team_members'),
            pool.query('SELECT COUNT(*) as count FROM partners'),
            pool.query("SELECT COUNT(*) as count FROM newsletter_subscriptions WHERE status = 'active'")
        ]);
        
        res.json({
            success: true,
            data: {
                totalPosts: parseInt(posts.rows[0].count),
                totalProjects: parseInt(projects.rows[0].count),
                totalUsers: parseInt(subs.rows[0].count),
                totalPartners: parseInt(partners.rows[0].count),
                totalTeamMembers: parseInt(team.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM activity_logs';
        const params = [];
        if (type) {
            query += ' WHERE entity_type = $1';
            params.push(type);
        }
        query += ' ORDER BY created_at DESC LIMIT 10';
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard summary (all data for dashboard)
router.get('/summary', async (req, res) => {
    try {
        const [stats, recentPosts, recentProjects] = await Promise.all([
            pool.query(
                `SELECT 
                    (SELECT COUNT(*) FROM posts) as total_posts,
                    (SELECT COUNT(*) FROM projects) as total_projects,
                    (SELECT COUNT(*) FROM team_members) as total_team,
                    (SELECT COUNT(*) FROM partners) as total_partners,
                    (SELECT COUNT(*) FROM newsletter_subscriptions WHERE status = 'active') as total_subscriptions,
                    (SELECT COUNT(*) FROM posts WHERE status = 'published') as published_posts,
                    (SELECT COUNT(*) FROM projects WHERE status = 'active') as active_projects`
            ),
            pool.query(
                `SELECT id, title, author_name, published_date, status FROM posts ORDER BY created_at DESC LIMIT 5`
            ),
            pool.query(
                `SELECT id, name, progress_percentage, status FROM projects ORDER BY created_at DESC LIMIT 5`
            )
        ]);
        
        res.json({
            success: true,
            data: {
                stats: stats.rows[0],
                recentPosts: recentPosts.rows,
                recentProjects: recentProjects.rows
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get posts statistics
router.get('/posts-stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
                COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
             FROM posts`
        );
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching posts statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get projects statistics
router.get('/projects-stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning,
                ROUND(AVG(progress_percentage), 2) as average_progress,
                SUM(goal_amount) as total_goal_amount
             FROM projects`
        );
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching projects statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get team statistics
router.get('/team-stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
                COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave,
                COUNT(DISTINCT department) as total_departments
             FROM team_members`
        );
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching team statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partners statistics
router.get('/partners-stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN level = 'platinum' THEN 1 END) as platinum,
                COUNT(CASE WHEN level = 'gold' THEN 1 END) as gold,
                COUNT(CASE WHEN level = 'silver' THEN 1 END) as silver,
                COUNT(CASE WHEN level = 'bronze' THEN 1 END) as bronze,
                SUM(funding_amount) as total_funding
             FROM partners`
        );
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching partners statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get slides performance statistics
router.get('/slides-stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*) as total_slides,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_slides,
                COALESCE(SUM(views_count), 0) as total_views,
                COALESCE(SUM(clicks_count), 0) as total_clicks
             FROM slides`
        );
        const row = result.rows[0];
        const views  = parseInt(row.total_views)  || 0;
        const clicks = parseInt(row.total_clicks) || 0;
        const clickRate = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0%';

        res.json({
            success: true,
            data: {
                total_slides:  parseInt(row.total_slides),
                active_slides: parseInt(row.active_slides),
                total_views:   views,
                total_clicks:  clicks,
                click_rate:    clickRate
            }
        });
    } catch (error) {
        console.error('Error fetching slides statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Log activity
router.post('/log-activity', async (req, res) => {
    const { user_id, action, entity_type, entity_id, description } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user_id || null, action, entity_type, entity_id, description]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
