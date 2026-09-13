#!/usr/bin/env node
/**
 * GWOFO Automated Sitemap Generator
 * Inspects filesystem modification times (mtime) for static pages
 * and queries Neon PostgreSQL for published articles/posts.
 * Writes a lean, production-grade sitemap.xml to the website root.
 */

const fs = require('fs');
const path = require('path');

// Ensure server/node_modules is in module resolution path
module.paths.push(path.join(__dirname, '../server/node_modules'));

// Load environment variables from server/.env if available
const envPath = path.join(__dirname, '../server/.env');
if (fs.existsSync(envPath)) {
    try {
        const dotenv = require('dotenv');
        dotenv.config({ path: envPath });
    } catch (e) {
        // Fallback manual parser for .env if dotenv isn't found
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [k, ...v] = trimmed.split('=');
                if (!process.env[k.trim()]) {
                    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
                }
            }
        }
    }
}

const CANONICAL_HOST = 'https://gwofoliberia.org';
const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');

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

async function fetchPublishedPosts() {
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL not found; generating static pages sitemap only.');
        return [];
    }

    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const res = await pool.query(
            "SELECT slug, updated_at, created_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC"
        );
        await pool.end();
        return res.rows || [];
    } catch (err) {
        console.warn('⚠️ Could not connect to database for published posts:', err.message);
        return [];
    }
}

async function generateSitemap() {
    console.log('🔄 Generating automated sitemap.xml...');

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    let staticCount = 0;
    for (const page of staticPages) {
        const filePath = path.join(ROOT_DIR, page.file);
        let lastMod = '2026-09-13';
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            lastMod = stat.mtime.toISOString().split('T')[0];
        }
        xml += `  <url>\n    <loc>${CANONICAL_HOST}${page.loc}</loc>\n    <lastmod>${lastMod}</lastmod>\n  </url>\n`;
        staticCount++;
    }

    const posts = await fetchPublishedPosts();
    let postCount = 0;
    for (const post of posts) {
        const lastModDate = post.updated_at || post.created_at || new Date();
        const lastMod = (lastModDate instanceof Date ? lastModDate : new Date(lastModDate)).toISOString().split('T')[0];
        const postSlug = encodeURIComponent(post.slug || '');
        xml += `  <url>\n    <loc>${CANONICAL_HOST}/single.html?slug=${postSlug}</loc>\n    <lastmod>${lastMod}</lastmod>\n  </url>\n`;
        postCount++;
    }

    xml += '</urlset>\n';

    fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
    console.log(`✅ sitemap.xml generated successfully at ${SITEMAP_PATH}`);
    console.log(`   - Static pages: ${staticCount}`);
    console.log(`   - Published articles/posts: ${postCount}`);
}

generateSitemap().catch(err => {
    console.error('❌ Failed to generate sitemap:', err);
    process.exit(1);
});
