import { db } from './connection';
import { Search, JobResult, SearchProgress, SearchConfig } from '../types';
import { SearchStats } from '../search/orchestrator';

/**
 * Create a new search record
 */
export async function createSearch(
  name: string,
  config: SearchConfig,
  userId?: string
): Promise<string> {
  const query = `
    INSERT INTO searches (user_id, name, job_query, keywords, ats_platforms, config, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;
  
  const values = [
    userId || null,
    name,
    config.jobQuery,
    config.keywords,
    config.atsplatforms,
    JSON.stringify(config),
    'pending'
  ];
  
  const result = await db.query(query, values);
  return result.rows[0].id;
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
  const query = `
    UPDATE searches 
    SET status = $1, started_at = COALESCE($2, started_at), completed_at = $3, error_message = $4, updated_at = NOW()
    WHERE id = $5
  `;
  
  const values = [status, startedAt, completedAt, errorMessage, searchId];
  await db.query(query, values);
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
  const query = `
    INSERT INTO search_progress (search_id, current_platform, platforms_completed, total_platforms, current_result, total_results, progress_percentage, last_updated)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (search_id) 
    DO UPDATE SET 
      current_platform = COALESCE($2, search_progress.current_platform),
      platforms_completed = COALESCE($3, search_progress.platforms_completed),
      total_platforms = COALESCE($4, search_progress.total_platforms),
      current_result = COALESCE($5, search_progress.current_result),
      total_results = COALESCE($6, search_progress.total_results),
      progress_percentage = COALESCE($7, search_progress.progress_percentage),
      last_updated = NOW()
  `;
  
  const values = [
    searchId,
    progress.currentPlatform,
    progress.platformsCompleted,
    progress.totalPlatforms,
    progress.currentResult,
    progress.totalResults,
    progress.progressPercentage
  ];
  
  await db.query(query, values);
}

/**
 * Save search results to database
 */
export async function saveSearchResults(
  searchId: string,
  results: JobResult[],
  stats: SearchStats
): Promise<void> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update search statistics
    await client.query(`
      UPDATE searches 
      SET total_results = $1, total_scraped = $2, total_matches = $3
      WHERE id = $4
    `, [stats.totalResults, stats.totalScraped, stats.totalMatches, searchId]);
    
    // Insert job results
    if (results.length > 0) {
      const jobValues = results.map((job, index) => 
        `($${index * 9 + 1}, $${index * 9 + 2}, $${index * 9 + 3}, $${index * 9 + 4}, $${index * 9 + 5}, $${index * 9 + 6}, $${index * 9 + 7}, $${index * 9 + 8}, $${index * 9 + 9})`
      ).join(', ');
      
      const jobQuery = `
        INSERT INTO job_results (search_id, title, link, ats_source, keywords_matched, match_count, scraped_content, scraped_at, company_name)
        VALUES ${jobValues}
        ON CONFLICT (search_id, link) DO NOTHING
      `;
      
      const jobParams = results.flatMap(job => [
        searchId,
        job.title,
        job.link,
        job.atsSource,
        job.keywordsMatched,
        job.matchCount,
        job.scrapedContent || '',
        job.scrapedAt,
        job.companyName || null
      ]);
      
      await client.query(jobQuery, jobParams);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Saved ${results.length} job results for search ${searchId}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to save search results:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get search by ID
 */
export async function getSearchById(searchId: string): Promise<Search | null> {
  const query = `
    SELECT * FROM searches WHERE id = $1
  `;
  
  const result = await db.query(query, [searchId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    jobQuery: row.job_query,
    keywords: row.keywords,
    atsplatforms: row.ats_platforms,
    config: row.config,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    totalResults: row.total_results,
    totalScraped: row.total_scraped,
    totalMatches: row.total_matches
  };
}

/**
 * Get search progress
 */
export async function getSearchProgress(searchId: string): Promise<SearchProgress | null> {
  const query = `
    SELECT * FROM search_progress WHERE search_id = $1
  `;
  
  const result = await db.query(query, [searchId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    searchId: row.search_id,
    currentPlatform: row.current_platform,
    platformsCompleted: row.platforms_completed,
    totalPlatforms: row.total_platforms,
    currentResult: row.current_result,
    totalResults: row.total_results,
    progressPercentage: parseFloat(row.progress_percentage),
    lastUpdated: row.last_updated
  };
}

/**
 * Get search results
 */
export async function getSearchResults(
  searchId: string,
  limit = 100,
  offset = 0
): Promise<JobResult[]> {
  const query = `
    SELECT * FROM job_results 
    WHERE search_id = $1 
    ORDER BY match_count DESC, scraped_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await db.query(query, [searchId, limit, offset]);
  
  return result.rows.map(row => ({
    id: row.id,
    searchId: row.search_id,
    title: row.title,
    link: row.link,
    atsSource: row.ats_source,
    keywordsMatched: row.keywords_matched,
    matchCount: row.match_count,
    scrapedContent: row.scraped_content,
    scrapedAt: row.scraped_at,
    companyName: row.company_name,
    location: row.location,
    jobType: row.job_type
  }));
}

/**
 * Get recent searches
 */
export async function getRecentSearches(
  userId?: string,
  limit = 10
): Promise<Search[]> {
  const query = `
    SELECT s.*, 
           COALESCE(sp.progress_percentage, 0) as current_progress
    FROM searches s
    LEFT JOIN search_progress sp ON s.id = sp.search_id
    WHERE ($1::uuid IS NULL OR user_id = $1)
    ORDER BY created_at DESC
    LIMIT $2
  `;
  
  const result = await db.query(query, [userId || null, limit]);
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    jobQuery: row.job_query,
    keywords: row.keywords,
    atsplatforms: row.ats_platforms,
    config: row.config,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    totalResults: row.total_results,
    totalScraped: row.total_scraped,
    totalMatches: row.total_matches
  }));
}

/**
 * Delete search and all related data
 */
export async function deleteSearch(searchId: string): Promise<boolean> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete in order due to foreign key constraints
    await client.query('DELETE FROM search_progress WHERE search_id = $1', [searchId]);
    await client.query('DELETE FROM job_results WHERE search_id = $1', [searchId]);
    await client.query('DELETE FROM searches WHERE id = $1', [searchId]);
    
    await client.query('COMMIT');
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete search:', error);
    return false;
  } finally {
    client.release();
  }
}
