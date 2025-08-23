'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SearchProgress, JobResult } from '@/lib/types';

interface Props {
  searchId: string;
}

// Enhanced loading skeleton component
const SearchResultsSkeleton = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading search results">
    {/* Header skeleton */}
    <div className="card-themed">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded-lg mb-3 w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-2 w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-2 w-2/3"></div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded-full w-20"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-16"></div>
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-themed">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded mb-2 w-16 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-20 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
    
    {/* Progress skeleton */}
    <div className="card-themed">
      <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-2 w-1/3"></div>
      <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
    </div>
  </div>
);

// Enhanced progress component with animations
const SearchProgressIndicator = ({ progress, search }: { progress: SearchProgress; search: Search }) => {
  const progressPercentage = Math.min(progress.progressPercentage, 100);
  
  return (
    <div 
      className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg animate-fadeIn"
      role="region"
      aria-label="Search progress"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full" aria-hidden="true"></div>
          <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
            {progress.currentPlatform ? `Searching ${progress.currentPlatform}...` : 'Processing search...'}
          </span>
        </div>
        <span className="text-sm font-semibold text-primary-700 dark:text-primary-300" aria-live="polite">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-primary-200 dark:bg-primary-800 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 h-3 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Search progress: ${Math.round(progressPercentage)}% complete`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-primary-700 dark:text-primary-300 mt-2">
        <span>
          Platform {progress.platformsCompleted} of {progress.totalPlatforms}
        </span>
        <span>
          {progress.currentResult} results found
        </span>
      </div>
    </div>
  );
};

// Enhanced statistics card with animations
const StatisticsCard = ({ search }: { search: Search }) => {
  const stats = [
    {
      value: search.totalResults,
      label: 'Results Found',
      color: 'text-themed',
      icon: '🔍',
      description: 'Total job postings discovered'
    },
    {
      value: search.totalScraped,
      label: 'Pages Scraped',
      color: 'text-themed',
      icon: '📄',
      description: 'Job pages analyzed for keywords'
    },
    {
      value: search.totalMatches,
      label: 'Matches',
      color: 'text-green-600 dark:text-green-400',
      icon: '✅',
      description: 'Jobs matching your criteria'
    },
    {
      value: search.totalScraped > 0 ? Math.round((search.totalMatches / search.totalScraped) * 100) : 0,
      label: 'Match Rate',
      color: 'text-themed',
      icon: '📊',
      description: 'Percentage of relevant matches',
      suffix: '%'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-themed">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="text-center group hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg p-3 theme-transition animate-slideUp"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-center mb-2">
            <span className="text-lg mr-1" aria-hidden="true">{stat.icon}</span>
            <span 
              className={`text-2xl font-bold ${stat.color} theme-transition`}
              aria-label={`${stat.value}${stat.suffix || ''} ${stat.label}`}
            >
              {stat.value.toLocaleString()}{stat.suffix}
            </span>
          </div>
          <p className="text-sm font-medium text-secondary-themed mb-1">{stat.label}</p>
          <p className="text-xs text-secondary-themed opacity-0 group-hover:opacity-100 theme-transition">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
};

// Enhanced job result card
const JobResultCard = ({ job, index }: { job: JobResult; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const handleSaveJob = useCallback(async () => {
    // TODO: Implement save functionality
    setIsSaved(!isSaved);
  }, [isSaved]);

  return (
    <article 
      className="border border-themed rounded-lg p-4 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 animate-slideUp"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-themed mb-2 line-clamp-2">
            <a 
              href={job.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-600 dark:hover:text-primary-400 theme-transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-describedby={`job-${job.id}-details`}
            >
              {job.title}
            </a>
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mb-3" id={`job-${job.id}-details`}>
            {job.companyName && (
              <span className="font-medium text-themed">{job.companyName}</span>
            )}
            <span className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-full text-xs font-medium">
              {job.atsSource.replace('site:', '').replace('intext:', '').split('.')[0]}
            </span>
            {job.location && (
              <span className="text-secondary-themed text-sm">📍 {job.location}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleSaveJob}
            className={`p-2 rounded-full transition-all duration-200 ${
              isSaved 
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
          >
            <span className="text-lg">{isSaved ? '⭐' : '☆'}</span>
          </button>
          
          <div className="text-right space-y-1">
            {job.isMatch ? (
              <span 
                className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full block"
                aria-label={`${job.matchCount} keyword matches`}
              >
                ✅ {job.matchCount} matches
              </span>
            ) : (
              <span 
                className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-full block"
                aria-label="No keyword matches"
              >
                📄 No matches
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Keywords */}
      {job.keywordsMatched.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-3" role="list" aria-label="Matched keywords">
          {job.keywordsMatched.map((keyword) => (
            <span 
              key={keyword}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
              role="listitem"
            >
              {keyword}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <span className="text-sm text-gray-500 italic">No keyword matches found</span>
        </div>
      )}
      
      {/* Expandable content */}
      {job.scrapedContent && (
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-expanded={isExpanded}
            aria-controls={`job-${job.id}-content`}
          >
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="ml-1">
              {isExpanded ? 'Hide' : 'Show'} job description
            </span>
          </button>
          
          {isExpanded && (
            <div 
              id={`job-${job.id}-content`}
              className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 animate-fadeIn"
            >
              <p className="line-clamp-6">{job.scrapedContent}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
        <time dateTime={job.scrapedAt.toString()}>
          Scraped: {new Date(job.scrapedAt).toLocaleDateString()}
        </time>
        <a 
          href={job.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
        >
          View Job →
        </a>
      </div>
    </article>
  );
};

// Enhanced error state
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="card text-center py-12 border-red-200 bg-red-50 animate-fadeIn" role="alert">
    <div className="text-red-400 text-6xl mb-4 animate-bounce">⚠️</div>
    <h2 className="text-xl font-semibold text-red-900 mb-2">Something went wrong</h2>
    <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={onRetry}
        className="btn-primary"
      >
        🔄 Try Again
      </button>
      <button
        onClick={() => window.location.href = '/'}
        className="btn-secondary"
      >
        ← Back to Search
      </button>
    </div>
  </div>
);

// Enhanced empty state
const EmptyState = ({ search }: { search: Search }) => (
  <div className="card text-center py-16 animate-fadeIn">
    <div className="text-gray-400 text-6xl mb-6 animate-pulse">🔍</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">No matches found</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Your search completed successfully but didn't find any jobs matching your keywords.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
      <div className="bg-blue-50 p-4 rounded-lg animate-slideUp" style={{ animationDelay: '100ms' }}>
        <h4 className="font-semibold text-blue-900 mb-2">💡 Try These Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Broaden your keywords</li>
          <li>• Reduce minimum matches</li>
          <li>• Increase time range</li>
        </ul>
      </div>
      <div className="bg-green-50 p-4 rounded-lg animate-slideUp" style={{ animationDelay: '200ms' }}>
        <h4 className="font-semibold text-green-900 mb-2">🎯 Or Consider:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Add more ATS platforms</li>
          <li>• Try different job titles</li>
          <li>• Expand location search</li>
        </ul>
      </div>
    </div>
    
    <button
      onClick={() => window.location.href = '/'}
      className="btn-primary mt-8"
    >
      Start New Search
    </button>
  </div>
);

export default function SearchResults({ searchId }: Props) {
  const [search, setSearch] = useState<Search | null>(null);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [results, setResults] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showMatchesOnly, setShowMatchesOnly] = useState(false);
  const [resultsCounts, setResultsCounts] = useState<{totalResults: number; totalMatches: number} | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSearchResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/search/results/${searchId}?matches_only=${showMatchesOnly}&limit=200`);
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load search results');
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Unable to connect to the server. Please check your internet connection.');
    }
  }, [searchId, showMatchesOnly]);

  const fetchSearchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/search/status/${searchId}`);
      const result = await response.json();
      
      if (result.success) {
        setSearch(result.data.search);
        setProgress(result.data.progress);
        setError(null);
        setRetryCount(0);
      } else {
        setError(result.error || 'Failed to load search results');
      }
    } catch (err) {
      console.error('Error fetching search status:', err);
      setError('Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    fetchSearchStatus();
  }, [fetchSearchStatus]);

  useEffect(() => {
    fetchSearchStatus();
    
    // Poll for updates if search is still processing
    if (search?.status === 'processing' || search?.status === 'pending') {
      intervalRef.current = setInterval(() => {
        fetchSearchStatus();
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchId, search?.status, fetchSearchStatus]);

  // Fetch results when search is completed or filter changes
  useEffect(() => {
    if (search?.status === 'completed') {
      fetchSearchResults();
    }
  }, [search?.status, showMatchesOnly, fetchSearchResults]);

  const downloadResults = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/search/results/${searchId}?format=${format}&matches_only=${showMatchesOnly}&limit=1000`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const suffix = showMatchesOnly ? '-matches' : '-all';
      
      if (format === 'csv') {
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${searchId}${suffix}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${searchId}${suffix}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Failed to download results. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (start: string | Date, end?: string | Date) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.round(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Loading state
  if (loading) {
    return <SearchResultsSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Search not found
  if (!search) {
    return (
      <div className="card text-center py-12 animate-fadeIn">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Not Found</h2>
        <p className="text-gray-600 mb-6">The search you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="btn-primary"
        >
          ← Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <header className="card animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
              {search.name}
            </h1>
            <div className="space-y-2 text-gray-600">
              <p>
                <span className="font-semibold text-gray-700">Query:</span> {search.jobQuery}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Keywords:</span> {search.keywords.join(', ')}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Platforms:</span> {search.atsplatforms.length} selected
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-3 ml-6">
            <span 
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(search.status)}`}
              aria-label={`Search status: ${search.status}`}
            >
              {search.status.toUpperCase()}
            </span>
            <time 
              className="text-sm text-gray-500 font-medium"
              dateTime={search.createdAt.toString()}
            >
              Duration: {formatDuration(search.createdAt, search.completedAt)}
            </time>
          </div>
        </div>

        {/* Progress Indicator */}
        {progress && (search.status === 'processing' || search.status === 'pending') && (
          <SearchProgressIndicator progress={progress} search={search} />
        )}

        {/* Statistics */}
        <StatisticsCard search={search} />
      </header>

      {/* Export Actions */}
      {search.status === 'completed' && results.length > 0 && (
        <section className="card animate-slideUp" aria-labelledby="export-heading">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="export-heading" className="text-lg font-semibold text-gray-900 mb-1">
                Export Results
              </h2>
              <p className="text-sm text-gray-600">
                Download your search results in your preferred format
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => downloadResults('csv')}
                className="btn-secondary flex items-center space-x-2"
                aria-label="Download results as CSV file"
              >
                <span>📄</span>
                <span>CSV</span>
              </button>
              <button
                onClick={() => downloadResults('json')}
                className="btn-secondary flex items-center space-x-2"
                aria-label="Download results as JSON file"
              >
                <span>📋</span>
                <span>JSON</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Failed State */}
      {search.status === 'failed' && (
        <div className="card bg-red-50 border-red-200 animate-fadeIn" role="alert">
          <div className="flex items-start space-x-3">
            <div className="text-red-400 text-2xl">❌</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Search Failed</h3>
              <p className="text-red-700 mb-4">{search.errorMessage || 'An unexpected error occurred during the search.'}</p>
              <button
                onClick={handleRetry}
                className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                🔄 Retry Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Filter Toggle */}
      {search.status === 'completed' && search.totalResults > 0 && (
        <section className="card animate-slideUp">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">View Results</h2>
              <p className="text-sm text-gray-600">
                Toggle between all results found or only keyword matches
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">All Results ({search.totalResults})</span>
                <button
                  onClick={() => setShowMatchesOnly(!showMatchesOnly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showMatchesOnly ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={showMatchesOnly}
                  aria-label="Toggle between all results and matches only"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      showMatchesOnly ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">Matches Only ({search.totalMatches})</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Job Results */}
      {results.length > 0 && (
        <section className="card animate-slideUp" aria-labelledby="results-heading">
          <div className="flex items-center justify-between mb-6">
            <h2 id="results-heading" className="text-lg font-semibold text-gray-900">
              {showMatchesOnly ? 'Keyword Matches' : 'All Job Results'} ({results.length.toLocaleString()})
            </h2>
            <div className="text-sm text-gray-600">
              Sorted by {showMatchesOnly ? 'relevance' : 'matches first, then relevance'}
            </div>
          </div>
          
          <div className="space-y-4" role="list" aria-label="Job search results">
            {results.map((job, index) => (
              <div key={job.id || index} role="listitem">
                <JobResultCard job={job} index={index} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {search.status === 'completed' && results.length === 0 && (
        <div className="card text-center py-16 animate-fadeIn">
          <div className="text-gray-400 text-6xl mb-6 animate-pulse">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {showMatchesOnly ? 'No keyword matches found' : 'No results stored'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {showMatchesOnly 
              ? `Your search found ${search.totalResults} job postings but none matched your keywords. Try switching to "All Results" to see everything that was found.`
              : 'No job results were stored for this search.'
            }
          </p>
          
          {showMatchesOnly && search.totalResults > 0 && (
            <button
              onClick={() => setShowMatchesOnly(false)}
              className="btn-primary mb-4"
            >
              View All {search.totalResults} Results
            </button>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <div className="bg-blue-50 p-4 rounded-lg animate-slideUp" style={{ animationDelay: '100ms' }}>
              <h4 className="font-semibold text-blue-900 mb-2">💡 Try These Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Broaden your keywords</li>
                <li>• Reduce minimum matches</li>
                <li>• Increase time range</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg animate-slideUp" style={{ animationDelay: '200ms' }}>
              <h4 className="font-semibold text-green-900 mb-2">🎯 Or Consider:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Add more ATS platforms</li>
                <li>• Try different job titles</li>
                <li>• Expand location search</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary mt-8"
          >
            Start New Search
          </button>
        </div>
      )}
    </div>
  );
}
