import { db } from './connection';
import { Search, JobResult, SearchProgress, SearchConfig } from '../types';
import { SearchStats } from '../search/orchestrator';

/**
 * Generate a random ID for SQLite
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create a new search record
 */
export async function createSearch(
  name: string,
  config: SearchConfig,
  userId?: string
): Promise<string> {
  const searchId = generateId();
  
  const stmt = db.prepare(`
    INSERT INTO searches (
      id, user_id, name, position, location, technology, domain, 
      ats_platforms, config, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    searchId,
    userId || null,
    name,
    JSON.stringify(config.position),
    JSON.stringify(config.location),
    JSON.stringify(config.technology || []),
    JSON.stringify(config.domain || []),
    JSON.stringify(config.atsplatforms),
    JSON.stringify(config),
    'pending'
  );
  
  return searchId;
}

/**
 * Update search status
 */
export async function updateSearchStatus(
  searchId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  startedAt?: Date,
  completedAt?: Date,
  errorMessage?: string
): Promise<void> {
  const stmt = db.prepare(`
    UPDATE searches 
    SET status = ?, 
        started_at = COALESCE(?, started_at), 
        completed_at = ?, 
        error_message = ?
    WHERE id = ?
  `);
  
  stmt.run(
    status,
    startedAt?.toISOString(),
    completedAt?.toISOString(),
    errorMessage,
    searchId
  );
}

/**
 * Update search progress
 */
export async function updateSearchProgress(
  searchId: string,
  progress: {
    currentPlatform?: string;
    platformsCompleted?: number;
    totalPlatforms?: number;
    currentResult?: number;
    totalResults?: number;
    progressPercentage?: number;
  }
): Promise<void> {
  // First try to update existing record
  const updateStmt = db.prepare(`
    UPDATE search_progress 
    SET current_platform = COALESCE(?, current_platform),
        platforms_completed = COALESCE(?, platforms_completed),
        total_platforms = COALESCE(?, total_platforms),
        current_result = COALESCE(?, current_result),
        total_results = COALESCE(?, total_results),
        progress_percentage = COALESCE(?, progress_percentage),
        last_updated = CURRENT_TIMESTAMP
    WHERE search_id = ?
  `);
  
  const changes = updateStmt.run(
    progress.currentPlatform,
    progress.platformsCompleted,
    progress.totalPlatforms,
    progress.currentResult,
    progress.totalResults,
    progress.progressPercentage,
    searchId
  );
  
  // If no rows were updated, insert new record
  if (changes.changes === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO search_progress (search_id, current_platform, platforms_completed, total_platforms, current_result, total_results, progress_percentage, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    insertStmt.run(
      searchId,
      progress.currentPlatform,
      progress.platformsCompleted || 0,
      progress.totalPlatforms || 0,
      progress.currentResult || 0,
      progress.totalResults || 0,
      progress.progressPercentage || 0
    );
  }
}

/**
 * Save search results to database
 */
export async function saveSearchResults(
  searchId: string,
  results: JobResult[],
  stats: SearchStats
): Promise<void> {
  const transaction = db.transaction(() => {
    // Update search statistics
    const updateSearchStmt = db.prepare(`
      UPDATE searches 
      SET total_results = ?, total_scraped = ?, total_matches = ?
      WHERE id = ?
    `);
    
    updateSearchStmt.run(stats.totalResults, stats.totalScraped, stats.totalMatches, searchId);
    
    // Insert job results
    if (results.length > 0) {
      const insertJobStmt = db.prepare(`
        INSERT OR IGNORE INTO job_results (id, search_id, title, link, ats_source, keywords_matched, match_count, is_match, scraped_content, scraped_at, company_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const job of results) {
        const jobId = generateId();
        insertJobStmt.run(
          jobId,
          searchId,
          job.title,
          job.link,
          job.atsSource,
          JSON.stringify(job.keywordsMatched),
          job.matchCount,
          job.isMatch ? 1 : 0, // Convert boolean to integer for SQLite
          job.scrapedContent || '',
          job.scrapedAt.toISOString(),
          job.companyName || null
        );
      }
    }
  });
  
  try {
    transaction();
    console.log(`✅ Saved ${results.length} job results for search ${searchId}`);
  } catch (error) {
    console.error('❌ Failed to save search results:', error);
    throw error;
  }
}

/**
 * Get search by ID
 */
export async function getSearchById(searchId: string): Promise<Search | null> {
  const stmt = db.prepare('SELECT * FROM searches WHERE id = ?');
  const row = stmt.get(searchId) as any;
  
  if (!row) {
    return null;
  }
  
  const search: Search = {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    config: JSON.parse(row.config),
    status: row.status,
    createdAt: new Date(row.created_at),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    errorMessage: row.error_message,
    totalResults: row.total_results,
    totalScraped: row.total_scraped,
    totalMatches: row.total_matches
  };
  
  return search;
}

/**
 * Get search progress
 */
export async function getSearchProgress(searchId: string): Promise<SearchProgress | null> {
  const stmt = db.prepare('SELECT * FROM search_progress WHERE search_id = ?');
  const row = stmt.get(searchId) as any;
  
  if (!row) {
    return null;
  }
  
  return {
    searchId: row.search_id,
    currentPlatform: row.current_platform,
    platformsCompleted: row.platforms_completed,
    totalPlatforms: row.total_platforms,
    currentResult: row.current_result,
    totalResults: row.total_results,
    progressPercentage: row.progress_percentage,
    lastUpdated: new Date(row.last_updated)
  };
}

/**
 * Get search results with optional filtering
 */
export async function getSearchResults(
  searchId: string,
  limit = 100,
  offset = 0,
  matchesOnly = false
): Promise<JobResult[]> {
  const whereClause = matchesOnly 
    ? 'WHERE search_id = ? AND is_match = 1' 
    : 'WHERE search_id = ?';
    
  const stmt = db.prepare(`
    SELECT * FROM job_results 
    ${whereClause}
    ORDER BY is_match DESC, match_count DESC, scraped_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const rows = stmt.all(searchId, limit, offset) as any[];
  
  return rows.map(row => ({
    id: row.id,
    searchId: row.search_id,
    title: row.title,
    link: row.link,
    atsSource: row.ats_source,
    keywordsMatched: JSON.parse(row.keywords_matched),
    matchCount: row.match_count,
    isMatch: Boolean(row.is_match), // Convert from SQLite integer to boolean
    scrapedContent: row.scraped_content,
    scrapedAt: new Date(row.scraped_at),
    companyName: row.company_name,
    location: row.location,
    jobType: row.job_type
  }));
}

/**
 * Get count of all results vs matches for a search
 */
export async function getSearchResultsCounts(searchId: string): Promise<{
  totalResults: number;
  totalMatches: number;
}> {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_results,
      SUM(CASE WHEN is_match = 1 THEN 1 ELSE 0 END) as total_matches
    FROM job_results 
    WHERE search_id = ?
  `);
  
  const row = stmt.get(searchId) as any;
  
  return {
    totalResults: row.total_results || 0,
    totalMatches: row.total_matches || 0
  };
}

/**
 * Get recent searches
 */
export async function getRecentSearches(
  userId?: string,
  limit = 10
): Promise<Search[]> {
  const stmt = db.prepare(`
    SELECT s.*, 
           COALESCE(sp.progress_percentage, 0) as current_progress
    FROM searches s
    LEFT JOIN search_progress sp ON s.id = sp.search_id
    WHERE (? IS NULL OR user_id = ?)
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(userId || null, userId || null, limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    config: JSON.parse(row.config),
    status: row.status,
    createdAt: new Date(row.created_at),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    errorMessage: row.error_message,
    totalResults: row.total_results,
    totalScraped: row.total_scraped,
    totalMatches: row.total_matches
  }));
}

/**
 * Delete search and all related data
 */
export async function deleteSearch(searchId: string): Promise<{ jobResults: number; progressRecords: number }> {
  let deletedJobResults = 0;
  let deletedProgressRecords = 0;
  
  const transaction = db.transaction(() => {
    // Count and delete search progress records
    const progressResult = db.prepare('DELETE FROM search_progress WHERE search_id = ?').run(searchId);
    deletedProgressRecords = progressResult.changes;
    
    // Count and delete job results
    const jobResultsResult = db.prepare('DELETE FROM job_results WHERE search_id = ?').run(searchId);
    deletedJobResults = jobResultsResult.changes;
    
    // Delete the search itself
    const searchResult = db.prepare('DELETE FROM searches WHERE id = ?').run(searchId);
    
    if (searchResult.changes === 0) {
      throw new Error('Search not found or already deleted');
    }
  });
  
  try {
    transaction();
    return {
      jobResults: deletedJobResults,
      progressRecords: deletedProgressRecords
    };
  } catch (error) {
    console.error('Failed to delete search:', error);
    throw error;
  }
}
