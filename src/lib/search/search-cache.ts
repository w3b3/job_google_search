import crypto from 'crypto';
import { db } from '../database/connection';
import { SearchConfig, JobResult } from '../types';

/**
 * Search Cache System - Deduplication and Optimization
 * 
 * This system provides intelligent search result caching to avoid redundant
 * searches when the same parameters have been recently executed.
 * 
 * Key Features:
 * - Query-level granularity (not search-level)
 * - Configurable cache expiry (default: 6 hours)
 * - Consistent cache key generation
 * - Platform-specific deduplication
 */

export interface CachedQueryResult {
  queryHash: string;
  searchId: string;
  atsQuery: string;
  results: JobResult[];
  executedAt: Date;
  isExpired: boolean;
}

export interface QueryCacheKey {
  // Search parameters
  position: string[];
  location: string[];
  technology?: string[];
  domain?: string[];
  
  // Common parameters
  atsQuery: string;
  timeFilterDays: number;
  maxResultsPerQuery: number;
}

export interface CacheHitResult {
  queryHash: string;
  atsQuery: string;
  results: JobResult[];
  searchId: string;
  executedAt: Date;
}

export interface SearchOptimizationResult {
  totalQueries: number;
  cachedQueries: number;
  newQueries: string[];
  cacheHits: CacheHitResult[];
  optimizationSummary: string;
}

/**
 * Default cache expiry: 6 hours
 * This strikes a balance between avoiding redundant searches and ensuring results freshness
 */
const DEFAULT_CACHE_EXPIRY_HOURS = 6;

/**
 * Generate a consistent cache key for a search query
 * This key uniquely identifies a search query based on its parameters
 */
export function generateQueryCacheKey(
  config: SearchConfig,
  atsQuery: string
): string {
  const keyData: QueryCacheKey = {
    atsQuery: atsQuery.trim(),
    timeFilterDays: config.timeFilterDays,
    maxResultsPerQuery: config.maxResultsPerQuery,
    position: [...config.position].sort().map(p => p.trim().toLowerCase()),
    location: [...config.location].sort().map(l => l.trim().toLowerCase()),
    technology: config.technology ? [...config.technology].sort().map(t => t.trim().toLowerCase()) : [],
    domain: config.domain ? [...config.domain].sort().map(d => d.trim().toLowerCase()) : [],
  };
  
  // Generate consistent hash
  const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

/**
 * Find cached results for a specific query hash
 * Returns results that are still within the cache expiry window
 */
export function findCachedQueryResults(
  queryHash: string, 
  cacheExpiryHours = DEFAULT_CACHE_EXPIRY_HOURS
): CachedQueryResult | null {
  try {
    // Find the most recent search with this query hash
    const stmt = db.prepare(`
      SELECT 
        jr.search_id,
        s.created_at as executed_at,
        s.name,
        COUNT(jr.id) as result_count
      FROM job_results jr
      JOIN searches s ON jr.search_id = s.id
      WHERE s.status = 'completed'
        AND datetime(s.completed_at) >= datetime('now', '-${cacheExpiryHours} hours')
      GROUP BY jr.search_id, s.created_at, s.name
      ORDER BY s.completed_at DESC
      LIMIT 1
    `);
    
    // For now, we'll use a simpler approach and check if we can find recent similar results
    // We'll enhance this with proper query hash storage in the next iteration
    
    return null; // Placeholder - will implement full caching in next phase
    
  } catch (error) {
    console.error('[CACHE] Error finding cached results:', error);
    return null;
  }
}

/**
 * Enhanced version that will store and retrieve query hashes
 * This would require extending the database schema
 */
export function findCachedQueryResultsEnhanced(
  queryHash: string,
  cacheExpiryHours = DEFAULT_CACHE_EXPIRY_HOURS
): CachedQueryResult | null {
  // This is the enhanced version that would work with query hash storage
  // For now, returning null to maintain backward compatibility
  return null;
}

/**
 * Determine if we should use cached results based on search parameters
 */
export function shouldUseCache(
  config: SearchConfig,
  cacheExpiryHours = DEFAULT_CACHE_EXPIRY_HOURS
): boolean {
  // Allow users to disable caching via config
  if (config.debugMode) {
    console.log('[CACHE] Cache disabled in debug mode');
    return false;
  }
  
  // For very fresh time filters (< 1 day), be more conservative with caching
  if (config.timeFilterDays < 1) {
    return false;
  }
  
  // For longer time filters, caching is more beneficial
  return true;
}

/**
 * Find recent similar searches that could provide cached results
 * This version works with the current schema without modifications
 */
export async function findRecentSimilarSearches(
  config: SearchConfig,
  atsQueries: string[],
  cacheExpiryHours = DEFAULT_CACHE_EXPIRY_HOURS,
  userId?: string
): Promise<SearchOptimizationResult> {
  try {
    const totalQueries = atsQueries.length;
    let cachedQueries = 0;
    const newQueries: string[] = [];
    const cacheHits: CacheHitResult[] = [];
    
    // For each ATS query, check if we have recent results
    for (const atsQuery of atsQueries) {
      const queryHash = generateQueryCacheKey(config, atsQuery);
      
      // Find recent searches with similar parameters
      const recentResults = await findRecentSimilarQuery(config, atsQuery, cacheExpiryHours, userId);
      
      if (recentResults) {
        cachedQueries++;
        cacheHits.push({
          queryHash,
          atsQuery,
          results: recentResults.results,
          searchId: recentResults.searchId,
          executedAt: recentResults.executedAt
        });
        
        if (config.verboseLogging) {
          console.log(`[CACHE] 🎯 Cache HIT for query: ${atsQuery.substring(0, 50)}...`);
          console.log(`[CACHE]     Found ${recentResults.results.length} cached results from ${recentResults.executedAt.toISOString()}`);
        }
      } else {
        newQueries.push(atsQuery);
        
        if (config.verboseLogging) {
          console.log(`[CACHE] ❌ Cache MISS for query: ${atsQuery.substring(0, 50)}...`);
        }
      }
    }
    
    const optimizationPercentage = totalQueries > 0 ? Math.round((cachedQueries / totalQueries) * 100) : 0;
    const optimizationSummary = `Search Optimization: ${cachedQueries}/${totalQueries} queries cached (${optimizationPercentage}% reduction)`;
    
    if (config.verboseLogging && cachedQueries > 0) {
      console.log(`[CACHE] 🚀 ${optimizationSummary}`);
      console.log(`[CACHE] 📊 Will execute ${newQueries.length} new queries, reuse ${cachedQueries} cached results`);
    }
    
    return {
      totalQueries,
      cachedQueries,
      newQueries,
      cacheHits,
      optimizationSummary
    };
    
  } catch (error) {
    console.error('[CACHE] Error in search optimization:', error);
    
    // Fallback: execute all queries
    return {
      totalQueries: atsQueries.length,
      cachedQueries: 0,
      newQueries: atsQueries,
      cacheHits: [],
      optimizationSummary: 'Cache disabled due to error'
    };
  }
}

/**
 * Find a recent similar query based on search parameters
 * Works with current database schema
 */
async function findRecentSimilarQuery(
  config: SearchConfig,
  atsQuery: string,
  cacheExpiryHours: number,
  userId?: string
): Promise<{ results: JobResult[]; searchId: string; executedAt: Date } | null> {
  try {
    let searchConditions = '';
    let searchParams: any[] = [];
    
    // Build search conditions for strict search type
    searchConditions = `
      AND json_extract(s.config, '$.timeFilterDays') = ?
    `;
    searchParams = [config.timeFilterDays];
    
    // Add user condition if provided
    if (userId) {
      searchConditions += ' AND s.user_id = ?';
      searchParams.push(userId);
    }
    
    // Find recent completed searches with similar parameters
    const searchStmt = db.prepare(`
      SELECT DISTINCT s.id, s.completed_at
      FROM searches s
      JOIN job_results jr ON s.id = jr.search_id
      WHERE s.status = 'completed'
        AND datetime(s.completed_at) >= datetime('now', '-${cacheExpiryHours} hours')
        AND jr.ats_source LIKE ?
        ${searchConditions}
      ORDER BY s.completed_at DESC
      LIMIT 1
    `);
    
    // Match ATS source pattern (extract domain or site restriction)
    const atsPattern = extractATSPattern(atsQuery);
    const searchResult = searchStmt.get(atsPattern, ...searchParams) as any;
    
    if (!searchResult) {
      return null;
    }
    
    // Get results for this search that match the ATS pattern
    const resultsStmt = db.prepare(`
      SELECT 
        id, search_id, title, link, ats_source, keywords_matched, 
        match_count, is_match, scraped_content, scraped_at, company_name
      FROM job_results 
      WHERE search_id = ? 
        AND ats_source LIKE ?
      ORDER BY is_match DESC, match_count DESC
    `);
    
    const rows = resultsStmt.all(searchResult.id, atsPattern) as any[];
    
    if (rows.length === 0) {
      return null;
    }
    
    const results: JobResult[] = rows.map(row => ({
      id: row.id,
      searchId: row.search_id,
      title: row.title,
      link: row.link,
      atsSource: row.ats_source,
      keywordsMatched: JSON.parse(row.keywords_matched || '[]'),
      matchCount: row.match_count,
      isMatch: Boolean(row.is_match),
      scrapedContent: row.scraped_content,
      scrapedAt: new Date(row.scraped_at),
      companyName: row.company_name
    }));
    
    return {
      results,
      searchId: searchResult.id,
      executedAt: new Date(searchResult.completed_at)
    };
    
  } catch (error) {
    console.error('[CACHE] Error finding recent similar query:', error);
    return null;
  }
}

/**
 * Extract ATS pattern for matching cached results
 * Converts full query to pattern that can match in database
 */
function extractATSPattern(atsQuery: string): string {
  // Extract domain patterns from site: restrictions
  if (atsQuery.includes('site:')) {
    const siteMatch = atsQuery.match(/site:([^\s]+)/);
    if (siteMatch) {
      return `%${siteMatch[1]}%`;
    }
  }
  
  // Handle intext patterns for "powered by" queries
  if (atsQuery.includes('intext:')) {
    const intextMatch = atsQuery.match(/intext:"([^"]+)"/);
    if (intextMatch) {
      return `%${intextMatch[1]}%`;
    }
  }
  
  // Fallback: use the query itself
  return `%${atsQuery}%`;
}

/**
 * Store query hash for enhanced caching (future enhancement)
 * This would require database schema changes
 */
export async function storeQueryHash(
  searchId: string,
  atsQuery: string,
  queryHash: string,
  config: SearchConfig
): Promise<void> {
  // Future enhancement: store query hashes for more precise caching
  // For now, we rely on parameter matching in existing schema
  
  if (config.debugMode) {
    console.log(`[CACHE] Generated query hash for ${atsQuery}: ${queryHash}`);
  }
}

/**
 * Get cache statistics for monitoring and optimization
 */
export function getCacheStatistics(
  userId?: string
): {
  totalSearches: number;
  cacheableSearches: number;
  avgResultsPerSearch: number;
  recentSearches: number;
} {
  try {
    let userCondition = '';
    let params: any[] = [];
    
    if (userId) {
      userCondition = 'WHERE user_id = ?';
      params.push(userId);
    }
    
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_searches,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as cacheable_searches,
        AVG(total_results) as avg_results_per_search,
        COUNT(CASE WHEN datetime(completed_at) >= datetime('now', '-${DEFAULT_CACHE_EXPIRY_HOURS} hours') THEN 1 END) as recent_searches
      FROM searches
      ${userCondition}
    `);
    
    const result = stmt.get(...params) as any;
    
    return {
      totalSearches: result.total_searches || 0,
      cacheableSearches: result.cacheable_searches || 0,
      avgResultsPerSearch: parseFloat(result.avg_results_per_search || '0'),
      recentSearches: result.recent_searches || 0
    };
    
  } catch (error) {
    console.error('[CACHE] Error getting cache statistics:', error);
    return {
      totalSearches: 0,
      cacheableSearches: 0,
      avgResultsPerSearch: 0,
      recentSearches: 0
    };
  }
}
