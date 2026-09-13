// IndexNow Protocol Integration for GWOFO Platform
// Pings search engines (Bing, Yandex, AI crawlers) immediately upon content changes
const https = require('https');

const INDEXNOW_HOST = 'gwofoliberia.org';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'gwofoliberia2025indexnow';

/**
 * Submit URLs to the IndexNow protocol
 * @param {string[]|string} urls - Absolute URL or list of absolute URLs to index
 */
async function submitToIndexNow(urls) {
    const urlList = Array.isArray(urls) ? urls : [urls];
    if (urlList.length === 0) return { success: false, reason: 'Empty URL list' };

    // Normalize URLs to canonical gwofoliberia.org host
    const normalizedUrls = urlList.map(u => {
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        return `https://${INDEXNOW_HOST}${u.startsWith('/') ? '' : '/'}${u}`;
    });

    const payload = JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: normalizedUrls
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.indexnow.org',
            port: 443,
            path: '/indexnow',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 202) {
                    console.log(`✅ IndexNow notified successfully for ${normalizedUrls.length} URLs (HTTP ${res.statusCode})`);
                    resolve({ success: true, status: res.statusCode });
                } else {
                    console.warn(`⚠️ IndexNow returned HTTP ${res.statusCode}: ${body}`);
                    resolve({ success: false, status: res.statusCode, error: body });
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            console.warn('⚠️ IndexNow request timed out');
            resolve({ success: false, error: 'Timeout' });
        });

        req.on('error', (err) => {
            console.warn('⚠️ IndexNow submission failed:', err.message);
            resolve({ success: false, error: err.message });
        });

        req.write(payload);
        req.end();
    });
}

module.exports = {
    INDEXNOW_HOST,
    INDEXNOW_KEY,
    submitToIndexNow
};
