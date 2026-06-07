// Main server file
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const initializeDatabase = require('./config/init');
const { startBackupScheduler } = require('./utils/scheduler');

dotenv.config();

const app = express();

// Middleware - CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/projects', require('./routes/projects'));
// comments route removed – feature deleted
app.use('/api/team', require('./routes/team'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/backups', require('./routes/backups'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database tables (non-blocking - server starts even if db fails)
        await initializeDatabase();
        
        // Start Express server
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 Server running on port ' + PORT);
            console.log('📍 API available at http://localhost:' + PORT + '/api');
            console.log('');
            startBackupScheduler();
        });
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
