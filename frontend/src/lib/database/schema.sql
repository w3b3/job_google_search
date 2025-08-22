-- Job Search Application Database Schema

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    google_api_key_encrypted TEXT,
    google_cse_id_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search configurations
CREATE TABLE IF NOT EXISTS searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    job_query TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    ats_platforms TEXT[] NOT NULL,
    config JSONB NOT NULL, -- Full configuration object
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Statistics
    total_results INTEGER DEFAULT 0,
    total_scraped INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0
);

-- Job results
CREATE TABLE IF NOT EXISTS job_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    ats_source VARCHAR(255) NOT NULL,
    keywords_matched TEXT[] NOT NULL,
    match_count INTEGER NOT NULL,
    scraped_content TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    company_name VARCHAR(255),
    location VARCHAR(255),
    job_type VARCHAR(100),
    
    UNIQUE(search_id, link) -- Prevent duplicate results per search
);

-- Search progress tracking (for real-time updates)
CREATE TABLE IF NOT EXISTS search_progress (
    search_id UUID PRIMARY KEY REFERENCES searches(id) ON DELETE CASCADE,
    current_platform VARCHAR(255),
    platforms_completed INTEGER DEFAULT 0,
    total_platforms INTEGER DEFAULT 0,
    current_result INTEGER DEFAULT 0,
    total_results INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites (for future feature)
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_result_id UUID REFERENCES job_results(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    PRIMARY KEY (user_id, job_result_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_results_search_id ON job_results(search_id);
CREATE INDEX IF NOT EXISTS idx_job_results_scraped_at ON job_results(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_results_match_count ON job_results(match_count DESC);
CREATE INDEX IF NOT EXISTS idx_job_results_ats_source ON job_results(ats_source);

-- Full text search index for job content
CREATE INDEX IF NOT EXISTS idx_job_results_content_fts 
ON job_results USING gin(to_tsvector('english', title || ' ' || COALESCE(scraped_content, '')));

-- Search analytics view
CREATE OR REPLACE VIEW search_analytics AS
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
        THEN ROUND((s.total_matches::DECIMAL / s.total_scraped * 100), 2)
        ELSE 0 
    END as match_rate_percentage,
    CASE 
        WHEN s.completed_at IS NOT NULL AND s.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) 
        ELSE NULL 
    END as duration_seconds,
    array_length(s.ats_platforms, 1) as platforms_count,
    array_length(s.keywords, 1) as keywords_count
FROM searches s;
