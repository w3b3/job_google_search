'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

// Icon components
const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const MonitorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export function ThemeToggle({ 
  size = 'md', 
  showLabel = false, 
  variant = 'button' 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder to avoid hydration mismatch
    return (
      <div className={`
        ${size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'}
        bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse
      `} />
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getThemeIcon = () => {
    const iconClass = `${iconSizes[size]} transition-all duration-300 ease-in-out`;
    
    switch (theme) {
      case 'dark':
        return <MoonIcon className={iconClass} />;
      case 'light':
        return <SunIcon className={iconClass} />;
      case 'system':
      default:
        return <MonitorIcon className={iconClass} />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'system':
      default:
        return 'System';
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizeClasses[size]}
            flex items-center justify-center
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-sm
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            transition-colors duration-200 ease-in-out
            ${showLabel ? 'px-3 w-auto space-x-2' : ''}
          `}
          aria-label={`Current theme: ${getThemeLabel()}. Click to change theme`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {getThemeIcon()}
          {showLabel && (
            <>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getThemeLabel()}
              </span>
              <ChevronDownIcon className={`${iconSizes[size]} text-gray-500 dark:text-gray-400`} />
            </>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-32">
              <button
                onClick={() => {
                  setTheme('light');
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm
                  flex items-center space-x-2
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${theme === 'light' ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                  transition-colors duration-150
                `}
              >
                <SunIcon className="w-4 h-4" />
                <span>Light</span>
              </button>
              <button
                onClick={() => {
                  setTheme('dark');
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm
                  flex items-center space-x-2
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${theme === 'dark' ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                  transition-colors duration-150
                `}
              >
                <MoonIcon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => {
                  setTheme('system');
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm
                  flex items-center space-x-2
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${theme === 'system' ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                  transition-colors duration-150
                `}
              >
                <MonitorIcon className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Button variant - cycles through themes
  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-colors duration-200 ease-in-out
        ${showLabel ? 'px-3 w-auto space-x-2' : ''}
      `}
      aria-label={`Current theme: ${getThemeLabel()}. Click to cycle to next theme`}
    >
      {getThemeIcon()}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getThemeLabel()}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;