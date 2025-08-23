'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, UsageStats } from '@/lib/types';
import SearchLayout from '@/components/SearchLayout';

export default function SearchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searches, setSearches] = useState<Search[]>([]);
  const [filteredSearches, setFilteredSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  
  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'matches'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user) {
      fetchSearches();
      fetchUsageStats();
    }
  }, [session, status, router]);

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    let filtered = [...searches];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(search => search.status === statusFilter);
    }

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(search => 
        search.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        search.jobQuery.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'matches':
          comparison = (a.totalMatches || 0) - (b.totalMatches || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredSearches(filtered);
  }, [searches, statusFilter, sortBy, sortOrder, searchQuery]);

  const fetchSearches = async () => {
    try {
      const response = await fetch('/api/search/recent?limit=100'); // Get more searches
      const result = await response.json();
      
      if (result.success) {
        setSearches(result.data);
      }
    } catch (error) {
      console.error('Error fetching searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/user/usage-stats');
      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  const user = session.user;

  return (
    <SearchLayout 
      title="All Searches"
      showBackButton={true}
    >

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Usage Stats and Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Usage Stats */}
            {usageStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.accountType === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.accountType === 'paid' ? 'Pro' : 'Free'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Searches Used</span>
                      <span className="text-sm font-medium text-gray-900">
                        {usageStats.searchesUsed} {usageStats.searchLimit !== -1 && `/ ${usageStats.searchLimit}`}
                      </span>
                    </div>
                    
                    {usageStats.searchLimit !== -1 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            usageStats.searchesUsed >= usageStats.searchLimit
                              ? 'bg-red-500' 
                              : usageStats.searchesUsed / usageStats.searchLimit >= 0.8 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((usageStats.searchesUsed / usageStats.searchLimit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Status Filter */}
              <div className="mb-4">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'matches')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="date">Date Created</option>
                  <option value="name">Name</option>
                  <option value="matches">Match Count</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="mb-4">
                <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  id="sort-order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSortBy('date');
                  setSortOrder('desc');
                  setSearchQuery('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Search Bar */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="flex-1">
                    <label htmlFor="search-input" className="sr-only">
                      Search searches by name or query
                    </label>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by name or query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      aria-label="Search searches by name or query"
                    />
                  </div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium whitespace-nowrap"
                    aria-label="Create new search"
                  >
                    New Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="p-6">
                {filteredSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery || statusFilter !== 'all' ? 'No matching searches' : 'No searches yet'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your filters or search query'
                        : 'Get started by creating your first job search'
                      }
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Create Your First Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Results Summary */}
                    <div className="flex items-center justify-between text-sm text-gray-600 pb-4 border-b border-gray-100">
                      <span>
                        Showing {filteredSearches.length} of {searches.length} searches
                      </span>
                      <span>
                        {searches.length} total searches created
                      </span>
                    </div>

                    {/* Search Cards */}
                    {filteredSearches.map((search) => (
                      <div
                        key={search.id}
                        className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gray-300 cursor-pointer transition-all hover:shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                        onClick={() => router.push(`/search/${search.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/search/${search.id}`);
                          }
                        }}
                        aria-label={`View search results for ${search.name}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-1">
                              {search.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {search.jobQuery}
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full ml-4 ${getStatusColor(search.status)}`}>
                            {search.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-500">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                            <span className="flex items-center">
                              <span className="text-gray-400 mr-1" aria-hidden="true">📅</span>
                              <span className="sr-only">Created on </span>
                              {formatDate(search.createdAt)}
                            </span>
                            {search.status === 'completed' && (
                              <span className="flex items-center text-green-600 font-medium">
                                <span className="text-green-400 mr-1" aria-hidden="true">✓</span>
                                <span className="sr-only">{search.totalMatches} matches found</span>
                                <span aria-hidden="true">{search.totalMatches} matches found</span>
                              </span>
                            )}
                          </div>
                          <button 
                            className="text-blue-600 hover:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded font-medium self-start sm:self-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/search/${search.id}`);
                            }}
                            aria-label={`View results for ${search.name}`}
                          >
                            View Results →
                          </button>
                        </div>

                        {/* Progress indicator for processing searches */}
                        {search.status === 'processing' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Processing...</span>
                              <span>~45% complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                                style={{ width: '45%' }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SearchLayout>
  );
}
