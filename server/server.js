// Main server file - GWOFO Production Server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const initializeDatabase = require('./config/init');
const pool = require('./config/database');
const { startBackupScheduler, stopBackupScheduler } = require('./utils/scheduler');
const { INDEXNOW_KEY } = require('./utils/indexnow');

dotenv.config();

const app = express();

// Request log suppression for high-frequency health probes
app.use((req, res, next) => {
    const isHealthCheck = req.path === '/health' || req.path === '/health/ready' ||
                          req.path === '/api/health' || req.path === '/api/health/ready';
    req.isHealthCheck = isHealthCheck;
    next();
});

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.path.startsWith('/api') || req.path === '/health' || req.path.startsWith('/health/')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
});

// Middleware - CORS Configuration with Strict Whitelist
const allowedOrigins = (process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, '')) 
    : []
).concat(['https://gwofoliberia.org', 'https://www.gwofoliberia.org']);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, server-to-server, health monitors)
        if (!origin) return callback(null, true);
        
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }
        
        // In development, allow localhost and 127.0.0.1 on any port
        if (process.env.NODE_ENV !== 'production') {
            if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
                return callback(null, true);
            }
        }
        
        callback(new Error('CORS policy: Origin not allowed by CORS whitelist'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple Rate Limiting for public write actions
const rateLimitMap = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

function rateLimiter(windowMs = 60 * 1000, maxRequests = 30) {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const key = `${ip}:${req.baseUrl}`;
        const now = Date.now();
        const entry = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

        if (now > entry.resetTime) {
            entry.count = 1;
            entry.resetTime = now + windowMs;
        } else {
            entry.count++;
        }
        rateLimitMap.set(key, entry);

        if (entry.count > maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please slow down and try again shortly.'
            });
        }
        next();
    };
}

// Canonical Homepage 301 Redirect: /index.html -> /
app.get('/index.html', (req, res) => {
    res.redirect(301, '/');
});

// Canonical Admin Login 301 Redirect: /admin/login.html -> /admin/login
app.get('/admin/login.html', (req, res) => {
    res.redirect(301, '/admin/login');
});

// Explicit Clean URL Route Handlers
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/login.html'));
});
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dashboard.html'));
});
app.get('/single', (req, res) => {
    res.sendFile(path.join(__dirname, '../single.html'));
});

// Static files (serves root website files with automatic .html extension resolution)
app.use(express.static(path.join(__dirname, '../'), { extensions: ['html'] }));

// Routes
app.use('/api/auth', rateLimiter(60 * 1000, 20), require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/comments', rateLimiter(60 * 1000, 25), require('./routes/comments'));
app.use('/api/inquiries', rateLimiter(60 * 1000, 20), require('./routes/inquiries'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/team', require('./routes/team'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/newsletter', rateLimiter(60 * 1000, 15), require('./routes/newsletter'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/social-links', require('./routes/social-links'));

// Dedicated Liveness Probe (Render health checks & keep-alive monitors)
// Fast, in-memory, side-effect free, zero DB queries
app.get(['/health', '/api/health'], (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'GWOFO API',
        timestamp: new Date().toISOString()
    });
});

// Dedicated Readiness Probe (Probes PostgreSQL connectivity)
// Executes bounded SELECT 1 with 5000ms timeout; returns 503 if unreachable without leaking secrets
app.get(['/health/ready', '/api/health/ready'], async (req, res) => {
    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timed out')), 5000)
        );
        await Promise.race([
            pool.query('SELECT 1'),
            timeoutPromise
        ]);
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('⚠️ Readiness probe failed:', error.message);
        res.status(503).json({
            status: 'error',
            message: 'Service Unavailable'
        });
    }
});

// Dynamic Sitemap Generator with automated filesystem mtime & PostgreSQL published post dates
app.get('/sitemap.xml', async (req, res) => {
    const canonicalHost = 'https://gwofoliberia.org';
    const staticPages = [
        { loc: '/', file: 'index.html' },
        { loc: '/about.html', file: 'about.html' },
        { loc: '/projects.html', file: 'projects.html' },
        { loc: '/projects-education.html', file: 'projects-education.html' },
        { loc: '/projects-empowerment.html', file: 'projects-empowerment.html' },
        { loc: '/projects-health.html', file: 'projects-health.html' },
        { loc: '/partners.html', file: 'partners.html' },
        { loc: '/ngo-partners.html', file: 'ngo-partners.html' },
        { loc: '/team.html', file: 'team.html' },
        { loc: '/board.html', file: 'board.html' },
        { loc: '/impact.html', file: 'impact.html' },
        { loc: '/get-involved.html', file: 'get-involved.html' },
        { loc: '/become-partner.html', file: 'become-partner.html' },
        { loc: '/report.html', file: 'report.html' },
        { loc: '/contact.html', file: 'contact.html' }
    ];

    try {
        let postRows = [];
        try {
            const result = await pool.query(
                "SELECT slug, updated_at, created_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC"
            );
            postRows = result.rows || [];
        } catch (dbErr) {
            console.warn('⚠️ Dynamic sitemap DB query fallback:', dbErr.message);
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const page of staticPages) {
            const filePath = path.join(__dirname, '..', page.file);
            let lastMod = '2026-09-13';
            try {
                if (fs.existsSync(filePath)) {
                    lastMod = fs.statSync(filePath).mtime.toISOString().split('T')[0];
                }
            } catch (statErr) {
                console.warn(`⚠️ Could not read mtime for ${page.file}:`, statErr.message);
            }
            xml += `  <url>\n    <loc>${canonicalHost}${page.loc}</loc>\n    <lastmod>${lastMod}</lastmod>\n  </url>\n`;
        }

        for (const post of postRows) {
            const lastModDate = post.updated_at || post.created_at || new Date();
            const lastMod = (lastModDate instanceof Date ? lastModDate : new Date(lastModDate)).toISOString().split('T')[0];
            const postSlug = encodeURIComponent(post.slug || '');
            xml += `  <url>\n    <loc>${canonicalHost}/single.html?slug=${postSlug}</loc>\n    <lastmod>${lastMod}</lastmod>\n  </url>\n`;
        }

        xml += '</urlset>';
        res.type('application/xml').send(xml);
    } catch (err) {
        console.error('Error generating dynamic sitemap:', err);
        res.sendFile(path.join(__dirname, '../sitemap.xml'));
    }
});

// IndexNow Verification Key Route
app.get(`/${INDEXNOW_KEY}.txt`, (req, res) => {
    res.type('text/plain').send(INDEXNOW_KEY);
});
app.get('/:key.txt', (req, res, next) => {
    if (req.params.key === INDEXNOW_KEY) {
        return res.type('text/plain').send(INDEXNOW_KEY);
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err && err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            error: 'CORS forbidden: Origin not allowed'
        });
    }
    console.error('Server error:', err.stack || err.message);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'API route not found' });
});

// Fallback for HTML5 client requests: send 404.html with strict 404 HTTP status
app.use((req, res) => {
    if (req.accepts('html')) {
        return res.status(404).sendFile(path.join(__dirname, '../404.html'));
    }
    res.status(404).json({ success: false, error: 'Not found' });
});

const PORT = process.env.PORT || 10000;
let server = null;
let isShuttingDown = false;

// Graceful shutdown handler for zero-downtime restarts and Render lifecycle events
async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Safety timeout to force termination if in-flight tasks hang
    const forceExitTimer = setTimeout(() => {
        console.error('⚠️ Graceful shutdown timed out after 10s. Forcing exit.');
        process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    if (server) {
        server.close(async () => {
            console.log('✅ Closed active HTTP connections.');
            try {
                stopBackupScheduler();
                await pool.end();
                console.log('✅ Closed database connection pool.');
                process.exit(0);
            } catch (err) {
                console.error('Error closing resources on shutdown:', err);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        
        server = app.listen(PORT, () => {
            console.log('');
            console.log('🚀 GWOFO Server running on port ' + PORT);
            console.log('📍 API available at http://localhost:' + PORT + '/api');
            console.log('🌐 Web platform served from http://localhost:' + PORT + '/');
            console.log('💓 Liveness probe active at http://localhost:' + PORT + '/health');
            console.log('🩺 Readiness probe active at http://localhost:' + PORT + '/health/ready');
            console.log('');
            startBackupScheduler();
        });
    } catch (error) {
        console.error('Fatal error starting server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
