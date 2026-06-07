// Authentication API Routes
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');

// Simple hash function for password (in production, use bcrypt)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Authentication middleware
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token.startsWith('token-')) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }
    const parts = token.split('-');
    const userId = parseInt(parts[1]);
    if (isNaN(userId)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token user ID' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id, username, email, role FROM admin_users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }
        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, status FROM admin_users WHERE username = $1 AND password_hash = $2',
            [username, hashPassword(password)]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const user = result.rows[0];
        
        if (user.status !== 'active') {
            return res.status(403).json({ error: 'User account is inactive' });
        }
        
        // Update last login
        await pool.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token: 'token-' + user.id + '-' + Date.now()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current user
router.get('/user', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Update user details (authenticated user)
router.put('/update-profile', requireAuth, async (req, res) => {
    const { username, email, password } = req.body;
    const userId = req.user.id;
    
    if (!username && !email && !password) {
        return res.status(400).json({ error: 'At least one field (username, email, or password) must be provided for update' });
    }
    
    try {
        // Validate email duplicate
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Email is already in use by another account' });
            }
        }
        
        // Validate username duplicate
        if (username) {
            const usernameCheck = await pool.query(
                'SELECT id FROM admin_users WHERE username = $1 AND id != $2',
                [username, userId]
            );
            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Username is already taken' });
            }
        }
        
        // Build update query dynamically
        const fields = [];
        const values = [];
        let index = 1;
        
        if (username) {
            fields.push(`username = $${index++}`);
            values.push(username);
        }
        if (email) {
            fields.push(`email = $${index++}`);
            values.push(email);
        }
        if (password) {
            fields.push(`password_hash = $${index++}`);
            values.push(hashPassword(password));
        }
        
        values.push(userId);
        
        const query = `
            UPDATE admin_users 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${index}
            RETURNING id, username, email
        `;
        
        const result = await pool.query(query, values);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    try {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour
        
        const result = await pool.query(
            `UPDATE admin_users 
             SET password_reset_token = $1, password_reset_expires = $2
             WHERE email = $3
             RETURNING id, email`,
            [resetToken, resetExpires, email]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            message: 'Password reset link sent to email',
            resetToken: resetToken // In production, send via email
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE admin_users 
             SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
             WHERE password_reset_token = $2 AND password_reset_expires > CURRENT_TIMESTAMP
             RETURNING id, username, email`,
            [hashPassword(newPassword), token]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Change password (authenticated user)
router.post('/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'User ID, current password, and new password are required' });
    }
    
    try {
        const userResult = await pool.query(
            'SELECT id FROM admin_users WHERE id = $1 AND password_hash = $2',
            [userId, hashPassword(currentPassword)]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        await pool.query(
            'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
            [hashPassword(newPassword), userId]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify token
router.post('/verify', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }
    
    if (token.startsWith('token-')) {
        res.json({
            success: true,
            message: 'Token is valid'
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});

module.exports = router;
