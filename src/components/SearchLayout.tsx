'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface SearchLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

/**
 * Shared layout component for search-related pages
 * Provides consistent navigation, header, and user controls
 */
export default function SearchLayout({ 
  children, 
  title = "Search Results",
  showBackButton = true 
}: SearchLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGoBack = () => {
    // Try to go back in history, fallback to dashboard
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoHome = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen surface-themed">
      {/* Header Navigation */}
      <div className="bg-white dark:bg-slate-800 shadow dark:shadow-slate-900/10 border-b border-themed sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-4">
              {/* Logo/Home Button */}
              <button
                onClick={handleGoHome}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                aria-label="Go to home"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🔍</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-themed">Job Search Analyzer</h1>
                </div>
              </button>

              {/* Back Button */}
              {showBackButton && (
                <button
                  onClick={handleGoBack}
                  className="flex items-center space-x-2 text-secondary-themed hover:text-themed transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              {/* Page Title */}
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-themed">{title}</h2>
              </div>
            </div>

            {/* Right side - User controls */}
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              {session && (
                <nav className="hidden md:flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="text-secondary-themed hover:text-themed transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/searches"
                    className="text-secondary-themed hover:text-themed transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    My Searches
                  </Link>
                </nav>
              )}

              {/* Theme Toggle */}
              <ThemeToggle size="md" variant="dropdown" />

              {/* User Menu */}
              {session?.user ? (
                <div className="flex items-center space-x-3">
                  <img
                    src={session.user.image || '/default-avatar.png'}
                    alt={session.user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-themed">{session.user.name}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-secondary-themed hover:text-themed transition-colors"
                    aria-label="Sign out"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Navigation Menu */}
      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-themed z-30">
          <div className="flex justify-around py-2">
            <Link
              href="/dashboard"
              className="flex flex-col items-center space-y-1 px-3 py-2 text-secondary-themed hover:text-themed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span className="text-xs">Dashboard</span>
            </Link>
            <Link
              href="/searches"
              className="flex flex-col items-center space-y-1 px-3 py-2 text-secondary-themed hover:text-themed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs">Searches</span>
            </Link>
            <button
              onClick={handleGoBack}
              className="flex flex-col items-center space-y-1 px-3 py-2 text-secondary-themed hover:text-themed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs">Back</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
