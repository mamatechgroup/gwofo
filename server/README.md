# GWOFO Admin Dashboard - Node.js Server

Complete Node.js/Express backend for the GWOFO NGO admin dashboard with PostgreSQL database integration.

## Project Structure

```
server/
├── server.js              # Main Express application
├── package.json           # NPM dependencies
├── .env.example          # Environment variables template
├── config/
│   └── database.js       # PostgreSQL connection pool
├── database/
│   └── schema.sql        # Database schema migrations
└── routes/
    ├── auth.js           # Authentication endpoints
    ├── posts.js          # Blog posts CRUD
    ├── projects.js       # Projects CRUD
    ├── team.js           # Team members CRUD
    ├── partners.js       # Partners CRUD
    ├── slides.js         # Homepage slides CRUD
    └── dashboard.js      # Dashboard statistics
```

## Database Schema

### Tables (6 entities + utilities)

**admin_users**
- id, username (unique), email (unique), password_hash, role, timestamps

**posts**
- id, title, slug, excerpt, content, category, author_id, author_name, status, featured_image, tags, views_count, published_date, timestamps

**projects**
- id, name, slug, description, category, status, location, goal_amount, funding_received, progress_percentage (0-100), start_date, end_date, manager_id, manager_name, image, timestamps

**team_members**
- id, first_name, last_name, email (unique), phone, position, department, bio, profile_image, linkedin_url, twitter_url, facebook_url, join_date, status, projects_count, years_in_organization, active_percentage, timestamps

**partners**
- id, name, slug, type, level (platinum/gold/silver/bronze), contact_person, email, phone, website, description, logo_url, agreement_file, start_date, end_date, funding_amount, status, timestamps

**slides**
- id, title, subtitle, description, position (1-6), status, image_url, button_text, button_link, text_color, overlay_opacity (0-100), overlay_enabled, button_enabled, display_duration (3-10s), timestamps

**dashboard_stats** - Aggregated statistics cache
**activity_logs** - User action audit trail

## Setup Instructions

### 1. Prerequisites

- Node.js 14+
- PostgreSQL 12+ (or Neon PostgreSQL connection)
- npm or yarn

### 2. Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your database URL if different
nano .env
```

### 3. Database Setup

```bash
# Create tables and schema
psql -U neondb_owner -d gwofo_db -f database/schema.sql

# Or using npm script
npm run db:setup
```

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user
- `POST /api/auth/verify` - Verify token

### Posts (`/api/posts`)
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/category/:category` - Filter by category
- `GET /api/posts/status/:status` - Filter by status
- `GET /api/posts/recent/:limit` - Get recent posts

### Projects (`/api/projects`)
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PATCH /api/projects/:id/progress` - Update progress
- `GET /api/projects/status/:status` - Filter by status
- `GET /api/projects/category/:category` - Filter by category
- `GET /api/projects/recent/:limit` - Get recent projects

### Team Members (`/api/team`)
- `GET /api/team` - List all team members
- `GET /api/team/:id` - Get single member
- `POST /api/team` - Create member
- `PUT /api/team/:id` - Update member
- `DELETE /api/team/:id` - Delete member
- `GET /api/team/department/:department` - Filter by department
- `GET /api/team/status/:status` - Filter by status
- `GET /api/team/stats/summary` - Team statistics

### Partners (`/api/partners`)
- `GET /api/partners` - List all partners
- `GET /api/partners/:id` - Get single partner
- `POST /api/partners` - Create partner
- `PUT /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner
- `GET /api/partners/type/:type` - Filter by type
- `GET /api/partners/level/:level` - Filter by level (platinum/gold/silver/bronze)
- `GET /api/partners/status/:status` - Filter by status
- `GET /api/partners/stats/summary` - Partner statistics

### Slides (`/api/slides`)
- `GET /api/slides` - List all slides
- `GET /api/slides/:id` - Get single slide
- `POST /api/slides` - Create slide
- `PUT /api/slides/:id` - Update slide
- `DELETE /api/slides/:id` - Delete slide
- `PATCH /api/slides/:id/position` - Update position
- `GET /api/slides/position/:position` - Get slide by position
- `GET /api/slides/status/active` - Get active slides

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/dashboard/summary` - Complete dashboard summary
- `GET /api/dashboard/posts-stats` - Posts statistics
- `GET /api/dashboard/projects-stats` - Projects statistics
- `GET /api/dashboard/team-stats` - Team statistics
- `GET /api/dashboard/partners-stats` - Partners statistics
- `GET /api/dashboard/recent-activity` - Recent activity logs
- `POST /api/dashboard/log-activity` - Log user activity

## Integration with Frontend

### Update admin.js

Replace mockData calls with API endpoints:

```javascript
// Before: Using mockData
const data = mockData;

// After: Using API
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/summary');
        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}
```

### CRUD Example

```javascript
// Create post
async function createPost(postData) {
    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
    });
    return response.json();
}

// Update post
async function updatePost(id, postData) {
    const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
    });
    return response.json();
}

// Delete post
async function deletePost(id) {
    const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}
```

## Features

✅ Full CRUD operations for all entities
✅ PostgreSQL with Neon cloud database
✅ Connection pooling for performance
✅ Error handling middleware
✅ CORS enabled for frontend requests
✅ Dashboard statistics aggregation
✅ Activity logging system
✅ Status filtering and sorting
✅ Progress tracking for projects
✅ Team member categorization
✅ Partner tier management

## Future Enhancements

- [ ] JWT authentication with tokens
- [ ] Password hashing with bcrypt
- [ ] File upload handling (multer)
- [ ] Input validation (joi/yup)
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Database backups
- [ ] Caching layer (Redis)
- [ ] Request logging
- [ ] Email notifications

## Deployment

### Heroku
```bash
git push heroku main
```

### Environment Variables Required
```
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
```

## Troubleshooting

### Connection Errors
- Verify DATABASE_URL is correct
- Check Neon database is accessible
- Ensure firewall allows outbound connections

### Port Already in Use
```bash
# Change port in .env
PORT=5000
```

### Database Schema Not Found
```bash
npm run db:setup
```

## Support

For issues or questions, contact GWOFO development team.

## License

MIT
