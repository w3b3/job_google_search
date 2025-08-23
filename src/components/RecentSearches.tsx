'use client';

import { useState, useEffect } from 'react';
import { Search } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function RecentSearches() {
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  const fetchRecentSearches = async () => {
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
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 text-4xl mb-2">📋</div>
        <p className="text-gray-500 text-sm">No searches yet</p>
        <p className="text-gray-400 text-xs mt-1">
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
          className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 cursor-pointer transition-colors"
          onClick={() => router.push(`/search/${search.id}`)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
              {search.name}
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full ml-2 ${getStatusColor(search.status)}`}>
              {search.status}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 mb-2 truncate">
            {search.jobQuery}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(search.createdAt)}</span>
            {search.status === 'completed' && (
              <span className="text-green-600 font-medium">
                {search.totalMatches} matches
              </span>
            )}
          </div>
          
          {/* Progress indicator for processing searches */}
          {search.status === 'processing' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: '45%' }} // You could fetch real progress here
                ></div>
              </div>
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
