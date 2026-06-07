const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Config file for backup schedule
const SCHEDULE_FILE = path.join(__dirname, '../config/backup-schedule.json');

// Table list in dependency order (referenced first, references last)
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

// Helper to get backup schedule
function getSchedule() {
    try {
        if (fs.existsSync(SCHEDULE_FILE)) {
            return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading schedule file:', e);
    }
    return { frequency: 'weekly', day: 'sunday', time: '02:00', retention: '30' };
}

// 1. Get List of Backups
router.get('/', (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                
                // Read type from backup file metadata if possible
                let type = 'Full';
                try {
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (content.type) type = content.type;
                } catch (_) {}

                return {
                    filename: file,
                    created_at: stats.mtime,
                    size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                    sizeBytes: stats.size,
                    type: type
                };
            })
            .sort((a, b) => b.created_at - a.created_at);

        res.json({ success: true, data: backups });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ success: false, error: 'Failed to list backups' });
    }
});

// 2. Create New Backup
router.post('/', async (req, res) => {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            type: req.body.type || 'Full',
            tables: {}
        };

        // Query all tables
        for (const table of TABLES) {
            const result = await pool.query(`SELECT * FROM ${table}`);
            backupData.tables[table] = result.rows;
        }

        const dateStr = new Date().toISOString().slice(0, 10);
        const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
        const filename = `backup_${dateStr}_${timeStr}_${backupData.type.toLowerCase()}.json`;
        const filePath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

        res.status(201).json({
            success: true,
            message: 'Backup created successfully',
            data: { filename, type: backupData.type }
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ success: false, error: 'Failed to create backup: ' + error.message });
    }
});

// 3. Upload Backup
router.post('/upload', (req, res) => {
    try {
        const { filename, content } = req.body;
        if (!filename || !content) {
            return res.status(400).json({ success: false, error: 'Filename and content are required' });
        }

        // Validate content structure
        let parsedContent = content;
        if (typeof content === 'string') {
            parsedContent = JSON.parse(content);
        }

        if (!parsedContent.tables || !parsedContent.timestamp) {
            return res.status(400).json({ success: false, error: 'Invalid backup file format' });
        }

        const safeFilename = filename.replace(/[^a-zA-Z0-9_\.-]/g, '_');
        const filePath = path.join(BACKUP_DIR, safeFilename);

        fs.writeFileSync(filePath, JSON.stringify(parsedContent, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'Backup uploaded successfully',
            data: { filename: safeFilename }
        });
    } catch (error) {
        console.error('Error uploading backup:', error);
        res.status(500).json({ success: false, error: 'Failed to upload backup: ' + error.message });
    }
});

// 4. Download Backup
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath) || path.relative(BACKUP_DIR, filePath).includes('..')) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
    }

    res.download(filePath, filename);
});

// 5. Delete Backup
router.delete('/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filePath) || path.relative(BACKUP_DIR, filePath).includes('..')) {
            return res.status(404).json({ success: false, error: 'Backup file not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Backup deleted successfully' });
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ success: false, error: 'Failed to delete backup' });
    }
});

// 6. Restore Backup
router.post('/restore/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath) || path.relative(BACKUP_DIR, filePath).includes('..')) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
    }

    const client = await pool.connect();
    try {
        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!backupData.tables) {
            throw new Error('Invalid backup file structure');
        }

        await client.query('BEGIN');

        // Truncate all tables in CASCADE mode
        const truncateQuery = `TRUNCATE TABLE ${TABLES.reverse().join(', ')} RESTART IDENTITY CASCADE`;
        await client.query(truncateQuery);
        TABLES.reverse(); // Restore original order

        // Restore tables in forward order
        for (const table of TABLES) {
            const rows = backupData.tables[table] || [];
            if (rows.length === 0) continue;

            const columns = Object.keys(rows[0]);
            
            for (const row of rows) {
                const colNames = columns.join(', ');
                const valPlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const values = columns.map(col => row[col]);

                const insertQuery = `INSERT INTO ${table} (${colNames}) VALUES (${valPlaceholders})`;
                await client.query(insertQuery, values);
            }

            // Reset sequence for SERIAL PK if exists
            try {
                await client.query(`
                    SELECT setval(pg_get_serial_sequence('${table}', 'id'), coalesce(max(id), 1), max(id) IS NOT null) 
                    FROM ${table}
                `);
            } catch (_) {
                // Ignore errors for tables without a serial 'id'
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Database restored successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error restoring database:', error);
        res.status(500).json({ success: false, error: 'Failed to restore database: ' + error.message });
    } finally {
        client.release();
    }
});

// 7. Get Backup Schedule Settings
router.get('/schedule', (req, res) => {
    res.json({ success: true, data: getSchedule() });
});

// 8. Save Backup Schedule Settings
router.post('/schedule', (req, res) => {
    try {
        const { frequency, day, time, retention } = req.body;
        const configDir = path.dirname(SCHEDULE_FILE);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        const config = { frequency, day, time, retention };
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(config, null, 2), 'utf8');

        res.json({ success: true, message: 'Backup schedule saved successfully', data: config });
    } catch (error) {
        console.error('Error saving schedule:', error);
        res.status(500).json({ success: false, error: 'Failed to save schedule' });
    }
});

module.exports = router;
