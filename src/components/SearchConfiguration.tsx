'use client';

import { useState, useCallback } from 'react';
import { SearchConfig } from '@/lib/types';
import { useRouter } from 'next/navigation';
import StrictSearchConfiguration from './StrictSearchConfiguration';

interface SearchConfigurationProps {
  onSearchCreated?: () => void | Promise<void>;
}

export default function SearchConfiguration({ onSearchCreated }: SearchConfigurationProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchName, setSearchName] = useState('');
  
  // Search configuration
  const [config, setConfig] = useState<SearchConfig>({
    position: [],
    location: [],
    technology: [],
    domain: [],
    atsplatforms: ['greenhouse', 'lever'],
    timeFilterDays: 15,
    maxResultsPerQuery: 10,
    searchStartPosition: 1,
    browserHeadless: true,
    pageTimeout: 20000,
    requestDelay: 1000,
    verboseLogging: false,
    debugMode: false,
  });

  const router = useRouter();

  // Memoize the config change handler to prevent infinite loops
  const handleConfigChange = useCallback((newConfig: SearchConfig) => {
    setConfig(newConfig);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate configuration
      if (config.position.length === 0) {
        alert('Please add at least one job position');
        return;
      }
      if (config.location.length === 0) {
        alert('Please add at least one location');
        return;
      }
      if (config.atsplatforms.length === 0) {
        alert('Please select at least one ATS platform');
        return;
      }

      const name = searchName || `Job Search - ${new Date().toLocaleString()}`;

      const response = await fetch('/api/search/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          config
        })
      });

      const result = await response.json();

      if (result.success) {
        // Call the callback if provided
        if (onSearchCreated) {
          await onSearchCreated();
        }
        // Redirect to search results page
        router.push(`/search/${result.data.searchId}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Search submission error:', error);
      alert('Failed to start search. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Name Input */}
      <div className="card-themed">
        <div className="mb-4">
          <label className="block text-sm font-medium text-themed mb-2">
            Search Name (Optional)
          </label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="e.g., Senior Engineering Manager - Fintech"
            className="input-field w-full"
          />
          <p className="text-xs text-secondary-themed mt-1">
            Give your search a descriptive name to easily find it later
          </p>
        </div>
      </div>

      {/* Search Configuration */}
      <StrictSearchConfiguration 
        onConfigChange={handleConfigChange}
        initialConfig={config}
        isLoading={isSubmitting}
      />
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary px-8 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Starting Search...</span>
            </span>
          ) : (
            '🚀 Start Job Search'
          )}
        </button>
      </div>
    </div>
  );
}
