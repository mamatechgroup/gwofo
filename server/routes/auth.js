// Authentication API Routes – Secure HMAC tokens & Salted Passwords
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'gwofo-foundation-secret-key-liberia-secure-auth-2024';

// Secure password hashing using scrypt with salt
function hashPassword(password, existingSalt = null) {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

// Password verification with backward-compatibility for legacy unsalted SHA-256
function verifyPassword(password, storedHash) {
    if (!storedHash) return false;
    // Check if legacy unsalted SHA-256
    if (!storedHash.includes(':')) {
        const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
        return legacyHash === storedHash;
    }
    const [salt, hash] = storedHash.split(':');
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

// Tamper-proof cryptographic HMAC token generator
function generateToken(userId) {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity
    const payload = `${userId}.${expiresAt}`;
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
    return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

// Verify token signature and expiration
function verifyTokenString(token) {
    try {
        if (!token) return null;
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const parts = decoded.split('.');
        if (parts.length !== 3) return null;
        const [userIdStr, expiresStr, signature] = parts;
        const payload = `${userIdStr}.${expiresStr}`;
        const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
        
        if (signature.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
            return null;
        }
        const expiresAt = parseInt(expiresStr, 10);
        if (Date.now() > expiresAt) {
            return null;
        }
        return parseInt(userIdStr, 10);
    } catch (_) {
        return null;
    }
}

// Authentication middleware
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const userId = verifyTokenString(token);
    
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, status FROM admin_users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0 || result.rows[0].status !== 'active') {
            return res.status(401).json({ success: false, error: 'Unauthorized: Account inactive or not found' });
        }
        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Authentication verification error:', error);
        res.status(500).json({ success: false, error: 'Authentication service error' });
    }
}

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id, username, email, password_hash, role, status FROM admin_users WHERE username = $1',
            [username.trim()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
        
        const user = result.rows[0];
        
        if (!verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ success: false, error: 'User account is inactive' });
        }
        
        // Upgrade password to salted scrypt if still on legacy SHA-256
        if (!user.password_hash.includes(':')) {
            const upgradedHash = hashPassword(password);
            await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [upgradedHash, user.id]);
        }
        
        // Update last login timestamp
        await pool.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        const token = generateToken(user.id);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
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

// Update user details (authenticated)
router.put('/update-profile', requireAuth, async (req, res) => {
    const { username, email, password } = req.body;
    const userId = req.user.id;
    
    if (!username && !email && !password) {
        return res.status(400).json({ success: false, error: 'At least one field (username, email, or password) must be provided' });
    }
    
    try {
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ success: false, error: 'Email is already in use by another account' });
            }
        }
        
        if (username) {
            const usernameCheck = await pool.query(
                'SELECT id FROM admin_users WHERE username = $1 AND id != $2',
                [username, userId]
            );
            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({ success: false, error: 'Username is already taken' });
            }
        }
        
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
            if (password.length < 8) {
                return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
            }
            fields.push(`password_hash = $${index++}`);
            values.push(hashPassword(password));
        }
        
        values.push(userId);
        
        const query = `
            UPDATE admin_users 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${index}
            RETURNING id, username, email, role
        `;
        
        const result = await pool.query(query, values);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Request password reset (does NOT leak token to client)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    try {
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
            // Keep generic message to prevent email enumeration
            return res.json({
                success: true,
                message: 'If the email exists, a password reset link has been dispatched.'
            });
        }
        
        console.log(`[Security] Password reset requested for: ${email}. Reset Token: ${resetToken}`);
        
        res.json({
            success: true,
            message: 'If the email exists, a password reset link has been dispatched.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ success: false, error: 'Error processing reset request' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE admin_users 
             SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE password_reset_token = $2 AND password_reset_expires > CURRENT_TIMESTAMP
             RETURNING id, username, email`,
            [hashPassword(newPassword), token]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
        }
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Change password (authenticated user)
router.post('/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
    }
    
    try {
        const userResult = await pool.query(
            'SELECT id, password_hash FROM admin_users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0 || !verifyPassword(currentPassword, userResult.rows[0].password_hash)) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
        
        await pool.query(
            'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashPassword(newPassword), userId]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify token
router.post('/verify', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
    }
    
    const userId = verifyTokenString(token);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, status FROM admin_users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0 || result.rows[0].status !== 'active') {
            return res.status(401).json({ success: false, error: 'User account not active' });
        }
        res.json({
            success: true,
            message: 'Token is valid',
            user: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Token verification error' });
    }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
