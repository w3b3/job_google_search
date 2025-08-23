'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building, 
  Tag,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import type { 
  SavedResult, 
  SavedJobFilters, 
  SavedJobsResponse,
  ApplicationStatus,
  PriorityLevel,
  ApiResponse 
} from '@/lib/types';

interface SavedJobsListProps {
  collectionId: string;
  collectionName?: string;
}

export default function SavedJobsList({ collectionId, collectionName }: SavedJobsListProps) {
  const [savedJobs, setSavedJobs] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<SavedJobFilters>({
    sortBy: 'added_at',
    sortOrder: 'desc',
    limit: 20
  });
  const [totalCount, setTotalCount] = useState(0);

  // Load saved jobs
  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.applicationStatus?.length) {
        params.append('applicationStatus', filters.applicationStatus.join(','));
      }
      if (filters.priorityLevel?.length) {
        params.append('priorityLevel', filters.priorityLevel.join(','));
      }
      if (filters.userRating?.min) {
        params.append('userRatingMin', filters.userRating.min.toString());
      }
      if (filters.userRating?.max) {
        params.append('userRatingMax', filters.userRating.max.toString());
      }
      if (filters.dateRange?.start) {
        params.append('dateStart', filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        params.append('dateEnd', filters.dateRange.end);
      }
      if (filters.tags?.length) {
        params.append('tags', filters.tags.join(','));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await fetch(`/api/collections/${collectionId}/jobs?${params.toString()}`);
      const result: ApiResponse<SavedJobsResponse> = await response.json();

      if (result.success && result.data) {
        setSavedJobs(result.data.savedJobs);
        setTotalCount(result.data.totalCount);
      } else {
        setError(result.error || 'Failed to load saved jobs');
      }
    } catch (err) {
      setError('Network error loading saved jobs');
      console.error('Error loading saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load jobs when filters change
  useEffect(() => {
    loadSavedJobs();
  }, [filters, collectionId]);

  // Update saved job
  const handleUpdateJob = async (jobId: string, updates: any) => {
    try {
      const response = await fetch(`/api/saved-jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        loadSavedJobs(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update job');
      }
    } catch (err) {
      setError('Network error updating job');
      console.error('Error updating job:', err);
    }
  };

  // Delete saved job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this job from the collection?')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-jobs/${jobId}`, {
        method: 'DELETE'
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        loadSavedJobs(); // Refresh the list
        setSelectedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        setError(result.error || 'Failed to delete job');
      }
    } catch (err) {
      setError('Network error deleting job');
      console.error('Error deleting job:', err);
    }
  };

  // Toggle job selection
  const handleToggleSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  // Select all jobs
  const handleSelectAll = () => {
    if (selectedJobs.size === savedJobs.length) {
      setSelectedJobs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedJobs(new Set(savedJobs.map(job => job.id)));
      setShowBulkActions(true);
    }
  };

  // Bulk operations
  const handleBulkUpdate = async (updates: any) => {
    try {
      const response = await fetch('/api/saved-jobs/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedJobIds: Array.from(selectedJobs),
          updates
        })
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        loadSavedJobs();
        setSelectedJobs(new Set());
        setShowBulkActions(false);
      } else {
        setError(result.error || 'Failed to update jobs');
      }
    } catch (err) {
      setError('Network error updating jobs');
      console.error('Error updating jobs:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedJobs.size} jobs from this collection?`)) {
      return;
    }

    try {
      const response = await fetch('/api/saved-jobs/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedJobIds: Array.from(selectedJobs)
        })
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        loadSavedJobs();
        setSelectedJobs(new Set());
        setShowBulkActions(false);
      } else {
        setError(result.error || 'Failed to delete jobs');
      }
    } catch (err) {
      setError('Network error deleting jobs');
      console.error('Error deleting jobs:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {collectionName || 'Saved Jobs'}
          </h1>
          <p className="text-gray-600">
            {totalCount} saved jobs
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <SavedJobsFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <BulkActionsBar
          selectedCount={selectedJobs.size}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => {
            setSelectedJobs(new Set());
            setShowBulkActions(false);
          }}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Building size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs found</h3>
          <p className="text-gray-600">
            No jobs match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Header */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {selectedJobs.size === savedJobs.length ? (
                <CheckSquare size={20} className="text-blue-600" />
              ) : (
                <Square size={20} />
              )}
              {selectedJobs.size === savedJobs.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">
              {selectedJobs.size > 0 && `${selectedJobs.size} selected`}
            </span>
          </div>

          {/* Jobs */}
          {savedJobs.map((savedJob) => (
            <SavedJobCard
              key={savedJob.id}
              savedJob={savedJob}
              isSelected={selectedJobs.has(savedJob.id)}
              onToggleSelection={() => handleToggleSelection(savedJob.id)}
              onUpdate={(updates) => handleUpdateJob(savedJob.id, updates)}
              onDelete={() => handleDeleteJob(savedJob.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Saved Job Card Component
interface SavedJobCardProps {
  savedJob: SavedResult;
  isSelected: boolean;
  onToggleSelection: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

function SavedJobCard({ savedJob, isSelected, onToggleSelection, onUpdate, onDelete }: SavedJobCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const job = savedJob.jobResult;
  if (!job) return null;

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'not_applied': return 'bg-gray-100 text-gray-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'interviewing': return 'bg-purple-100 text-purple-800';
      case 'offered': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-green-200 text-green-900';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <button
          onClick={onToggleSelection}
          className="mt-1 flex-shrink-0"
        >
          {isSelected ? (
            <CheckSquare size={20} className="text-blue-600" />
          ) : (
            <Square size={20} className="text-gray-400 hover:text-gray-600" />
          )}
        </button>

        {/* Job Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                <a 
                  href={job.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 flex items-center gap-2"
                >
                  {job.title}
                  <ExternalLink size={16} />
                </a>
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {job.companyName && (
                  <div className="flex items-center gap-1">
                    <Building size={16} />
                    {job.companyName}
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {job.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Tag size={16} />
                  {job.atsSource}
                </div>
              </div>
            </div>

            {/* Actions */}
            <JobActions 
              savedJob={savedJob}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleDetails={() => setShowDetails(!showDetails)}
            />
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(savedJob.applicationStatus)}`}>
              {savedJob.applicationStatus.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(savedJob.priorityLevel)}`}>
              {savedJob.priorityLevel} priority
            </span>
            {savedJob.userRating && (
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">{savedJob.userRating}/5</span>
              </div>
            )}
          </div>

          {/* Keywords Matched */}
          <div className="flex flex-wrap gap-1 mb-3">
            {job.keywordsMatched.slice(0, 5).map((keyword, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
            {job.keywordsMatched.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{job.keywordsMatched.length - 5} more
              </span>
            )}
          </div>

          {/* Notes */}
          {savedJob.userNotes && (
            <div className="mb-3">
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {savedJob.userNotes}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              Added {formatDate(savedJob.addedAt)}
            </div>
            {savedJob.applicationDate && (
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                Applied {formatDate(savedJob.applicationDate)}
              </div>
            )}
            {savedJob.salaryOffered && (
              <div className="flex items-center gap-1">
                <DollarSign size={16} />
                ${savedJob.salaryOffered.toLocaleString()}
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {showDetails && job.scrapedContent && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
              <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                {job.scrapedContent.substring(0, 500)}...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Job Actions Component
interface JobActionsProps {
  savedJob: SavedResult;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onToggleDetails: () => void;
}

function JobActions({ savedJob, onUpdate, onDelete, onToggleDetails }: JobActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
      >
        <MoreHorizontal size={20} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
          <button
            onClick={() => {
              onToggleDetails();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Eye size={16} />
            View Details
          </button>
          <button
            onClick={() => {
              // TODO: Open edit modal
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit size={16} />
            Edit
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// Filters Component
interface SavedJobsFiltersProps {
  filters: SavedJobFilters;
  onFiltersChange: (filters: SavedJobFilters) => void;
}

function SavedJobsFilters({ filters, onFiltersChange }: SavedJobsFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search jobs, companies, or notes..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, offset: 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={16} />
            Filters
          </button>
          
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              onFiltersChange({ 
                ...filters, 
                sortBy: sortBy as any, 
                sortOrder: sortOrder as any,
                offset: 0 
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="added_at-desc">Recently Added</option>
            <option value="added_at-asc">Oldest First</option>
            <option value="user_rating-desc">Highest Rated</option>
            <option value="user_rating-asc">Lowest Rated</option>
            <option value="match_count-desc">Best Match</option>
            <option value="application_date-desc">Recently Applied</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Application Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Status
              </label>
              <select
                multiple
                value={filters.applicationStatus || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value) as ApplicationStatus[];
                  onFiltersChange({ ...filters, applicationStatus: values, offset: 0 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size={4}
              >
                <option value="not_applied">Not Applied</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            {/* Priority Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                multiple
                value={filters.priorityLevel || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value) as PriorityLevel[];
                  onFiltersChange({ ...filters, priorityLevel: values, offset: 0 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size={4}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Rating
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={filters.userRating?.min || 1}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    userRating: { 
                      ...filters.userRating, 
                      min: parseInt(e.target.value) 
                    },
                    offset: 0 
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Min: {filters.userRating?.min || 1} stars</span>
                  <span>Max: {filters.userRating?.max || 5} stars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={() => onFiltersChange({
                sortBy: 'added_at',
                sortOrder: 'desc',
                limit: 20,
                offset: 0
              })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Bulk Actions Bar Component
interface BulkActionsBarProps {
  selectedCount: number;
  onBulkUpdate: (updates: any) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

function BulkActionsBar({ selectedCount, onBulkUpdate, onBulkDelete, onClearSelection }: BulkActionsBarProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} jobs selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBulkUpdate({ applicationStatus: e.target.value });
                e.target.value = '';
              }
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="">Update Status...</option>
            <option value="applied">Mark as Applied</option>
            <option value="interviewing">Mark as Interviewing</option>
            <option value="rejected">Mark as Rejected</option>
            <option value="offered">Mark as Offered</option>
          </select>
          
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBulkUpdate({ priorityLevel: e.target.value });
                e.target.value = '';
              }
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="">Update Priority...</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
