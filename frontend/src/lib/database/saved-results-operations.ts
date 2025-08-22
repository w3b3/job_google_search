/**
 * Database operations for saved results functionality
 * Provides CRUD operations for collections, saved results, exports, and sharing
 */

import { db } from './connection.js';
import type {
  SavedResultCollection,
  SavedResult,
  SavedResultExport,
  CollectionShare,
  CollectionTemplate,
  AutoSaveRule,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  SaveJobRequest,
  UpdateSavedJobRequest,
  ExportCollectionRequest,
  CreateShareRequest,
  CollectionFilters,
  SavedJobFilters,
  CollectionSummary,
  UserDashboardStats,
  ApplicationStatus,
  PriorityLevel,
  ExportFormat,
  ProcessingStatus
} from '../types.js';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique ID for database records
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Parse JSON string safely
 */
function parseJsonSafe<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert database row to SavedResultCollection
 */
function rowToCollection(row: any): SavedResultCollection {
  return {
    id: row.id,
    userId: row.user_id,
    searchId: row.search_id,
    name: row.name,
    description: row.description,
    tags: parseJsonSafe(row.tags, []),
    colorTheme: row.color_theme,
    isPublic: Boolean(row.is_public),
    isArchived: Boolean(row.is_archived),
    autoUpdate: Boolean(row.auto_update),
    totalJobs: row.total_jobs || 0,
    totalCompanies: row.total_companies || 0,
    avgMatchScore: row.avg_match_score || 0,
    salaryRangeMin: row.salary_range_min,
    salaryRangeMax: row.salary_range_max,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastAccessedAt: new Date(row.last_accessed_at)
  };
}

/**
 * Convert database row to SavedResult
 */
function rowToSavedResult(row: any): SavedResult {
  return {
    id: row.id,
    collectionId: row.collection_id,
    jobResultId: row.job_result_id,
    userNotes: row.user_notes,
    userRating: row.user_rating,
    applicationStatus: row.application_status as ApplicationStatus,
    priorityLevel: row.priority_level as PriorityLevel,
    applicationDate: row.application_date ? new Date(row.application_date) : undefined,
    followUpDate: row.follow_up_date ? new Date(row.follow_up_date) : undefined,
    interviewDate: row.interview_date ? new Date(row.interview_date) : undefined,
    salaryOffered: row.salary_offered,
    customTags: parseJsonSafe(row.custom_tags, []),
    addedAt: new Date(row.added_at),
    lastViewedAt: new Date(row.last_viewed_at),
    viewCount: row.view_count || 0
  };
}

// =============================================================================
// COLLECTION OPERATIONS
// =============================================================================

/**
 * Create a new saved result collection
 */
export async function createCollection(
  request: CreateCollectionRequest,
  userId?: string
): Promise<SavedResultCollection> {
  const id = generateId();
  
  const stmt = db.prepare(`
    INSERT INTO saved_result_collections (
      id, user_id, search_id, name, description, tags, color_theme, is_public,
      created_at, updated_at, last_accessed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  stmt.run(
    id,
    userId,
    request.searchId,
    request.name,
    request.description,
    JSON.stringify(request.tags || []),
    request.colorTheme || '#3b82f6',
    request.isPublic || false
  );
  
  return getCollectionById(id)!;
}

/**
 * Get collection by ID
 */
export async function getCollectionById(collectionId: string): Promise<SavedResultCollection | null> {
  const stmt = db.prepare('SELECT * FROM saved_result_collections WHERE id = ?');
  const row = stmt.get(collectionId) as any;
  
  if (!row) return null;
  return rowToCollection(row);
}

/**
 * Update collection
 */
export async function updateCollection(
  collectionId: string,
  updates: UpdateCollectionRequest
): Promise<SavedResultCollection | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    setParts.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setParts.push('description = ?');
    values.push(updates.description);
  }
  if (updates.tags !== undefined) {
    setParts.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }
  if (updates.colorTheme !== undefined) {
    setParts.push('color_theme = ?');
    values.push(updates.colorTheme);
  }
  if (updates.isPublic !== undefined) {
    setParts.push('is_public = ?');
    values.push(updates.isPublic);
  }
  if (updates.isArchived !== undefined) {
    setParts.push('is_archived = ?');
    values.push(updates.isArchived);
  }
  if (updates.autoUpdate !== undefined) {
    setParts.push('auto_update = ?');
    values.push(updates.autoUpdate);
  }
  
  if (setParts.length === 0) {
    return getCollectionById(collectionId);
  }
  
  setParts.push('updated_at = CURRENT_TIMESTAMP');
  values.push(collectionId);
  
  const stmt = db.prepare(`
    UPDATE saved_result_collections 
    SET ${setParts.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  
  if (result.changes === 0) return null;
  return getCollectionById(collectionId);
}

/**
 * Delete collection and all its saved results
 */
export async function deleteCollection(collectionId: string): Promise<boolean> {
  const transaction = db.transaction(() => {
    // Delete all saved results in the collection
    const deleteSavedResults = db.prepare('DELETE FROM saved_results WHERE collection_id = ?');
    deleteSavedResults.run(collectionId);
    
    // Delete the collection
    const deleteCollection = db.prepare('DELETE FROM saved_result_collections WHERE id = ?');
    const result = deleteCollection.run(collectionId);
    
    return result.changes > 0;
  });
  
  return transaction();
}

/**
 * List collections with filtering and pagination
 */
export async function listCollections(
  filters: CollectionFilters = {},
  userId?: string
): Promise<{ collections: SavedResultCollection[]; totalCount: number }> {
  const whereClauses: string[] = [];
  const values: any[] = [];
  
  // User filter (if provided)
  if (userId) {
    whereClauses.push('(user_id = ? OR is_public = TRUE)');
    values.push(userId);
  }
  
  // Archive filter
  if (filters.isArchived !== undefined) {
    whereClauses.push('is_archived = ?');
    values.push(filters.isArchived);
  }
  
  // Public filter
  if (filters.isPublic !== undefined) {
    whereClauses.push('is_public = ?');
    values.push(filters.isPublic);
  }
  
  // Search filter
  if (filters.search) {
    whereClauses.push('(name LIKE ? OR description LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    values.push(searchTerm, searchTerm);
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
    whereClauses.push(`(${tagConditions})`);
    filters.tags.forEach(tag => values.push(`%"${tag}"%`));
  }
  
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  // Count total
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM saved_result_collections ${whereClause}
  `);
  const totalCount = (countStmt.get(...values) as any).count;
  
  // Build order clause
  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || 'desc';
  const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
  
  // Build limit clause
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const limitClause = `LIMIT ? OFFSET ?`;
  
  // Get collections
  const stmt = db.prepare(`
    SELECT * FROM saved_result_collections 
    ${whereClause} 
    ${orderClause} 
    ${limitClause}
  `);
  
  const rows = stmt.all(...values, limit, offset) as any[];
  const collections = rows.map(rowToCollection);
  
  return { collections, totalCount };
}

/**
 * Update collection access time
 */
export async function updateCollectionAccessTime(collectionId: string): Promise<void> {
  const stmt = db.prepare(`
    UPDATE saved_result_collections 
    SET last_accessed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(collectionId);
}

// =============================================================================
// SAVED RESULTS OPERATIONS
// =============================================================================

/**
 * Save a job to a collection
 */
export async function saveJobToCollection(request: SaveJobRequest): Promise<SavedResult> {
  const id = generateId();
  
  const stmt = db.prepare(`
    INSERT INTO saved_results (
      id, collection_id, job_result_id, user_notes, user_rating, 
      priority_level, custom_tags, added_at, last_viewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  stmt.run(
    id,
    request.collectionId,
    request.jobResultId,
    request.userNotes,
    request.userRating,
    request.priorityLevel || 'medium',
    JSON.stringify(request.customTags || [])
  );
  
  return getSavedResultById(id)!;
}

/**
 * Get saved result by ID
 */
export async function getSavedResultById(savedResultId: string): Promise<SavedResult | null> {
  const stmt = db.prepare('SELECT * FROM saved_results WHERE id = ?');
  const row = stmt.get(savedResultId) as any;
  
  if (!row) return null;
  return rowToSavedResult(row);
}

/**
 * Update saved result
 */
export async function updateSavedResult(
  savedResultId: string,
  updates: UpdateSavedJobRequest
): Promise<SavedResult | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  
  if (updates.userNotes !== undefined) {
    setParts.push('user_notes = ?');
    values.push(updates.userNotes);
  }
  if (updates.userRating !== undefined) {
    setParts.push('user_rating = ?');
    values.push(updates.userRating);
  }
  if (updates.applicationStatus !== undefined) {
    setParts.push('application_status = ?');
    values.push(updates.applicationStatus);
  }
  if (updates.priorityLevel !== undefined) {
    setParts.push('priority_level = ?');
    values.push(updates.priorityLevel);
  }
  if (updates.applicationDate !== undefined) {
    setParts.push('application_date = ?');
    values.push(updates.applicationDate);
  }
  if (updates.followUpDate !== undefined) {
    setParts.push('follow_up_date = ?');
    values.push(updates.followUpDate);
  }
  if (updates.interviewDate !== undefined) {
    setParts.push('interview_date = ?');
    values.push(updates.interviewDate);
  }
  if (updates.salaryOffered !== undefined) {
    setParts.push('salary_offered = ?');
    values.push(updates.salaryOffered);
  }
  if (updates.customTags !== undefined) {
    setParts.push('custom_tags = ?');
    values.push(JSON.stringify(updates.customTags));
  }
  
  if (setParts.length === 0) {
    return getSavedResultById(savedResultId);
  }
  
  values.push(savedResultId);
  
  const stmt = db.prepare(`
    UPDATE saved_results 
    SET ${setParts.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  
  if (result.changes === 0) return null;
  return getSavedResultById(savedResultId);
}

/**
 * Remove job from collection
 */
export async function removeSavedResult(savedResultId: string): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM saved_results WHERE id = ?');
  const result = stmt.run(savedResultId);
  return result.changes > 0;
}

/**
 * List saved results with filtering and pagination
 */
export async function listSavedResults(
  filters: SavedJobFilters = {}
): Promise<{ savedResults: (SavedResult & { jobResult?: any })[]; totalCount: number }> {
  const whereClauses: string[] = [];
  const values: any[] = [];
  
  // Collection filter
  if (filters.collectionId) {
    whereClauses.push('sr.collection_id = ?');
    values.push(filters.collectionId);
  }
  
  // Application status filter
  if (filters.applicationStatus && filters.applicationStatus.length > 0) {
    const placeholders = filters.applicationStatus.map(() => '?').join(', ');
    whereClauses.push(`sr.application_status IN (${placeholders})`);
    values.push(...filters.applicationStatus);
  }
  
  // Priority level filter
  if (filters.priorityLevel && filters.priorityLevel.length > 0) {
    const placeholders = filters.priorityLevel.map(() => '?').join(', ');
    whereClauses.push(`sr.priority_level IN (${placeholders})`);
    values.push(...filters.priorityLevel);
  }
  
  // User rating filter
  if (filters.userRating) {
    if (filters.userRating.min !== undefined) {
      whereClauses.push('sr.user_rating >= ?');
      values.push(filters.userRating.min);
    }
    if (filters.userRating.max !== undefined) {
      whereClauses.push('sr.user_rating <= ?');
      values.push(filters.userRating.max);
    }
  }
  
  // Date range filter
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      whereClauses.push('sr.added_at >= ?');
      values.push(filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      whereClauses.push('sr.added_at <= ?');
      values.push(filters.dateRange.end);
    }
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(() => 'sr.custom_tags LIKE ?').join(' OR ');
    whereClauses.push(`(${tagConditions})`);
    filters.tags.forEach(tag => values.push(`%"${tag}"%`));
  }
  
  // Full-text search filter
  if (filters.search) {
    whereClauses.push('(jr.title LIKE ? OR jr.company_name LIKE ? OR sr.user_notes LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    values.push(searchTerm, searchTerm, searchTerm);
  }
  
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  // Count total
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM saved_results sr
    LEFT JOIN job_results jr ON sr.job_result_id = jr.id
    ${whereClause}
  `);
  const totalCount = (countStmt.get(...values) as any).count;
  
  // Build order clause
  const sortBy = filters.sortBy || 'added_at';
  const sortOrder = filters.sortOrder || 'desc';
  let orderColumn = 'sr.added_at';
  
  switch (sortBy) {
    case 'user_rating':
      orderColumn = 'sr.user_rating';
      break;
    case 'match_count':
      orderColumn = 'jr.match_count';
      break;
    case 'application_date':
      orderColumn = 'sr.application_date';
      break;
    default:
      orderColumn = 'sr.added_at';
  }
  
  const orderClause = `ORDER BY ${orderColumn} ${sortOrder.toUpperCase()}`;
  
  // Build limit clause
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const limitClause = `LIMIT ? OFFSET ?`;
  
  // Get saved results with job data
  const stmt = db.prepare(`
    SELECT 
      sr.*,
      jr.title as job_title,
      jr.link as job_link,
      jr.ats_source as job_ats_source,
      jr.keywords_matched as job_keywords_matched,
      jr.match_count as job_match_count,
      jr.scraped_content as job_scraped_content,
      jr.scraped_at as job_scraped_at,
      jr.company_name as job_company_name,
      jr.location as job_location,
      jr.job_type as job_job_type
    FROM saved_results sr
    LEFT JOIN job_results jr ON sr.job_result_id = jr.id
    ${whereClause}
    ${orderClause}
    ${limitClause}
  `);
  
  const rows = stmt.all(...values, limit, offset) as any[];
  
  const savedResults = rows.map(row => {
    const savedResult = rowToSavedResult(row);
    
    // Add job result data if available
    if (row.job_title) {
      savedResult.jobResult = {
        id: row.job_result_id,
        searchId: row.search_id,
        title: row.job_title,
        link: row.job_link,
        atsSource: row.job_ats_source,
        keywordsMatched: parseJsonSafe(row.job_keywords_matched, []),
        matchCount: row.job_match_count,
        scrapedContent: row.job_scraped_content,
        scrapedAt: new Date(row.job_scraped_at),
        companyName: row.job_company_name,
        location: row.job_location,
        jobType: row.job_job_type
      };
    }
    
    return savedResult;
  });
  
  return { savedResults, totalCount };
}

/**
 * Update saved result view count and last viewed time
 */
export async function updateSavedResultViewStats(savedResultId: string): Promise<void> {
  const stmt = db.prepare(`
    UPDATE saved_results 
    SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(savedResultId);
}

/**
 * Check if job is already saved in collection
 */
export async function isJobSavedInCollection(
  jobResultId: string, 
  collectionId: string
): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT 1 FROM saved_results 
    WHERE job_result_id = ? AND collection_id = ?
  `);
  const result = stmt.get(jobResultId, collectionId);
  return !!result;
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Bulk update saved results
 */
export async function bulkUpdateSavedResults(
  savedResultIds: string[],
  updates: Partial<UpdateSavedJobRequest>
): Promise<number> {
  if (savedResultIds.length === 0) return 0;
  
  const setParts: string[] = [];
  const values: any[] = [];
  
  if (updates.applicationStatus !== undefined) {
    setParts.push('application_status = ?');
    values.push(updates.applicationStatus);
  }
  if (updates.priorityLevel !== undefined) {
    setParts.push('priority_level = ?');
    values.push(updates.priorityLevel);
  }
  if (updates.userRating !== undefined) {
    setParts.push('user_rating = ?');
    values.push(updates.userRating);
  }
  
  if (setParts.length === 0) return 0;
  
  const placeholders = savedResultIds.map(() => '?').join(', ');
  values.push(...savedResultIds);
  
  const stmt = db.prepare(`
    UPDATE saved_results 
    SET ${setParts.join(', ')}
    WHERE id IN (${placeholders})
  `);
  
  const result = stmt.run(...values);
  return result.changes;
}

/**
 * Bulk move saved results to different collection
 */
export async function bulkMoveSavedResults(
  savedResultIds: string[],
  targetCollectionId: string
): Promise<number> {
  if (savedResultIds.length === 0) return 0;
  
  const placeholders = savedResultIds.map(() => '?').join(', ');
  
  const stmt = db.prepare(`
    UPDATE saved_results 
    SET collection_id = ?
    WHERE id IN (${placeholders})
  `);
  
  const result = stmt.run(targetCollectionId, ...savedResultIds);
  return result.changes;
}

/**
 * Bulk delete saved results
 */
export async function bulkDeleteSavedResults(savedResultIds: string[]): Promise<number> {
  if (savedResultIds.length === 0) return 0;
  
  const placeholders = savedResultIds.map(() => '?').join(', ');
  
  const stmt = db.prepare(`
    DELETE FROM saved_results 
    WHERE id IN (${placeholders})
  `);
  
  const result = stmt.run(...savedResultIds);
  return result.changes;
}

// =============================================================================
// ANALYTICS AND DASHBOARD
// =============================================================================

/**
 * Get collection summary with statistics
 */
export async function getCollectionSummary(collectionId: string): Promise<CollectionSummary | null> {
  const stmt = db.prepare(`
    SELECT * FROM collection_summary WHERE id = ?
  `);
  
  const row = stmt.get(collectionId) as any;
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: parseJsonSafe(row.tags, []),
    colorTheme: row.color_theme,
    isPublic: Boolean(row.is_public),
    isArchived: Boolean(row.is_archived),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastAccessedAt: new Date(row.last_accessed_at),
    actualJobCount: row.actual_job_count || 0,
    uniqueAtsSources: row.unique_ats_sources || 0,
    uniqueCompanies: row.unique_companies || 0,
    avgUserRating: row.avg_user_rating,
    avgMatchScore: row.avg_match_score,
    appliedCount: row.applied_count || 0,
    interviewingCount: row.interviewing_count || 0,
    offeredCount: row.offered_count || 0,
    acceptedCount: row.accepted_count || 0,
    urgentCount: row.urgent_count || 0,
    highPriorityCount: row.high_priority_count || 0
  };
}

/**
 * Get user dashboard statistics
 */
export async function getUserDashboardStats(userId: string): Promise<UserDashboardStats | null> {
  const stmt = db.prepare(`
    SELECT * FROM user_dashboard_stats WHERE user_id = ?
  `);
  
  const row = stmt.get(userId) as any;
  if (!row) return null;
  
  return {
    userId: row.user_id,
    email: row.email,
    totalCollections: row.total_collections || 0,
    activeCollections: row.active_collections || 0,
    publicCollections: row.public_collections || 0,
    totalSavedJobs: row.total_saved_jobs || 0,
    appliedJobs: row.applied_jobs || 0,
    jobOffers: row.job_offers || 0,
    lastActivity: row.last_activity ? new Date(row.last_activity) : undefined,
    jobsSavedToday: row.jobs_saved_today || 0,
    jobsSavedThisWeek: row.jobs_saved_this_week || 0
  };
}

/**
 * Get application pipeline statistics
 */
export async function getApplicationPipelineStats(userId?: string): Promise<Record<ApplicationStatus, number>> {
  let whereClause = '';
  const values: any[] = [];
  
  if (userId) {
    whereClause = 'WHERE c.user_id = ?';
    values.push(userId);
  }
  
  const stmt = db.prepare(`
    SELECT 
      sr.application_status,
      COUNT(*) as count
    FROM saved_results sr
    JOIN saved_result_collections c ON sr.collection_id = c.id
    ${whereClause}
    GROUP BY sr.application_status
  `);
  
  const rows = stmt.all(...values) as any[];
  
  const stats: Record<ApplicationStatus, number> = {
    not_applied: 0,
    applied: 0,
    interviewing: 0,
    rejected: 0,
    offered: 0,
    accepted: 0,
    withdrawn: 0
  };
  
  rows.forEach(row => {
    stats[row.application_status as ApplicationStatus] = row.count;
  });
  
  return stats;
}
