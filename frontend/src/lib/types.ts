import { z } from 'zod';

// Search Configuration Schema
export const SearchConfigSchema = z.object({
  // Basic search parameters
  jobQuery: z.string().min(1, 'Job query is required'),
  timeFilterDays: z.number().min(1).max(365).default(15),
  maxResultsPerQuery: z.number().min(1).max(10).default(10),
  searchStartPosition: z.number().min(1).default(1),
  
  // Keyword configuration
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  minKeywordMatches: z.number().min(1).default(1),
  
  // ATS platform configuration
  atsplatforms: z.array(z.string()).min(1, 'At least one ATS platform is required'),
  customAtsQueries: z.array(z.string()).default([]),
  
  // Browser configuration
  browserHeadless: z.boolean().default(true),
  pageTimeout: z.number().min(1000).max(60000).default(20000),
  requestDelay: z.number().min(0).max(10000).default(1000),
  userAgent: z.string().optional(),
  
  // Logging configuration
  verboseLogging: z.boolean().default(false),
  debugMode: z.boolean().default(false),
  
  // Google API credentials
  googleApiKey: z.string().min(1, 'Google API key is required'),
  googleCseId: z.string().min(1, 'Google CSE ID is required'),
});

export type SearchConfig = z.infer<typeof SearchConfigSchema>;

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  avatarUrl?: string;
  accountType: 'free' | 'paid' | 'admin';
  searchesUsed: number;
  searchLimit: number;
}

export interface UsageStats {
  searchesUsed: number;
  searchLimit: number;
  canCreateSearch: boolean;
  daysUntilReset: number;
  accountType: string;
}

// Database entities
export interface User {
  id: string;
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
  accountType: 'free' | 'paid' | 'admin';
  searchesUsedThisMonth: number;
  searchLimit: number;
  billingCycleStart: string;
  googleApiKeyEncrypted?: string;
  googleCseIdEncrypted?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Search {
  id: string;
  userId?: string;
  name: string;
  jobQuery: string;
  keywords: string[];
  atsplatforms: string[];
  config: SearchConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  
  // Statistics
  totalResults: number;
  totalScraped: number;
  totalMatches: number;
}

export interface JobResult {
  id: string;
  searchId: string;
  title: string;
  link: string;
  atsSource: string;
  keywordsMatched: string[];
  matchCount: number;
  scrapedContent?: string;
  scrapedAt: Date;
  
  // Metadata
  companyName?: string;
  location?: string;
  jobType?: string;
}

export interface SearchProgress {
  searchId: string;
  currentPlatform?: string;
  platformsCompleted: number;
  totalPlatforms: number;
  currentResult: number;
  totalResults: number;
  progressPercentage: number;
  lastUpdated: Date;
}

export interface UserFavorite {
  userId: string;
  jobResultId: string;
  createdAt: Date;
  notes?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchJobResponse {
  searchId: string;
  status: string;
  message: string;
}

export interface SearchStatusResponse {
  search: Search;
  progress?: SearchProgress;
  results?: JobResult[];
}

// Search templates for common use cases
export interface SearchTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fintech' | 'ai-ml' | 'devops' | 'startup' | 'general';
  config: Partial<SearchConfig>;
  tags: string[];
}

// ATS Platform definitions
export interface ATSPlatform {
  code: string;
  name: string;
  description: string;
  type: 'direct' | 'powered' | 'custom';
  searchQuery: string;
  estimatedJobs?: number;
  isPopular: boolean;
}

// Queue job data
export interface SearchJobData {
  searchId: string;
  searchConfig: SearchConfig;
  userId?: string;
  timestamp: string;
}

// Progress callback type
export type ProgressCallback = (progress: {
  percentage: number;
  message: string;
  currentPlatform?: string;
  resultsFound?: number;
  pagesScraped?: number;
}) => void;

// Google Search API response
export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
}

// =============================================================================
// SAVED RESULTS TYPES
// =============================================================================

export type ApplicationStatus = 
  | 'not_applied' 
  | 'applied' 
  | 'interviewing' 
  | 'rejected' 
  | 'offered' 
  | 'accepted' 
  | 'withdrawn';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type AccessLevel = 'view' | 'comment' | 'edit';

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx' | 'docx';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Saved result collection
export interface SavedResultCollection {
  id: string;
  userId?: string;
  searchId?: string;
  
  // Collection metadata
  name: string;
  description?: string;
  tags: string[];
  colorTheme: string;
  
  // Collection settings
  isPublic: boolean;
  isArchived: boolean;
  autoUpdate: boolean;
  
  // Statistics (computed/cached)
  totalJobs: number;
  totalCompanies: number;
  avgMatchScore: number;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

// Individual saved result
export interface SavedResult {
  id: string;
  collectionId: string;
  jobResultId: string;
  
  // User annotations
  userNotes?: string;
  userRating?: number; // 1-5
  applicationStatus: ApplicationStatus;
  priorityLevel: PriorityLevel;
  
  // Application tracking
  applicationDate?: Date;
  followUpDate?: Date;
  interviewDate?: Date;
  salaryOffered?: number;
  
  // Custom tags
  customTags: string[];
  
  // Tracking
  addedAt: Date;
  lastViewedAt: Date;
  viewCount: number;
  
  // Populated job result data (when joined)
  jobResult?: JobResult;
}

// Export tracking
export interface SavedResultExport {
  id: string;
  collectionId: string;
  userId?: string;
  
  // Export configuration
  exportFormat: ExportFormat;
  exportFilters?: Record<string, any>;
  includeNotes: boolean;
  includeRatings: boolean;
  includeStatus: boolean;
  
  // Export results
  totalRecords: number;
  fileSizeBytes?: number;
  processingStatus: ProcessingStatus;
  
  // File storage
  filePath?: string;
  downloadUrl?: string;
  downloadCount: number;
  expiresAt?: Date;
  
  // Error handling
  errorMessage?: string;
  
  createdAt: Date;
  completedAt?: Date;
}

// Collection sharing
export interface CollectionShare {
  id: string;
  collectionId: string;
  sharedByUserId?: string;
  
  // Sharing configuration
  shareToken: string;
  shareName?: string;
  accessLevel: AccessLevel;
  
  // Security
  passwordProtected: boolean;
  passwordHash?: string;
  allowedDomains: string[];
  
  // Access tracking
  viewCount: number;
  uniqueVisitors: number;
  lastAccessedAt?: Date;
  
  // Expiration and status
  expiresAt?: Date;
  isActive: boolean;
  
  createdAt: Date;
}

// Collection template
export interface CollectionTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  
  // Template configuration
  defaultNamePattern?: string;
  defaultTags: string[];
  defaultColorTheme: string;
  suggestedFields: string[];
  autoRules?: Record<string, any>;
  
  // Template settings
  isSystemTemplate: boolean;
  isPublic: boolean;
  
  // Usage tracking
  usageCount: number;
  createdByUserId?: string;
  
  createdAt: Date;
}

// Auto-save rule
export interface AutoSaveRule {
  id: string;
  collectionId: string;
  userId?: string;
  
  // Rule configuration
  name: string;
  isActive: boolean;
  
  // Matching criteria
  keywordFilters?: string[];
  companyFilters?: string[];
  locationFilters?: string[];
  salaryMin?: number;
  salaryMax?: number;
  minMatchScore?: number;
  atsSourceFilters?: string[];
  
  // Action configuration
  autoPriority: PriorityLevel;
  autoTags: string[];
  autoNotes?: string;
  
  // Statistics
  matchesCount: number;
  lastMatchedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

// Collection CRUD
export interface CreateCollectionRequest {
  name: string;
  description?: string;
  tags?: string[];
  colorTheme?: string;
  isPublic?: boolean;
  searchId?: string; // Optional reference to original search
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  tags?: string[];
  colorTheme?: string;
  isPublic?: boolean;
  isArchived?: boolean;
  autoUpdate?: boolean;
}

export interface CollectionListResponse {
  collections: SavedResultCollection[];
  totalCount: number;
  hasMore: boolean;
}

// Saved result CRUD
export interface SaveJobRequest {
  jobResultId: string;
  collectionId: string;
  userNotes?: string;
  userRating?: number;
  priorityLevel?: PriorityLevel;
  customTags?: string[];
}

export interface UpdateSavedJobRequest {
  userNotes?: string;
  userRating?: number;
  applicationStatus?: ApplicationStatus;
  priorityLevel?: PriorityLevel;
  applicationDate?: string; // ISO date string
  followUpDate?: string;
  interviewDate?: string;
  salaryOffered?: number;
  customTags?: string[];
}

export interface SavedJobsResponse {
  savedJobs: SavedResult[];
  totalCount: number;
  hasMore: boolean;
}

// Export requests
export interface ExportCollectionRequest {
  collectionId: string;
  format: ExportFormat;
  filters?: {
    applicationStatus?: ApplicationStatus[];
    priorityLevel?: PriorityLevel[];
    userRating?: { min?: number; max?: number };
    dateRange?: { start: string; end: string };
    tags?: string[];
  };
  includeNotes?: boolean;
  includeRatings?: boolean;
  includeStatus?: boolean;
}

// Sharing requests
export interface CreateShareRequest {
  collectionId: string;
  shareName?: string;
  accessLevel?: AccessLevel;
  passwordProtected?: boolean;
  password?: string;
  allowedDomains?: string[];
  expiresAt?: string; // ISO date string
}

// Dashboard/Analytics types
export interface CollectionSummary {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  colorTheme: string;
  isPublic: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  
  // Computed statistics
  actualJobCount: number;
  uniqueAtsSources: number;
  uniqueCompanies: number;
  avgUserRating?: number;
  avgMatchScore?: number;
  
  // Application statistics
  appliedCount: number;
  interviewingCount: number;
  offeredCount: number;
  acceptedCount: number;
  
  // Priority distribution
  urgentCount: number;
  highPriorityCount: number;
}

export interface UserDashboardStats {
  userId: string;
  email?: string;
  
  // Collection statistics
  totalCollections: number;
  activeCollections: number;
  publicCollections: number;
  
  // Job statistics
  totalSavedJobs: number;
  appliedJobs: number;
  jobOffers: number;
  
  // Recent activity
  lastActivity?: Date;
  jobsSavedToday: number;
  jobsSavedThisWeek: number;
}

// Search and filter types
export interface SavedJobFilters {
  collectionId?: string;
  applicationStatus?: ApplicationStatus[];
  priorityLevel?: PriorityLevel[];
  userRating?: { min?: number; max?: number };
  dateRange?: { start: string; end: string };
  tags?: string[];
  search?: string; // Full-text search
  sortBy?: 'added_at' | 'user_rating' | 'match_count' | 'application_date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CollectionFilters {
  isArchived?: boolean;
  isPublic?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'total_jobs';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Bulk operations
export interface BulkUpdateSavedJobsRequest {
  savedJobIds: string[];
  updates: Partial<UpdateSavedJobRequest>;
}

export interface BulkMoveJobsRequest {
  savedJobIds: string[];
  targetCollectionId: string;
}

export interface BulkDeleteJobsRequest {
  savedJobIds: string[];
}
