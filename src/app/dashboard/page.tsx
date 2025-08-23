'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SearchConfiguration from '@/components/SearchConfiguration';
import RecentSearches from '@/components/RecentSearches';
import ThemeToggle from '@/components/ThemeToggle';
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
      <div className="flex items-center justify-center min-h-screen surface-themed">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  const user = session.user;

  return (
    <div className="min-h-screen surface-themed">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow dark:shadow-slate-900/10 border-b border-themed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🔍</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-themed">Job Search Analyzer</h1>
                <p className="text-sm text-secondary-themed">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle size="md" variant="dropdown" />
              <img
                src={user.image || '/default-avatar.png'}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-secondary-themed hover:text-themed theme-transition"
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
            <div className="card-themed mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-themed">Usage This Month</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.accountType === 'paid' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                }`}>
                  {user.accountType === 'paid' ? 'Pro' : 'Free'}
                </span>
              </div>
              
              {usageStats ? (
                <div className="space-y-4">
                  {/* Usage Display */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-secondary-themed">Searches Used</span>
                      <span className="text-sm font-medium text-themed">
                        {usageStats.searchesUsed} {usageStats.searchLimit !== -1 && `/ ${usageStats.searchLimit}`}
                      </span>
                    </div>
                    
                    {usageStats.searchLimit !== -1 && (
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            usageStats.searchesUsed >= usageStats.searchLimit
                              ? 'bg-red-500 dark:bg-red-400' 
                              : usageStats.searchesUsed / usageStats.searchLimit >= 0.8 
                              ? 'bg-yellow-500 dark:bg-yellow-400' 
                              : 'bg-green-500 dark:bg-green-400'
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
                      usageStats.canCreateSearch ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'
                    }`}></div>
                    <span className={`text-sm ${
                      usageStats.canCreateSearch ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
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
                    <div className="text-xs text-secondary-themed pt-2 border-t border-themed">
                      Usage resets in {usageStats.daysUntilReset} day{usageStats.daysUntilReset !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
                </div>
              )}
            </div>
            
            {/* Upgrade Prompt for Free Users */}
            {user.accountType === 'free' && (
              <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <h4 className="font-semibold mb-2">Upgrade to Pro</h4>
                <p className="text-sm mb-4 opacity-90">
                  Get unlimited searches and priority processing
                </p>
                <button className="w-full bg-white text-primary-600 py-2 px-4 rounded font-medium text-sm hover:bg-gray-100 transition-colors">
                  Contact for Upgrade
                </button>
              </div>
            )}
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Search Configuration */}
            <div className="card-themed">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-themed">
                  Configure Job Search
                </h2>
                <p className="mt-2 text-secondary-themed">
                  Set up your automated job search across multiple ATS platforms. 
                  The system will scrape job descriptions and match them against your keywords.
                </p>
              </div>
              
              <SearchConfiguration onSearchCreated={fetchUsageStats} />
            </div>
            
            {/* Recent Searches */}
            <div className="card-themed">
              <h3 className="text-lg font-semibold text-themed mb-4">
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
