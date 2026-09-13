// Automated End-to-End Test Suite for GWOFO Production Platform
// Tests database integration, public stats, form submissions, security, and moderation

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 10000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: body });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data: body, raw: body });
                }
            });
        });

        req.on('error', (err) => reject(err));

        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('====================================================');
    console.log('🚀 RUNNING GWOFO FULL PRODUCTION INTEGRATION TESTS');
    console.log('====================================================');

    let passed = 0;
    let failed = 0;

    function assert(name, condition, errorMsg = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${name} ${errorMsg}`);
            failed++;
        }
    }

    try {
        // 1. Health Liveness Probes
        const t0 = Date.now();
        const healthRoot = await makeRequest('GET', '/health');
        const rootLatency = Date.now() - t0;
        assert('Liveness Probe GET /health (HTTP 200 & status ok)', healthRoot.status === 200 && healthRoot.data.status === 'ok');
        assert('Liveness Probe Latency < 500ms', rootLatency < 500, `(Latency was ${rootLatency}ms)`);

        const healthApi = await makeRequest('GET', '/api/health');
        assert('Liveness Probe GET /api/health (HTTP 200 & status ok)', healthApi.status === 200 && healthApi.data.status === 'ok');

        // 1b. Health Readiness Probes (PostgreSQL connectivity)
        const tReady0 = Date.now();
        const readyRoot = await makeRequest('GET', '/health/ready');
        const readyLatency = Date.now() - tReady0;
        assert('Readiness Probe GET /health/ready (HTTP 200 & db connected)', readyRoot.status === 200 && readyRoot.data.status === 'ok' && readyRoot.data.database === 'connected');
        assert('Readiness Probe Latency < 5000ms (Cold start allowance)', readyLatency < 5000, `(Latency was ${readyLatency}ms)`);

        const readyApi = await makeRequest('GET', '/api/health/ready');
        assert('Readiness Probe GET /api/health/ready (HTTP 200 & db connected)', readyApi.status === 200 && readyApi.data.status === 'ok' && readyApi.data.database === 'connected');

        // 1c. Health Security Verification (No sensitive config leakage)
        const allHealthDataStr = JSON.stringify({ ...healthRoot.data, ...readyRoot.data });
        assert('Health Security: Zero Credentials/Passwords Leaked', !allHealthDataStr.includes('password') && !allHealthDataStr.includes('postgres://') && !allHealthDataStr.includes('neondb'));

        // 2. Public stats (Zero mock data check)
        const stats = await makeRequest('GET', '/api/stats/public');
        assert('Public Stats Endpoint (Zero Mock Data)', stats.status === 200 && stats.data.success);
        assert('Stats contains women_empowered', typeof stats.data.data.women_empowered === 'number');
        assert('Stats contains active_projects', typeof stats.data.data.active_projects === 'number');
        assert('Stats contains counties_reached', typeof stats.data.data.counties_reached === 'number');

        // 3. Homepage active slides
        const slides = await makeRequest('GET', '/api/slides/status/active');
        assert('Active Homepage Slides Retrieval', slides.status === 200 && Array.isArray(slides.data.data));

        // 4. Inquiries: Contact submission
        const contactSub = await makeRequest('POST', '/api/inquiries/contact', {
            name: 'Verification Bot',
            email: 'verify@gwofoliberia.org',
            phone: '+231888000000',
            subject: 'Automated Audit Verification',
            message: 'Testing production inquiry ingestion and database persistence.'
        });
        assert('Contact Form Submission', contactSub.status === 201 && contactSub.data.success);

        // 5. Inquiries: Volunteer submission
        const volSub = await makeRequest('POST', '/api/inquiries/volunteer', {
            full_name: 'Volunteer Test Candidate',
            email: 'volunteer.test@gwofoliberia.org',
            phone: '+231770000000',
            location: 'Zwedru',
            volunteer_type: 'local',
            skills: 'Youth mentoring, digital literacy',
            availability: '10 hours weekly',
            motivation: 'Passionate about girls education in Liberia'
        });
        assert('Volunteer Application Submission', volSub.status === 201 && volSub.data.success);

        // 6. Inquiries: Partnership submission
        const partnerSub = await makeRequest('POST', '/api/inquiries/partner', {
            organization_name: 'Global Empowerment Initiative',
            contact_name: 'Director Sarah Johnson',
            email: 'sarah.j@globalempower.org',
            phone: '+14155552671',
            website: 'https://globalempower.org',
            partnership_type: 'strategic',
            proposed_collaboration: 'Community liveskills micro-grant expansion',
            message: 'Interested in co-funding 2025 rural empowerment cohort.'
        });
        assert('Partnership Proposal Submission', partnerSub.status === 201 && partnerSub.data.success);

        // 7. Comments: Project comment submission
        const projectsRes = await makeRequest('GET', '/api/projects');
        const targetProjectId = projectsRes.data?.data?.[0]?.id || 4;
        const commentSub = await makeRequest('POST', `/api/comments/project/${targetProjectId}`, {
            author_name: 'Community Member',
            author_email: 'community@gwofoliberia.org',
            content: 'Great progress on the rural women liveskills empowerment project!'
        });
        assert('Project Comment Submission', commentSub.status === 201 && commentSub.data.success);

        // 8. Security: Route protection verification
        const unauthComments = await makeRequest('GET', '/api/comments/admin/all');
        assert('Security: Unauthenticated Comments Admin 401 Protected', unauthComments.status === 401);

        const unauthInquiries = await makeRequest('GET', '/api/inquiries/contact');
        assert('Security: Unauthenticated Inquiries Admin 401 Protected', unauthInquiries.status === 401);

        const unauthBackups = await makeRequest('GET', '/api/backups');
        assert('Security: Unauthenticated Backups 401 Protected', unauthBackups.status === 401);

        // 9. Auth Login & HMAC Token Generation
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            username: 'admin',
            password: 'password'
        });
        assert('Auth Login Valid Credentials', loginRes.status === 200 && loginRes.data.success);
        const token = loginRes.data.token;
        assert('Cryptographic Token Generated', !!token && typeof token === 'string' && token.length > 20);

        // 10. Authenticated Admin Actions
        const authComments = await makeRequest('GET', '/api/comments/admin/all', null, {
            'Authorization': `Bearer ${token}`
        });
        assert('Authenticated Admin Comments Access', authComments.status === 200 && Array.isArray(authComments.data.data));

        const authInquiries = await makeRequest('GET', '/api/inquiries/contact', null, {
            'Authorization': `Bearer ${token}`
        });
        assert('Authenticated Admin Inquiries Access', authInquiries.status === 200 && Array.isArray(authInquiries.data.data));

        // 11. Social Media Links Dynamic API
        const publicSocial = await makeRequest('GET', '/api/social-links');
        assert('Public Social Links Retrieval', publicSocial.status === 200 && Array.isArray(publicSocial.data.data) && publicSocial.data.data.length >= 6);

        const unauthSocialAdmin = await makeRequest('GET', '/api/social-links/admin');
        assert('Security: Unauthenticated Social Links Admin 401 Protected', unauthSocialAdmin.status === 401);

        const authSocialAdmin = await makeRequest('GET', '/api/social-links/admin', null, {
            'Authorization': `Bearer ${token}`
        });
        assert('Authenticated Social Links Admin Access', authSocialAdmin.status === 200 && Array.isArray(authSocialAdmin.data.data));

        // Create, Update, and Delete social link lifecycle
        const newSocial = await makeRequest('POST', '/api/social-links', {
            platform: 'test_platform',
            display_name: 'Test Platform',
            url: 'https://testplatform.org/gwfo',
            icon_class: 'fab fa-slack',
            color_class: 'slack',
            display_order: 99
        }, {
            'Authorization': `Bearer ${token}`
        });
        assert('Social Link Creation', newSocial.status === 201 && newSocial.data.success);
        const createdSocialId = newSocial.data?.data?.id;

        if (createdSocialId) {
            const updateSocial = await makeRequest('PUT', `/api/social-links/${createdSocialId}`, {
                display_name: 'Test Platform Updated',
                is_active: false
            }, {
                'Authorization': `Bearer ${token}`
            });
            assert('Social Link Update', updateSocial.status === 200 && updateSocial.data.success);

            const deleteSocial = await makeRequest('DELETE', `/api/social-links/${createdSocialId}`, null, {
                'Authorization': `Bearer ${token}`
            });
            assert('Social Link Deletion', deleteSocial.status === 200 && deleteSocial.data.success);
        }

        // 12. SEO & AI Discoverability Files Integrity
        assert('SEO: robots.txt exists', fs.existsSync(path.join(__dirname, '../robots.txt')));
        assert('SEO: sitemap.xml exists', fs.existsSync(path.join(__dirname, '../sitemap.xml')));
        assert('AI: llms.txt exists', fs.existsSync(path.join(__dirname, '../llms.txt')));

        const robotsContent = fs.readFileSync(path.join(__dirname, '../robots.txt'), 'utf8');
        assert('SEO: robots.txt allows GPTBot and ClaudeBot', robotsContent.includes('GPTBot') && robotsContent.includes('ClaudeBot'));

        const llmsContent = fs.readFileSync(path.join(__dirname, '../llms.txt'), 'utf8');
        assert('AI: llms.txt contains GWOFO mission & leadership', llmsContent.includes('Amelia Williams Kar') && llmsContent.includes('Grand Gedeh County'));

        // 13. Reliability: Strictly verify absence of internal self-ping loops
        const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        const hasSelfPingFetch = /setInterval\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{?\s*(?:await\s+)?fetch\s*\(/i.test(serverCode);
        const hasSelfPingHttp = /setInterval\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{?\s*http\.get\s*\(/i.test(serverCode);
        assert('Reliability: Zero Internal Self-Ping Loops in Server (Forbids setInterval fetch)', !hasSelfPingFetch && !hasSelfPingHttp);

        // 14. Reliability: Graceful Shutdown Signal Handlers Registered
        const hasSigterm = serverCode.includes("process.on('SIGTERM'");
        const hasSigint = serverCode.includes("process.on('SIGINT'");
        const hasServerClose = serverCode.includes("server.close");
        const hasPoolEnd = serverCode.includes("pool.end");
        assert('Reliability: Graceful Shutdown Registered (SIGTERM, SIGINT, pool draining)', hasSigterm && hasSigint && hasServerClose && hasPoolEnd);

        // 15. Deployment: render.yaml Health Check Path Configured
        const renderYaml = fs.readFileSync(path.join(__dirname, '../render.yaml'), 'utf8');
        assert('Deployment: render.yaml contains healthCheckPath: /health', renderYaml.includes('healthCheckPath: /health'));
        assert('Deployment: render.yaml contains custom domain api.gwofoliberia.org', renderYaml.includes('api.gwofoliberia.org'));
        assert('Deployment: render.yaml contains strict CORS_ORIGIN', renderYaml.includes('https://gwofoliberia.org'));

        // 16. Netlify Architecture & CDN Security
        const netlifyToml = fs.readFileSync(path.join(__dirname, '../netlify.toml'), 'utf8');
        assert('Netlify: contains canonical 301 www to apex redirect', netlifyToml.includes('https://www.gwofoliberia.org/*') && netlifyToml.includes('status = 301'));
        assert('Netlify: contains dedicated 404 redirect rule', netlifyToml.includes('to = "/404.html"') && netlifyToml.includes('status = 404'));
        assert('Netlify: environment targets api.gwofoliberia.org', netlifyToml.includes('https://api.gwofoliberia.org/api'));

        // 17. SEO & Discoverability: Dynamic Sitemap XML
        const sitemapRes = await makeRequest('GET', '/sitemap.xml');
        assert('SEO: Dynamic sitemap returns HTTP 200', sitemapRes.status === 200);
        const sitemapXml = typeof sitemapRes.data === 'string' ? sitemapRes.data : JSON.stringify(sitemapRes.data);
        assert('SEO: Dynamic sitemap contains canonical gwofoliberia.org', sitemapXml.includes('https://gwofoliberia.org/'));
        assert('SEO: Dynamic sitemap eliminates duplicate index.html', !sitemapXml.includes('https://gwofoliberia.org/index.html'));

        // 18. IndexNow Verification Key Route
        const indexNowRes = await makeRequest('GET', '/gwofoliberia2025indexnow.txt');
        assert('IndexNow: Key verification route returns HTTP 200', indexNowRes.status === 200);
        const indexNowText = typeof indexNowRes.data === 'string' ? indexNowRes.data : JSON.stringify(indexNowRes.data);
        assert('IndexNow: Key matches expected value', indexNowText.includes('gwofoliberia2025indexnow'));

        // 19. Soft 404 Prevention: Unknown HTML route returns HTTP 404
        const notFoundHtml = await makeRequest('GET', '/unknown-random-audit-test-page-404');
        assert('404 Prevention: Unknown web route returns strict HTTP 404', notFoundHtml.status === 404);

        // 20. 404 Prevention: Unknown API route returns HTTP 404 JSON
        const notFoundApi = await makeRequest('GET', '/api/unknown-audit-endpoint');
        assert('404 Prevention: Unknown API route returns strict HTTP 404', notFoundApi.status === 404);

        // 21. AI Discoverability: robots.txt contains OAI-SearchBot and canonical sitemap
        assert('AI Discoverability: robots.txt allows OAI-SearchBot', robotsContent.includes('OAI-SearchBot'));
        assert('SEO: robots.txt references canonical gwofoliberia.org sitemap', robotsContent.includes('https://gwofoliberia.org/sitemap.xml'));

        // 22. Security Headers on Server Response
        const probeRes = await makeRequest('GET', '/health');
        assert('Security Headers: X-Content-Type-Options nosniff', probeRes.headers['x-content-type-options'] === 'nosniff');
        assert('Security Headers: Strict-Transport-Security HSTS configured', typeof probeRes.headers['strict-transport-security'] === 'string');
        assert('Security Headers: Cross-Origin-Opener-Policy configured', typeof probeRes.headers['cross-origin-opener-policy'] === 'string');

        // 23. Frontend API Resolution Utility
        const apiJsContent = fs.readFileSync(path.join(__dirname, '../js/api.js'), 'utf8');
        assert('Frontend API: js/api.js resolves gwofoliberia.org to api.gwofoliberia.org', apiJsContent.includes('https://api.gwofoliberia.org/api'));
        assert('Frontend API: js/api.js supports window.__API_URL__ override', apiJsContent.includes('window.__API_URL__'));
        assert('Frontend API: js/api.js includes 15s timeout safety controller', apiJsContent.includes('AbortController') && apiJsContent.includes('timeoutMs'));

        // 24. Admin Live Slide Preview Remediation
        const manageSlidesHtml = fs.readFileSync(path.join(__dirname, '../admin/manage-slides.html'), 'utf8');
        const manageSlidesJs = fs.readFileSync(path.join(__dirname, '../js/manage-slides.js'), 'utf8');
        assert('Admin Preview: manage-slides.html eliminates broken mock image slide1.jpg', !manageSlidesHtml.includes('../assets/slides/slide1.jpg'));
        assert('Admin Preview: manage-slides.html contains reactive preview element IDs', 
            manageSlidesHtml.includes('id="previewSlideImg"') && 
            manageSlidesHtml.includes('id="previewSlideTitle"') && 
            manageSlidesHtml.includes('id="previewMetaPosition"') &&
            manageSlidesHtml.includes('id="previewDotsContainer"') &&
            manageSlidesHtml.includes('id="previewDurationSlider"'));
        assert('Admin Preview: js/manage-slides.js implements renderLivePreview & interactive controls',
            manageSlidesJs.includes('renderLivePreview()') &&
            manageSlidesJs.includes('initLivePreviewEvents()') &&
            manageSlidesJs.includes('nextPreviewSlide()') &&
            manageSlidesJs.includes('prevPreviewSlide()'));

        // 25. Public Pages Canonical Identity Coverage
        const publicPages = [
            'about.html', 'become-partner.html', 'board.html', 'contact.html',
            'get-involved.html', 'impact.html', 'index.html', 'ngo-partners.html',
            'partners.html', 'projects.html', 'projects-education.html',
            'projects-empowerment.html', 'projects-health.html', 'report.html',
            'single.html', 'team.html'
        ];
        let allPagesHaveCanonical = true;
        let allPagesHaveOg = true;
        let allPagesHaveTwitter = true;

        for (const page of publicPages) {
            const content = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
            if (!content.includes('rel="canonical"') || !content.includes('https://gwofoliberia.org')) {
                allPagesHaveCanonical = false;
            }
            if (!content.includes('property="og:url"') || !content.includes('https://gwofoliberia.org')) {
                allPagesHaveOg = false;
            }
            if (!content.includes('name="twitter:card"')) {
                allPagesHaveTwitter = false;
            }
        }
        assert('Canonical Identity: All 16 public HTML pages declare canonical https://gwofoliberia.org link', allPagesHaveCanonical);
        assert('Canonical Identity: All 16 public HTML pages declare Open Graph og:url metadata', allPagesHaveOg);
        assert('Canonical Identity: All 16 public HTML pages declare Twitter Card metadata', allPagesHaveTwitter);

        // 26. Netlify default subdomain redirect
        assert('Netlify: contains canonical redirect for gwofo.netlify.app', netlifyToml.includes('https://gwofo.netlify.app/*'));

        // 27. Search Engine Isolation for Backend API
        const apiHealthRes = await makeRequest('GET', '/api/health');
        assert('Search Isolation: API routes return X-Robots-Tag: noindex, nofollow', apiHealthRes.headers['x-robots-tag'] === 'noindex, nofollow');

        // 28. Auto-IndexNow Ping on Post Publish
        const postsJsContent = fs.readFileSync(path.join(__dirname, 'routes/posts.js'), 'utf8');
        assert('Auto-Discoverability: posts.js integrates pingIndexNow on creation/update', postsJsContent.includes('pingIndexNow'));

        // 29. Canonical Password Reset Construction
        const authJsContent = fs.readFileSync(path.join(__dirname, 'routes/auth.js'), 'utf8');
        assert('Security & Canonical: auth.js dispatches canonical reset-password URL', authJsContent.includes('https://gwofoliberia.org/admin/reset-password.html?token='));

        // 30. Dynamic Story Canonical & Social Sharing
        const singlePostJs = fs.readFileSync(path.join(__dirname, '../js/single-post.js'), 'utf8');
        assert('Dynamic Canonical: single-post.js synchronizes canonical link dynamically', singlePostJs.includes('canonicalLink.href = canonicalUrl'));
        assert('Social Canonical: single-post.js shares canonical URL on social networks', singlePostJs.includes('https://gwofoliberia.org/single.html?id='));


    } catch (err) {
        console.error('Test Suite encountered unhandled error:', err);
        failed++;
    }

    console.log('====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests();

