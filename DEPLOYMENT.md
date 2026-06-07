# GWOFO Deployment Guide

This project is configured to deploy on **Netlify** (frontend) and **Render** (backend).

## Backend Deployment (Render)

### Prerequisites
- Render account (https://render.com)
- PostgreSQL database (Neon PostgreSQL recommended)

### Steps to Deploy Backend

1. **Push code to GitHub** (already done)

2. **Create Render Account**
   - Go to https://render.com and sign up
   - Connect your GitHub account

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository (gwofo)
   - Configure:
     - **Name:** `gwofo-backend`
     - **Environment:** `Node`
     - **Build Command:** `npm install` (in server folder)
     - **Start Command:** `node server.js`
     - **Port:** 10000

4. **Add Environment Variables**
   - In Render dashboard, go to Environment variables
   - Add:
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `ADMIN_USERNAME`: `admin`
     - `ADMIN_PASSWORD`: `password` (or your secure password)

5. **Deploy**
   - Click "Deploy"
   - Render will automatically deploy when you push to main branch
   - Your API will be available at: `https://gwofo-backend.onrender.com/api`

### Verify Backend is Running
```bash
curl https://gwofo-backend.onrender.com/api/dashboard/summary
```

---

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account (https://netlify.com)
- GitHub repository with project code

### Steps to Deploy Frontend

1. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select repository: `gwofo`

2. **Configure Build Settings**
   - **Build command:** (leave empty - no build step needed)
   - **Publish directory:** `.` (root directory)
   - These are already configured in `netlify.toml`

3. **Environment Variables (Optional)**
   - Add `REACT_APP_API_URL`: `https://gwofo-backend.onrender.com/api`
   - Already configured in `netlify.toml` for production

4. **Deploy**
   - Click "Deploy"
   - Netlify will build and deploy automatically
   - Your site will be available at: `https://[your-site-name].netlify.app`

5. **Configure Custom Domain (Optional)**
   - Go to Domain settings
   - Add your custom domain if you have one

### Verify Frontend is Running
- Visit your Netlify URL
- Open browser console (F12) and check that API calls are going to `https://gwofo-backend.onrender.com/api`

---

## Configuration Files

### `netlify.toml` (Frontend)
- Handles SPA routing (all requests go to index.html)
- Sets API URL to Render backend
- Located in project root

### `render.yaml` (Backend)
- Defines Render deployment configuration
- Sets up web service with Node.js environment
- Located in project root

### `.env.example` (Backend)
- Template for environment variables
- Copy to `.env` and fill in actual values
- Located in `server/` folder

---

## CORS Configuration

The backend is configured with CORS enabled for all origins in production. If you want to restrict it:

Edit `server/server.js` and update:
```javascript
app.use(cors({
  origin: ['https://your-netlify-domain.netlify.app', 'https://your-custom-domain.com'],
  credentials: true
}));
```

---

## Database Setup

1. Create a Neon PostgreSQL database at https://console.neon.tech
2. Copy your connection string
3. Add it to Render environment variables as `DATABASE_URL`
4. Database tables will be created automatically on first server startup

---

## Monitoring & Logs

### Render Backend Logs
- Go to Render dashboard → Select service → "Logs" tab
- View real-time server logs

### Netlify Frontend Logs
- Go to Netlify dashboard → Select site → "Deploys" tab
- Click on a deploy to see build logs

---

## Troubleshooting

### "API Connection Failed" on Frontend
- Check that backend URL is correct in `js/api.js`
- Verify Render backend is running (check Render dashboard)
- Check browser console for CORS errors

### Backend 404 Errors
- Verify all routes are properly registered in `server/server.js`
- Check that database tables exist (should auto-create on startup)

### Database Connection Issues
- Verify `DATABASE_URL` environment variable is set in Render
- Check connection string format
- Ensure Neon database credentials are correct

---

## Auto-Deploy

Both Netlify and Render are configured to automatically deploy when you push to the `main` branch on GitHub.

Push updates with:
```bash
git add .
git commit -m "Your message"
git push origin main
```

---

## Support

For issues:
- **Render:** https://render.com/docs
- **Netlify:** https://docs.netlify.com
- **Neon:** https://neon.tech/docs
