# GWOFO Deployment - Quick Start Guide

## 🚀 Overview

Your GWOFO project is now configured for cloud deployment:
- **Frontend:** Netlify (Static hosting)
- **Backend:** Render (Node.js application server)
- **Database:** Neon PostgreSQL (Cloud database)

## 📋 Pre-Deployment Checklist

- [ ] GitHub account with repository pushed (https://github.com/Nyonbeyer/gwofo)
- [ ] Neon PostgreSQL database created (https://console.neon.tech)
- [ ] Netlify account created (https://netlify.com)
- [ ] Render account created (https://render.com)

## ⚡ Quick Deploy Steps

### Step 1: Database Setup (5 minutes)

1. Go to https://console.neon.tech
2. Create a new project
3. Copy your connection string (format: `postgresql://...`)
4. Save it for Step 3

### Step 2: Backend Deployment on Render (10 minutes)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** and select your `gwofo` repository
4. Configure:
   - **Name:** `gwofo-backend`
   - **Environment:** `Node`
   - **Region:** `Oregon` (or closest to you)
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free tier available

5. Click **"Create Web Service"** (don't deploy yet)
6. Go to **"Environment"** tab and add variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | Paste your Neon connection string from Step 1 |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | Create a secure password |
   | `CORS_ORIGIN` | `*` (will update later) |

7. Click **"Deploy"** button at top

**Wait for deployment to complete** (2-5 minutes)

✅ Your backend URL: `https://gwofo-backend.onrender.com`

### Step 3: Frontend Deployment on Netlify (5 minutes)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"**
4. Authorize Netlify to access GitHub
5. Select your `gwofo` repository
6. Netlify will auto-detect `netlify.toml`:
   - **Build command:** (auto-detected)
   - **Publish directory:** `.` (auto-detected)
7. Click **"Deploy site"**

**Wait for deployment to complete** (1-2 minutes)

✅ Your frontend URL: `https://[your-site-name].netlify.app`

### Step 4: Verify Everything Works

1. **Test Backend API:**
   ```bash
   curl https://gwofo-backend.onrender.com/api/dashboard/summary
   ```
   Should return JSON with stats

2. **Test Frontend:**
   - Visit your Netlify URL
   - Open browser DevTools (F12)
   - Check Console tab
   - Go to Network tab and trigger an API call
   - Verify requests go to `https://gwofo-backend.onrender.com/api`

3. **Test Login:**
   - Go to `/admin/login.html`
   - Use credentials: `admin` / (your password from Step 2)
   - Should redirect to dashboard

## 🔧 After Deployment

### Update CORS in Render (Important!)
After frontend is deployed:

1. Go to Render dashboard → select `gwofo-backend` service
2. Go to **"Environment"** tab
3. Update `CORS_ORIGIN`:
   ```
   https://your-site-name.netlify.app
   ```
4. Click **"Save"**

### Set Up Custom Domain (Optional)

**For Frontend:**
1. In Netlify dashboard → **"Domain settings"**
2. Add your custom domain
3. Follow DNS setup instructions

**For Backend:**
1. In Render dashboard → **"Custom Domains"**
2. Add your custom domain

## 📚 Detailed Guides

For more information, see:
- [Backend Deployment (Render)](./server/RENDER_DEPLOYMENT.md)
- [Frontend Deployment (Netlify)](./NETLIFY_DEPLOYMENT.md)
- [Full Deployment Guide](./DEPLOYMENT.md)

## 🔑 Configuration Files

Your project includes:

| File | Purpose |
|------|---------|
| `netlify.toml` | Frontend deployment config |
| `render.yaml` | Backend deployment blueprint |
| `server/.env.example` | Backend env variables template |
| `js/api.js` | API client with auto URL detection |
| `server/server.js` | Backend server (Render-ready) |

## 🚨 Important Notes

### Security
- ✅ `.env` files excluded from Git (in `.gitignore`)
- ✅ Use Render/Netlify dashboard for sensitive variables
- ✅ Never commit passwords to repository
- ✅ Rotate credentials regularly

### Auto-Deployment
Both platforms auto-deploy on push to `main` branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Free Tier Limitations
- **Render Free:** Spins down after 15 minutes inactivity (5-30s startup)
- **Netlify Free:** 300 build minutes/month, unlimited deployments
- **Neon Free:** Limited compute/storage, generous for testing

## 💡 Pro Tips

1. **Speed Up Render Startup**
   - Use Render's paid tier to keep service warm
   - Or call API every 15 minutes

2. **Monitor Deployments**
   - Enable email notifications in Render/Netlify
   - Check logs regularly for errors

3. **Database Backups**
   - Neon provides automated backups
   - Set up point-in-time restore

4. **Performance**
   - Test on slow 3G via DevTools
   - Monitor Netlify analytics
   - Optimize images in assets/

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend 502 error | Check Render logs, verify DB connection |
| Frontend 404 | Netlify.toml redirect not working, clear cache |
| API 404 | Backend not deployed properly, check API route |
| CORS error | Update CORS_ORIGIN in Render environment |
| Database connect fail | Verify DATABASE_URL environment variable |

## 📞 Support Resources

- **Netlify:** https://docs.netlify.com
- **Render:** https://render.com/docs
- **Neon:** https://neon.tech/docs
- **Node.js:** https://nodejs.org/docs

---

**Ready to deploy?** Start with Step 1 above! 🎉

Questions? Check the detailed deployment guides or service documentation.
