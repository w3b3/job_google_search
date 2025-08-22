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

// Database entities
export interface User {
  id: string;
  email?: string;
  name?: string;
  googleApiKeyEncrypted?: string;
  googleCseIdEncrypted?: string;
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
