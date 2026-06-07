const pool = require('../config/database');

/**
 * Log administrative activity to database
 * @param {string} action - 'create', 'update', 'delete', 'publish', 'archive', etc.
 * @param {string} entityType - 'post', 'project', 'team_member', 'partner', 'slide', etc.
 * @param {number|string} entityId - ID of the mutated record
 * @param {string} description - Brief description of action taken
 * @param {number} [userId] - Optional ID of the admin user who performed action
 */
async function logActivity(action, entityType, entityId, description, userId = null) {
    try {
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId || null, action, entityType, entityId, description]
        );
        console.log(`📝 Activity logged: [${action.toUpperCase()}] ${entityType} #${entityId} - ${description}`);
    } catch (error) {
        console.error('Error logging database activity:', error);
    }
}

module.exports = { logActivity };
