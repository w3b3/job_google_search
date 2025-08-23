-- Job Search Application SQLite Database Schema

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table with Google OAuth authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    google_id TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    account_type TEXT DEFAULT 'free' CHECK (account_type IN ('free', 'paid', 'admin')),
    searches_used_this_month INTEGER DEFAULT 0,
    search_limit INTEGER DEFAULT 2, -- 2 for free, -1 for unlimited
    billing_cycle_start DATE DEFAULT (date('now', 'start of month')),
    google_api_key_encrypted TEXT,
    google_cse_id_encrypted TEXT,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Search configurations (supports both legacy and strict search types)
CREATE TABLE IF NOT EXISTS searches (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Legacy search fields (for backward compatibility)
    job_query TEXT, -- NULL for strict searches
    keywords TEXT, -- JSON array as TEXT, NULL for strict searches
    
    -- Strict search fields (new)
    search_type TEXT DEFAULT 'legacy' CHECK (search_type IN ('legacy', 'strict')),
    position TEXT, -- JSON array for strict searches
    location TEXT, -- JSON array for strict searches  
    technology TEXT, -- JSON array for strict searches
    domain TEXT, -- JSON array for strict searches
    
    -- Common fields
    ats_platforms TEXT NOT NULL, -- JSON array as TEXT
    config TEXT NOT NULL, -- JSON configuration object
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    
    -- Statistics
    total_results INTEGER DEFAULT 0,
    total_scraped INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    
    -- Constraints to ensure proper data based on search type
    CHECK (
        (search_type = 'legacy' AND job_query IS NOT NULL AND keywords IS NOT NULL) OR
        (search_type = 'strict' AND position IS NOT NULL AND location IS NOT NULL)
    )
);

-- Job results
CREATE TABLE IF NOT EXISTS job_results (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    search_id TEXT NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    ats_source TEXT NOT NULL,
    keywords_matched TEXT NOT NULL, -- JSON array as TEXT
    match_count INTEGER NOT NULL,
    is_match BOOLEAN DEFAULT 0, -- Whether this job matches keyword criteria
    scraped_content TEXT,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    company_name TEXT,
    location TEXT,
    job_type TEXT,
    
    UNIQUE(search_id, link) -- Prevent duplicate results per search
);

-- Search progress tracking (for real-time updates)
CREATE TABLE IF NOT EXISTS search_progress (
    search_id TEXT PRIMARY KEY REFERENCES searches(id) ON DELETE CASCADE,
    current_platform TEXT,
    platforms_completed INTEGER DEFAULT 0,
    total_platforms INTEGER DEFAULT 0,
    current_result INTEGER DEFAULT 0,
    total_results INTEGER DEFAULT 0,
    progress_percentage REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User favorites (for future feature)
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    job_result_id TEXT REFERENCES job_results(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    PRIMARY KEY (user_id, job_result_id)
);

-- =============================================================================
-- SAVED RESULTS FEATURE SCHEMA
-- =============================================================================

-- Saved result collections (curated lists of job results)
CREATE TABLE IF NOT EXISTS saved_result_collections (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    search_id TEXT REFERENCES searches(id) ON DELETE SET NULL, -- Optional reference to original search
    
    -- Collection metadata
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT, -- JSON array of tags for categorization
    color_theme TEXT DEFAULT '#3b82f6', -- Hex color for UI theming
    
    -- Collection settings
    is_public BOOLEAN DEFAULT FALSE, -- Allow sharing collections
    is_archived BOOLEAN DEFAULT FALSE,
    auto_update BOOLEAN DEFAULT FALSE, -- Auto-add new results from similar searches
    
    -- Statistics (computed/cached for performance)
    total_jobs INTEGER DEFAULT 0,
    total_companies INTEGER DEFAULT 0,
    avg_match_score REAL DEFAULT 0,
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual saved results (many-to-many relationship)
CREATE TABLE IF NOT EXISTS saved_results (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    collection_id TEXT NOT NULL REFERENCES saved_result_collections(id) ON DELETE CASCADE,
    job_result_id TEXT NOT NULL REFERENCES job_results(id) ON DELETE CASCADE,
    
    -- User annotations and tracking
    user_notes TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- 1-5 star rating
    application_status TEXT DEFAULT 'not_applied' CHECK (
        application_status IN ('not_applied', 'applied', 'interviewing', 'rejected', 'offered', 'accepted', 'withdrawn')
    ),
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    
    -- Application tracking
    application_date DATETIME,
    follow_up_date DATETIME,
    interview_date DATETIME,
    salary_offered INTEGER,
    
    -- Custom tags for this specific result
    custom_tags TEXT, -- JSON array
    
    -- Tracking
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    
    UNIQUE(collection_id, job_result_id) -- Prevent duplicates in same collection
);

-- Saved result exports (track export history and provide download links)
CREATE TABLE IF NOT EXISTS saved_result_exports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    collection_id TEXT NOT NULL REFERENCES saved_result_collections(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Export configuration
    export_format TEXT NOT NULL CHECK (export_format IN ('csv', 'json', 'pdf', 'xlsx', 'docx')),
    export_filters TEXT, -- JSON object with applied filters
    include_notes BOOLEAN DEFAULT TRUE,
    include_ratings BOOLEAN DEFAULT TRUE,
    include_status BOOLEAN DEFAULT TRUE,
    
    -- Export results
    total_records INTEGER NOT NULL,
    file_size_bytes INTEGER,
    processing_status TEXT DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed')
    ),
    
    -- File storage
    file_path TEXT,
    download_url TEXT,
    download_count INTEGER DEFAULT 0,
    expires_at DATETIME, -- For temporary download links
    
    -- Error handling
    error_message TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Collection sharing (for public/shared collections)
CREATE TABLE IF NOT EXISTS collection_shares (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    collection_id TEXT NOT NULL REFERENCES saved_result_collections(id) ON DELETE CASCADE,
    shared_by_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sharing configuration
    share_token TEXT UNIQUE NOT NULL, -- UUID for public access
    share_name TEXT, -- Custom name for the shared collection
    access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit')),
    
    -- Security
    password_protected BOOLEAN DEFAULT FALSE,
    password_hash TEXT, -- For password-protected shares
    allowed_domains TEXT, -- JSON array of allowed email domains
    
    -- Access tracking
    view_count INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    last_accessed_at DATETIME,
    
    -- Expiration and status
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Collection templates (predefined collection types and workflows)
CREATE TABLE IF NOT EXISTS collection_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'job_hunting', 'research', 'competitive_analysis', etc.
    icon TEXT DEFAULT '📋', -- Emoji or icon identifier
    
    -- Template configuration
    default_name_pattern TEXT, -- e.g., "Job Search - {date}"
    default_tags TEXT, -- JSON array
    default_color_theme TEXT DEFAULT '#3b82f6',
    suggested_fields TEXT, -- JSON array of recommended custom fields
    auto_rules TEXT, -- JSON object with auto-categorization rules
    
    -- Template settings
    is_system_template BOOLEAN DEFAULT FALSE, -- Built-in vs user-created
    is_public BOOLEAN DEFAULT FALSE, -- Available to all users
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auto-save rules (automatically save results matching criteria)
CREATE TABLE IF NOT EXISTS auto_save_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    collection_id TEXT NOT NULL REFERENCES saved_result_collections(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Rule configuration
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Matching criteria (JSON object)
    keyword_filters TEXT, -- Keywords that must be present
    company_filters TEXT, -- Company names or patterns
    location_filters TEXT, -- Location requirements
    salary_min INTEGER,
    salary_max INTEGER,
    min_match_score INTEGER, -- Minimum keyword match count
    ats_source_filters TEXT, -- JSON array of ATS sources
    
    -- Action configuration
    auto_priority TEXT DEFAULT 'medium' CHECK (auto_priority IN ('low', 'medium', 'high', 'urgent')),
    auto_tags TEXT, -- JSON array of tags to apply
    auto_notes TEXT, -- Template for auto-generated notes
    
    -- Statistics
    matches_count INTEGER DEFAULT 0,
    last_matched_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS user_usage_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('search_executed', 'search_created', 'results_exported')),
    resource_id TEXT, -- search_id, export_id, etc.
    metadata TEXT, -- JSON with additional context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON user_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON user_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON user_usage_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_job_results_search_id ON job_results(search_id);
CREATE INDEX IF NOT EXISTS idx_job_results_scraped_at ON job_results(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_results_match_count ON job_results(match_count DESC);
CREATE INDEX IF NOT EXISTS idx_job_results_ats_source ON job_results(ats_source);

-- Saved results indexes
CREATE INDEX IF NOT EXISTS idx_saved_collections_user_id ON saved_result_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_collections_created_at ON saved_result_collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_collections_updated_at ON saved_result_collections(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_collections_is_public ON saved_result_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_saved_collections_is_archived ON saved_result_collections(is_archived);

CREATE INDEX IF NOT EXISTS idx_saved_results_collection_id ON saved_results(collection_id);
CREATE INDEX IF NOT EXISTS idx_saved_results_job_result_id ON saved_results(job_result_id);
CREATE INDEX IF NOT EXISTS idx_saved_results_application_status ON saved_results(application_status);
CREATE INDEX IF NOT EXISTS idx_saved_results_priority_level ON saved_results(priority_level);
CREATE INDEX IF NOT EXISTS idx_saved_results_added_at ON saved_results(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_results_user_rating ON saved_results(user_rating);

CREATE INDEX IF NOT EXISTS idx_saved_exports_collection_id ON saved_result_exports(collection_id);
CREATE INDEX IF NOT EXISTS idx_saved_exports_user_id ON saved_result_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_exports_created_at ON saved_result_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_exports_status ON saved_result_exports(processing_status);

CREATE INDEX IF NOT EXISTS idx_collection_shares_token ON collection_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_collection_shares_collection_id ON collection_shares(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_shares_active ON collection_shares(is_active);

CREATE INDEX IF NOT EXISTS idx_auto_save_rules_collection_id ON auto_save_rules(collection_id);
CREATE INDEX IF NOT EXISTS idx_auto_save_rules_user_id ON auto_save_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_save_rules_active ON auto_save_rules(is_active);

-- Full text search index for job content (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS job_results_fts USING fts5(
    title, 
    scraped_content, 
    content='job_results', 
    content_rowid='rowid'
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS job_results_fts_insert AFTER INSERT ON job_results BEGIN
    INSERT INTO job_results_fts(rowid, title, scraped_content) 
    VALUES (new.rowid, new.title, new.scraped_content);
END;

CREATE TRIGGER IF NOT EXISTS job_results_fts_delete AFTER DELETE ON job_results BEGIN
    INSERT INTO job_results_fts(job_results_fts, rowid, title, scraped_content) 
    VALUES('delete', old.rowid, old.title, old.scraped_content);
END;

CREATE TRIGGER IF NOT EXISTS job_results_fts_update AFTER UPDATE ON job_results BEGIN
    INSERT INTO job_results_fts(job_results_fts, rowid, title, scraped_content) 
    VALUES('delete', old.rowid, old.title, old.scraped_content);
    INSERT INTO job_results_fts(rowid, title, scraped_content) 
    VALUES (new.rowid, new.title, new.scraped_content);
END;

-- Search analytics view
CREATE VIEW IF NOT EXISTS search_analytics AS
SELECT 
    s.id,
    s.name,
    s.status,
    s.created_at,
    s.completed_at,
    s.total_results,
    s.total_scraped,
    s.total_matches,
    CASE 
        WHEN s.total_scraped > 0 
        THEN ROUND((CAST(s.total_matches AS REAL) / s.total_scraped * 100), 2)
        ELSE 0 
    END as match_rate_percentage,
    CASE 
        WHEN s.completed_at IS NOT NULL AND s.started_at IS NOT NULL 
        THEN (julianday(s.completed_at) - julianday(s.started_at)) * 86400
        ELSE NULL 
    END as duration_seconds,
    json_array_length(s.ats_platforms) as platforms_count,
    json_array_length(s.keywords) as keywords_count
FROM searches s;

-- Collection summary view with computed statistics
CREATE VIEW IF NOT EXISTS collection_summary AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.tags,
    c.color_theme,
    c.is_public,
    c.is_archived,
    c.created_at,
    c.updated_at,
    c.last_accessed_at,
    
    -- Computed statistics
    COUNT(sr.id) as actual_job_count,
    COUNT(DISTINCT jr.ats_source) as unique_ats_sources,
    COUNT(DISTINCT jr.company_name) as unique_companies,
    AVG(sr.user_rating) as avg_user_rating,
    AVG(jr.match_count) as avg_match_score,
    
    -- Application statistics
    COUNT(CASE WHEN sr.application_status = 'applied' THEN 1 END) as applied_count,
    COUNT(CASE WHEN sr.application_status = 'interviewing' THEN 1 END) as interviewing_count,
    COUNT(CASE WHEN sr.application_status = 'offered' THEN 1 END) as offered_count,
    COUNT(CASE WHEN sr.application_status = 'accepted' THEN 1 END) as accepted_count,
    
    -- Priority distribution
    COUNT(CASE WHEN sr.priority_level = 'urgent' THEN 1 END) as urgent_count,
    COUNT(CASE WHEN sr.priority_level = 'high' THEN 1 END) as high_priority_count
    
FROM saved_result_collections c
LEFT JOIN saved_results sr ON c.id = sr.collection_id
LEFT JOIN job_results jr ON sr.job_result_id = jr.id
GROUP BY c.id;

-- User dashboard view
CREATE VIEW IF NOT EXISTS user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.email,
    
    -- Collection statistics
    COUNT(DISTINCT c.id) as total_collections,
    COUNT(DISTINCT CASE WHEN c.is_archived = FALSE THEN c.id END) as active_collections,
    COUNT(DISTINCT CASE WHEN c.is_public = TRUE THEN c.id END) as public_collections,
    
    -- Job statistics
    COUNT(DISTINCT sr.id) as total_saved_jobs,
    COUNT(DISTINCT CASE WHEN sr.application_status = 'applied' THEN sr.id END) as applied_jobs,
    COUNT(DISTINCT CASE WHEN sr.application_status = 'offered' THEN sr.id END) as job_offers,
    
    -- Recent activity
    MAX(c.last_accessed_at) as last_activity,
    COUNT(DISTINCT CASE WHEN DATE(sr.added_at) = DATE('now') THEN sr.id END) as jobs_saved_today,
    COUNT(DISTINCT CASE WHEN DATE(sr.added_at) >= DATE('now', '-7 days') THEN sr.id END) as jobs_saved_this_week
    
FROM users u
LEFT JOIN saved_result_collections c ON u.id = c.user_id
LEFT JOIN saved_results sr ON c.id = sr.collection_id
GROUP BY u.id;

-- Triggers for data consistency
CREATE TRIGGER IF NOT EXISTS update_collection_stats_on_insert 
AFTER INSERT ON saved_results
BEGIN
    UPDATE saved_result_collections 
    SET total_jobs = (
        SELECT COUNT(*) FROM saved_results WHERE collection_id = NEW.collection_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.collection_id;
END;

CREATE TRIGGER IF NOT EXISTS update_collection_stats_on_delete 
AFTER DELETE ON saved_results
BEGIN
    UPDATE saved_result_collections 
    SET total_jobs = (
        SELECT COUNT(*) FROM saved_results WHERE collection_id = OLD.collection_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.collection_id;
END;
