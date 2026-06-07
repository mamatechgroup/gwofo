const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const SCHEDULE_FILE = path.join(__dirname, '../config/backup-schedule.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

const TABLES = [
    'admin_users',
    'dashboard_stats',
    'newsletter_subscriptions',
    'slides',
    'partners',
    'team_members',
    'projects',
    'posts',
    'project_comments',
    'activity_logs'
];

let lastRunDate = null;

async function checkAndRunBackup() {
    try {
        if (!fs.existsSync(SCHEDULE_FILE)) return;
        const config = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
        if (config.frequency === 'never') return;

        const now = new Date();
        const currentDateStr = now.toISOString().slice(0, 10);
        
        // Prevent running multiple times on the same day
        if (lastRunDate === currentDateStr) return;

        const currentHour = now.getHours();
        const [targetHour] = config.time.split(':').map(Number);

        // Only run if the current hour matches the target hour
        if (currentHour !== targetHour) return;

        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayOfMonth = now.getDate();

        let shouldBackup = false;
        if (config.frequency === 'daily') {
            shouldBackup = true;
        } else if (config.frequency === 'weekly' && dayOfWeek === config.day) {
            shouldBackup = true;
        } else if (config.frequency === 'monthly' && dayOfMonth === 1) {
            shouldBackup = true;
        }

        if (shouldBackup) {
            console.log(`⏰ Triggering scheduled backup... (${config.frequency})`);
            lastRunDate = currentDateStr;

            const backupData = {
                timestamp: now.toISOString(),
                type: 'Scheduled',
                tables: {}
            };

            for (const table of TABLES) {
                const result = await pool.query(`SELECT * FROM ${table}`);
                backupData.tables[table] = result.rows;
            }

            if (!fs.existsSync(BACKUP_DIR)) {
                fs.mkdirSync(BACKUP_DIR, { recursive: true });
            }

            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
            const filename = `backup_${currentDateStr}_${timeStr}_scheduled.json`;
            const filePath = path.join(BACKUP_DIR, filename);

            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
            console.log(`✅ Scheduled backup created successfully: ${filename}`);

            // Enforce retention period (delete backups older than N days)
            const retentionDays = parseInt(config.retention) || 30;
            const files = fs.readdirSync(BACKUP_DIR);
            const nowTime = now.getTime();

            files.forEach(file => {
                if (!file.endsWith('.json')) return;
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                const ageDays = (nowTime - stats.mtimeMs) / (1000 * 60 * 60 * 24);
                
                if (ageDays > retentionDays) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Deleted expired backup: ${file} (older than ${retentionDays} days)`);
                }
            });
        }
    } catch (error) {
        console.error('Error in scheduled backup runner:', error);
    }
}

function startBackupScheduler() {
    console.log('⏰ Backup scheduler initialized (checking every 15 minutes)');
    // Check every 15 minutes
    setInterval(checkAndRunBackup, 15 * 60 * 1000);
    // Also run a check shortly after startup
    setTimeout(checkAndRunBackup, 10000);
}

module.exports = { startBackupScheduler };
