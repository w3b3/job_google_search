/**
 * Saved Results Components
 * 
 * This module provides a comprehensive set of components for managing saved job results,
 * including collections, individual saved jobs, dashboard analytics, and save functionality.
 */

export { default as CollectionsDashboard } from './CollectionsDashboard';
export { default as SavedJobsList } from './SavedJobsList';
export { default as Dashboard } from './Dashboard';
export { default as SaveJobButton } from './SaveJobButton';

// Re-export types for convenience
export type {
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
  CollectionSummary,
  UserDashboardStats,
  SavedJobFilters,
  CollectionFilters,
  BulkUpdateSavedJobsRequest,
  BulkMoveJobsRequest,
  BulkDeleteJobsRequest,
  ApplicationStatus,
  PriorityLevel,
  AccessLevel,
  ExportFormat,
  ProcessingStatus
} from '@/lib/types';
