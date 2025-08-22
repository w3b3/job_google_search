'use client';

import { useState, useEffect } from 'react';
import { Search, SearchProgress, JobResult } from '@/lib/types';

interface Props {
  searchId: string;
}

export default function SearchResults({ searchId }: Props) {
  const [search, setSearch] = useState<Search | null>(null);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [results, setResults] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSearchStatus();
    
    // Poll for updates if search is still processing
    const interval = setInterval(() => {
      if (search?.status === 'processing' || search?.status === 'pending') {
        fetchSearchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [searchId, search?.status]);

  const fetchSearchStatus = async () => {
    try {
      const response = await fetch(`/api/search/status/${searchId}`);
      const result = await response.json();
      
      if (result.success) {
        setSearch(result.data.search);
        setProgress(result.data.progress);
        if (result.data.results) {
          setResults(result.data.results);
        }
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching search status:', err);
      setError('Failed to fetch search status');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/search/results/${searchId}?format=${format}`);
      
      if (format === 'csv') {
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${searchId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${searchId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Failed to download results');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (start: string | Date, end?: string | Date) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${Math.round(duration / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading search results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-400 text-4xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Search</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="btn-primary"
        >
          ← Back to Search
        </button>
      </div>
    );
  }

  if (!search) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Not Found</h2>
        <p className="text-gray-600">The search you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {search.name}
            </h1>
            <p className="text-gray-600 mb-3">
              <strong>Query:</strong> {search.jobQuery}
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Keywords:</strong> {search.keywords.join(', ')}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(search.status)}`}>
              {search.status.toUpperCase()}
            </span>
            <p className="text-sm text-gray-500">
              {formatDuration(search.createdAt, search.completedAt)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && search.status === 'processing' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                {progress.currentPlatform ? `Searching ${progress.currentPlatform}...` : 'Processing...'}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress.progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{search.totalResults}</p>
            <p className="text-sm text-gray-600">Results Found</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{search.totalScraped}</p>
            <p className="text-sm text-gray-600">Pages Scraped</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{search.totalMatches}</p>
            <p className="text-sm text-gray-600">Matches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {search.totalScraped > 0 ? Math.round((search.totalMatches / search.totalScraped) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600">Match Rate</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {search.status === 'completed' && results.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Export Results
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={() => downloadResults('csv')}
                className="btn-secondary"
              >
                📄 Download CSV
              </button>
              <button
                onClick={() => downloadResults('json')}
                className="btn-secondary"
              >
                📋 Download JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {search.status === 'failed' && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <div className="text-red-400 text-xl">❌</div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Search Failed</h3>
              <p className="text-red-700">{search.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Job Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Job Matches ({results.length})
            </h3>
          </div>
          
          <div className="space-y-4">
            {results.map((job, index) => (
              <div key={job.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">
                      <a 
                        href={job.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary-600 transition-colors"
                      >
                        {job.title}
                      </a>
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {job.companyName && <span className="font-medium">{job.companyName} • </span>}
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {job.atsSource.replace('site:', '').replace('intext:', '').split('.')[0]}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                      {job.matchCount} matches
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.keywordsMatched.map((keyword) => (
                    <span 
                      key={keyword}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Scraped: {new Date(job.scrapedAt).toLocaleString()}</span>
                  <a 
                    href={job.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Job →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {search.status === 'completed' && results.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
          <p className="text-gray-600 mb-4">
            Your search completed successfully but didn't find any jobs matching your keywords.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>💡 Try broadening your keywords</p>
            <p>💡 Reduce minimum keyword matches</p>
            <p>💡 Increase the time filter range</p>
            <p>💡 Add more ATS platforms</p>
          </div>
        </div>
      )}
    </div>
  );
}
