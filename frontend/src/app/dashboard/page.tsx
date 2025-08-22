'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SearchConfiguration from '@/components/SearchConfiguration';
import RecentSearches from '@/components/RecentSearches';
import { UsageStats } from '@/lib/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user) {
      fetchUsageStats();
    }
  }, [session, status, router]);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/user/usage-stats');
      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🔍</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Search Analyzer</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <img
                src={user.image || '/default-avatar.png'}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Usage Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              
              {usageStats ? (
                <div className="space-y-4">
                  {/* Usage Display */}
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
                  
                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      usageStats.canCreateSearch ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-sm ${
                      usageStats.canCreateSearch ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {usageStats.canCreateSearch 
                        ? usageStats.searchLimit === -1 
                          ? 'Unlimited searches available'
                          : `${usageStats.searchLimit - usageStats.searchesUsed} searches remaining`
                        : 'Search limit reached'
                      }
                    </span>
                  </div>
                  
                  {/* Reset Info */}
                  {usageStats.searchLimit !== -1 && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Usage resets in {usageStats.daysUntilReset} day{usageStats.daysUntilReset !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              )}
            </div>
            
            {/* Upgrade Prompt for Free Users */}
            {user.accountType === 'free' && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <h4 className="font-semibold mb-2">Upgrade to Pro</h4>
                <p className="text-sm mb-4 opacity-90">
                  Get unlimited searches and priority processing
                </p>
                <button className="w-full bg-white text-blue-600 py-2 px-4 rounded font-medium text-sm hover:bg-gray-100 transition-colors">
                  Contact for Upgrade
                </button>
              </div>
            )}
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Search Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Configure Job Search
                </h2>
                <p className="mt-2 text-gray-600">
                  Set up your automated job search across multiple ATS platforms. 
                  The system will scrape job descriptions and match them against your keywords.
                </p>
              </div>
              
              <SearchConfiguration onSearchCreated={fetchUsageStats} />
            </div>
            
            {/* Recent Searches */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Searches
              </h3>
              <RecentSearches />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
