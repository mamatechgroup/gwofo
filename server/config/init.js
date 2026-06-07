// Database initialization module
// Automatically creates tables on server startup
const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database tables...');
        
        // Read the schema file - it's in the database directory at the same level as config
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Test connection first
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Execute the entire schema
        await pool.query(schema);
        
        console.log('✅ Database tables initialized successfully');
        console.log('📊 Default admin user created (username: admin, password: password)');
        return true;
    } catch (error) {
        console.error('⚠️  Warning - Database initialization failed:', error.message);
        console.log('💡 Tip: Check your DATABASE_URL in .env file and network connectivity to Neon');
        console.log('⚠️  Server will start anyway, but database features may not work');
        console.log('');
        
        // Don't throw - allow server to start anyway
        return false;
    }
}

module.exports = initializeDatabase;
