-- PostgreSQL Schema for GWOFO Admin Dashboard & Public Platform

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'active',
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts/Blog Articles Table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    category VARCHAR(50),
    author_id INTEGER REFERENCES admin_users(id),
    author_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    featured_image TEXT,
    author_image TEXT,
    tags VARCHAR(255),
    views_count INTEGER DEFAULT 0,
    published_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'planning',
    location VARCHAR(255),
    goal_amount DECIMAL(12, 2),
    funding_received DECIMAL(12, 2) DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    manager_id INTEGER REFERENCES admin_users(id),
    manager_name VARCHAR(100),
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    bio TEXT,
    profile_image TEXT,
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    facebook_url VARCHAR(255),
    join_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    projects_count INTEGER DEFAULT 0,
    years_in_organization INTEGER DEFAULT 0,
    active_percentage INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partners Table
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    type VARCHAR(50),
    level VARCHAR(50) DEFAULT 'bronze',
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    agreement_file VARCHAR(255),
    start_date DATE,
    end_date DATE,
    funding_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homepage Slides Table
CREATE TABLE IF NOT EXISTS slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT NOT NULL,
    position INTEGER UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    image_url TEXT,
    button_text VARCHAR(100),
    button_link VARCHAR(255),
    text_color VARCHAR(20) DEFAULT '#ffffff',
    overlay_opacity INTEGER DEFAULT 30,
    overlay_enabled BOOLEAN DEFAULT true,
    button_enabled BOOLEAN DEFAULT true,
    display_duration INTEGER DEFAULT 5,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    subscribe_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribe_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Comments Table
CREATE TABLE IF NOT EXISTS project_comments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_date TIMESTAMP,
    approved_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_date TIMESTAMP,
    approved_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Inquiries Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partnership Inquiries Table
CREATE TABLE IF NOT EXISTS partnership_inquiries (
    id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100) NOT NULL,
    organization_size VARCHAR(50),
    contact_name VARCHAR(100) NOT NULL,
    contact_title VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    interest VARCHAR(100),
    partnership_type VARCHAR(100),
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer Applications Table
CREATE TABLE IF NOT EXISTS volunteer_applications (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(100) NOT NULL,
    volunteer_type VARCHAR(50) NOT NULL,
    skills TEXT NOT NULL,
    availability TEXT,
    motivation TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard Statistics Table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id SERIAL PRIMARY KEY,
    total_posts INTEGER DEFAULT 0,
    total_projects INTEGER DEFAULT 3,
    total_team_members INTEGER DEFAULT 5,
    total_partners INTEGER DEFAULT 3,
    total_visitors INTEGER DEFAULT 0,
    total_beneficiaries INTEGER DEFAULT 30,
    volunteers_trained INTEGER DEFAULT 20,
    counties_reached INTEGER DEFAULT 2,
    funding_mobilized DECIMAL(12, 2) DEFAULT 146481.93,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_team_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_partners_level ON partners(level);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_slides_position ON slides(position);
CREATE INDEX IF NOT EXISTS idx_slides_status ON slides(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_comments_project ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON project_comments(status);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_status ON post_comments(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partnership_status ON partnership_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partnership_created ON partnership_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_created ON volunteer_applications(created_at DESC);

-- Social Links Table
CREATE TABLE IF NOT EXISTS social_links (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    icon_class VARCHAR(50) NOT NULL,
    color_class VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_links_order ON social_links(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_social_links_active ON social_links(is_active);

-- Insert default admin user if not exists
INSERT INTO admin_users (username, email, password_hash, role, status)
VALUES ('admin', 'admin@gwofo.org', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insert default dashboard stats if not exists
INSERT INTO dashboard_stats (id, total_posts, total_projects, total_team_members, total_partners, total_beneficiaries, volunteers_trained, counties_reached, funding_mobilized)
VALUES (1, 2, 3, 5, 3, 30, 20, 2, 146481.93)
ON CONFLICT (id) DO NOTHING;

-- Insert default social media links if not exists
INSERT INTO social_links (platform, display_name, url, icon_class, color_class, is_active, display_order)
VALUES 
    ('facebook', 'Facebook', 'https://facebook.com/gwofoliberia', 'fab fa-facebook-f', 'facebook', true, 1),
    ('twitter', 'Twitter', 'https://twitter.com/gwofoliberia', 'fab fa-twitter', 'twitter', true, 2),
    ('instagram', 'Instagram', 'https://instagram.com/gwofoliberia', 'fab fa-instagram', 'instagram', true, 3),
    ('linkedin', 'LinkedIn', 'https://linkedin.com/company/gwofoliberia', 'fab fa-linkedin-in', 'linkedin', true, 4),
    ('youtube', 'YouTube', 'https://youtube.com/@gwofoliberia', 'fab fa-youtube', 'youtube', true, 5),
    ('whatsapp', 'WhatsApp', 'https://wa.me/231888880698', 'fab fa-whatsapp', 'whatsapp', true, 6)
ON CONFLICT (platform) DO NOTHING;

