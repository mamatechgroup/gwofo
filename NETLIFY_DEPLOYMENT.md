# GWOFO Frontend Deployment on Netlify

## Quick Setup

The frontend is configured to auto-detect the API URL based on the deployment environment:
- **Local Development:** `http://localhost:3000/api`
- **Production (Netlify):** `https://gwofo-backend.onrender.com/api`

## Deployment Steps

### 1. Prepare Your Code
All necessary configuration files are included:
- `netlify.toml` - Netlify configuration with redirects for SPA
- `js/api.js` - API client with environment-based URL detection

### 2. Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Authorize Netlify to access your GitHub account
5. Select your `gwofo` repository

### 3. Configure Build Settings

Netlify will auto-detect `netlify.toml` settings:
- **Build command:** (empty - no build step needed)
- **Publish directory:** `.` (root directory)

These are already configured in the `netlify.toml` file.

### 4. Deploy

Click "Deploy site"

Netlify will:
- Clone your repository
- Build your site (minimal - just static files)
- Deploy to their CDN
- Provide you with a URL like: `https://[your-site-name].netlify.app`

### 5. Verify Deployment

1. Visit your Netlify URL
2. Open browser DevTools (F12 → Console tab)
3. Verify that API calls show correct backend URL
4. Test basic functionality

## Environment-Based API URL

The frontend automatically selects the correct API URL:

```javascript
// In js/api.js
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    
    // Production (Netlify)
    if (hostname.includes('netlify.app')) {
        return 'https://gwofo-backend.onrender.com/api';
    }
    
    // Local development
    return 'http://localhost:3000/api';
})();
```

### Customization

If you deploy to a custom domain, update the logic in `js/api.js`:

```javascript
if (hostname === 'your-domain.com' || hostname === 'www.your-domain.com') {
    return 'https://gwofo-backend.onrender.com/api';
}
```

## Custom Domain Setup

1. Go to your Netlify site dashboard
2. Click "Domain settings"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (usually 5-48 hours)

## Redirects for Single Page App

`netlify.toml` includes a redirect rule to handle SPA routing:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures all requests go to `index.html` for client-side routing.

## Build Optimization

### No Build Step
- Static HTML/CSS/JS files - no build process needed
- Netlify serves files directly from root directory
- Faster deployments

### Asset Optimization
- Consider minifying CSS/JS in `css/` and `js/` folders
- Optimize images in `assets/images/`
- Use `netlify.toml` to add cache headers

## Continuous Deployment

Auto-deployment is enabled by default:

1. Push changes to `main` branch
2. GitHub notifies Netlify
3. Netlify automatically deploys
4. Your site updates within seconds

### Deployment Command
```bash
git add .
git commit -m "Your message"
git push origin main
```

## Environment Variables (Optional)

Add variables in Netlify dashboard → Site settings → Build & deploy → Environment:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://gwofo-backend.onrender.com/api` |

These are already configured in `netlify.toml` for different contexts (production, preview, branch-deploy).

## Troubleshooting

### Site shows 404 after deployment
- Make sure `netlify.toml` exists in root directory
- Verify the `publish` directory is set to `.`
- Check that all HTML files are in root directory

### "Cannot GET /admin/dashboard"
- This is expected - use the correct page name
- SPA routing redirects to index.html automatically
- Check browser console for JavaScript errors

### API calls failing
- Open DevTools → Console tab
- Check the API URL being used
- Verify backend is running on Render
- Check for CORS errors

### Styles not loading
- Make sure CSS files are in `css/` directory
- Verify relative paths are correct
- Check browser DevTools → Network tab for 404s

## Performance Tips

1. **Minimize CSS/JS** - Reduce file sizes
2. **Optimize Images** - Compress in `assets/images/`
3. **Cache Headers** - Configure in `netlify.toml`
4. **CDN Usage** - Netlify automatically uses their CDN

## Security

- ✅ HTTPS enabled by default (Netlify provides SSL)
- ✅ Static content is safe
- ⚠️ Never expose API keys in frontend code
- ⚠️ Keep sensitive configuration in backend environment variables

## Monitoring

### Netlify Dashboard
- Go to your site dashboard
- Check "Deploys" tab for deployment history
- View "Analytics" for traffic/performance data
- Check "Functions" logs if using serverless functions

### Analytics
- Netlify provides basic analytics
- Consider adding Google Analytics for detailed insights
- Monitor API calls from browser console

## Support

- **Netlify Docs:** https://docs.netlify.com
- **Netlify Community:** https://community.netlify.com
- **Build & Deploy Issues:** Check deployment logs in Netlify dashboard

## Next Steps

1. ✅ Deploy frontend on Netlify
2. ✅ Deploy backend on Render
3. ✅ Verify API connectivity
4. ✅ Test all features
5. ✅ Set up custom domain (optional)
6. ✅ Monitor performance
7. ✅ Plan backup strategy
