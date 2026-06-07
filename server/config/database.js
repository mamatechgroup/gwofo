// Database configuration
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cnTah2Cx8eGN@ep-dawn-night-aql9pb2c-pooler.c-8.us-east-1.aws.neon.tech/gwofo_db?sslmode=require&channel_binding=require',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased from 2000ms to handle Neon latency
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
