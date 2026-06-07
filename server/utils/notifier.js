// server/utils/notifier.js
const pool = require('../config/database');

/**
 * Notify all active subscribers about a new post or project.
 * Simulates sending an email notification to each subscriber.
 */
async function notifySubscribers(type, id, title) {
    try {
        const result = await pool.query(
            "SELECT email FROM newsletter_subscriptions WHERE status = $1",
            ['active']
        );
        const emails = result.rows.map(r => r.email);
        if (emails.length === 0) {
            console.log(`[Notifier] No active subscribers to notify for new ${type}: "${title}".`);
            return;
        }

        console.log(`\n=================== NOTIFICATION BROADCAST ===================`);
        console.log(`New ${type} added: "${title}" (ID: ${id})`);
        console.log(`Notifying ${emails.length} active subscribers:`);
        emails.forEach(email => {
            console.log(`  => Mock email sent to: ${email} | Subject: New GWOFO ${type} published!`);
        });
        console.log(`==============================================================\n`);
    } catch (error) {
        console.error('[Notifier Error] Failed to notify subscribers:', error);
    }
}

module.exports = { notifySubscribers };
