# GWOFO Backend Deployment Instructions

## Quick Setup for Render Deployment

### 1. Prepare Your Code
The project is already configured for Render deployment. Key files:
- `render.yaml` - Deployment configuration
- `server/.env.example` - Environment variables template
- `server/server.js` - Express server (Port configured via `process.env.PORT`)

### 2. Prepare Neon PostgreSQL Database
1. Go to https://console.neon.tech
2. Create a new project
3. Copy your connection string (looks like: `postgresql://...`)
4. Keep this safe - you'll need it for Render environment variables

### 3. Deploy on Render

**Option A: Using render.yaml (Recommended)**
1. Go to https://render.com
2. Click "New +" → "Blueprint"
3. Select your GitHub repository
4. Render will automatically detect `render.yaml`
5. Add environment variables:
   - `DATABASE_URL`: Your Neon connection string
   - `ADMIN_PASSWORD`: Set a secure password
6. Click "Create"

**Option B: Manual Web Service**
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Set build command: `npm install` (in server folder)
5. Set start command: `node server.js`
6. Add environment variables (see below)
7. Click "Create Web Service"

### 4. Add Environment Variables in Render

In your Render service dashboard, go to "Environment" and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | Your secure password |
| `CORS_ORIGIN` | `https://your-netlify-domain.netlify.app` |

### 5. Test Your Deployment

Once deployed, test the API:
```bash
curl https://gwofo-backend.onrender.com/api/dashboard/summary
```

You should get a JSON response. If you get an error, check the logs in Render dashboard.

### 6. Update Frontend

Update the frontend API URL if needed (it should auto-detect):
- Local: `http://localhost:3000/api`
- Production: `https://gwofo-backend.onrender.com/api`

## Troubleshooting

### Build Fails
- Check that `server/package.json` exists
- Verify all npm dependencies are listed
- Check Render logs for specific errors

### Database Connection Fails
- Verify `DATABASE_URL` environment variable is set correctly
- Ensure Neon database is accessible
- Check database credentials

### CORS Errors on Frontend
- Add frontend URL to `CORS_ORIGIN` environment variable
- Or allow all origins with `CORS_ORIGIN=*` (not recommended for production)

### Port Already in Use
- Render assigns `PORT` environment variable
- Server should use `process.env.PORT || 3000`
- Current server.js already does this

## Auto-Redeployment

Render will automatically redeploy when you push to the `main` branch on GitHub.

To update:
```bash
git add .
git commit -m "Update: your message"
git push origin main
```

## Environment Variables Reference

See `server/.env.example` for all available configuration options.

### Required (for production)
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to `production`

### Optional
- `ADMIN_USERNAME` - Admin login username (default: admin)
- `ADMIN_PASSWORD` - Admin login password (default: password)
- `CORS_ORIGIN` - Allowed CORS origin (default: * for all)
- `LOG_LEVEL` - Logging level: info, debug, error, warn
- `BACKUP_ENABLED` - Enable automatic backups (default: true)

## Security Notes

⚠️ **Important:** Never commit `.env` file to GitHub!
- `.env` is in `.gitignore`
- Always use Render's Environment variables for sensitive data
- Use strong passwords for production
- Rotate admin credentials regularly

## Support

- **Render Documentation:** https://render.com/docs
- **Neon Documentation:** https://neon.tech/docs
- **Express.js Documentation:** https://expressjs.com
