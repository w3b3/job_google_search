'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SearchProgress } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function RecentSearches() {
  const [searches, setSearches] = useState<Search[]>([]);
  const [searchProgress, setSearchProgress] = useState<Record<string, SearchProgress>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProgressForProcessingSearches = async (processingSearches: Search[]) => {
    const progressPromises = processingSearches.map(async (search) => {
      try {
        const response = await fetch(`/api/search/status/${search.id}`);
        const result = await response.json();
        if (result.success && result.data.progress) {
          return { searchId: search.id, progress: result.data.progress };
        }
      } catch (error) {
        console.error(`Error fetching progress for search ${search.id}:`, error);
      }
      return null;
    });

    const progressResults = await Promise.all(progressPromises);
    const progressMap: Record<string, SearchProgress> = {};
    
    progressResults.forEach((result) => {
      if (result) {
        progressMap[result.searchId] = result.progress;
      }
    });
    
    setSearchProgress(progressMap);
  };

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  // Set up polling for processing searches
  useEffect(() => {
    const processingSearches = searches.filter(s => s.status === 'processing' || s.status === 'pending');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (processingSearches.length > 0) {
      // Fetch progress immediately
      fetchProgressForProcessingSearches(processingSearches);
      
      // Set up polling for progress updates only
      intervalRef.current = setInterval(() => {
        fetchProgressForProcessingSearches(processingSearches);
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [searches.length]); // Only depend on the number of searches, not their content

  const fetchRecentSearches = useCallback(async () => {
    try {
      const response = await fetch('/api/search/recent?limit=5');
      const result = await response.json();
      
      if (result.success) {
        setSearches(result.data);
      }
    } catch (error) {
      console.error('Error fetching recent searches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'processing':
        return 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 animate-pulse';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏸️';
      default:
        return '📋';
    }
  };

  const retrySearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to search results
    
    try {
      // Get the original search configuration
      const searchResponse = await fetch(`/api/search/status/${searchId}`);
      const searchResult = await searchResponse.json();
      
      if (!searchResult.success) {
        throw new Error(searchResult.error);
      }
      
      const originalSearch = searchResult.data.search;
      
      // Create a new search with the same configuration
      const retryResponse = await fetch('/api/search/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${originalSearch.name} (Retry)`,
          ...originalSearch.config
        }),
      });
      
      const retryResult = await retryResponse.json();
      
      if (retryResult.success) {
        // Refresh the searches list
        fetchRecentSearches();
      } else {
        throw new Error(retryResult.error);
      }
    } catch (error) {
      console.error('Error retrying search:', error);
      alert('Failed to retry search. Please try again.');
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 dark:text-slate-500 text-4xl mb-2">📋</div>
        <p className="text-secondary-themed text-sm">No searches yet</p>
        <p className="text-secondary-themed text-xs mt-1">
          Configure and run your first search above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <div
          key={search.id}
          className="border border-themed rounded-lg p-3 hover:border-gray-300 dark:hover:border-border-dark cursor-pointer theme-transition"
          onClick={() => router.push(`/search/${search.id}`)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-themed text-sm truncate flex-1">
              {search.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(search.status)}`}>
                <span>{getStatusIcon(search.status)}</span>
                {search.status}
              </span>
              {search.status === 'failed' && (
                <button
                  onClick={(e) => retrySearch(search.id, e)}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-full transition-colors"
                  title="Retry search"
                >
                  🔄 Retry
                </button>
              )}
            </div>
          </div>
          
          <p className="text-xs text-secondary-themed mb-2 truncate">
            {search.jobQuery || 'Strict search configuration'}
          </p>
          
          <div className="flex items-center justify-between text-xs text-tertiary-themed">
            <span>{formatDate(search.createdAt)}</span>
            {search.status === 'completed' && (
              <span className="text-green-600 font-medium">
                {search.totalMatches} matches
              </span>
            )}
            {search.status === 'failed' && search.errorMessage && (
              <span className="text-red-600 font-medium truncate max-w-32" title={search.errorMessage}>
                Error: {search.errorMessage}
              </span>
            )}
          </div>
          
          {/* Progress indicator for processing searches */}
          {search.status === 'processing' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${searchProgress[search.id]?.progressPercentage || 5}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-blue-600 mt-1 flex justify-between">
                <span>
                  {searchProgress[search.id]?.currentPlatform 
                    ? `Processing ${searchProgress[search.id].currentPlatform}...`
                    : 'Processing search...'
                  }
                </span>
                <span>{Math.round(searchProgress[search.id]?.progressPercentage || 0)}%</span>
              </div>
            </div>
          )}
          
          {/* Status message for pending searches */}
          {search.status === 'pending' && (
            <div className="mt-2">
              <div className="text-xs text-yellow-600">Queued for processing...</div>
            </div>
          )}
        </div>
      ))}
      
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={() => router.push('/searches')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all searches →
        </button>
      </div>
    </div>
  );
}
