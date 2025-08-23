'use client';

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StrictSearchConfigSchema, StrictSearchConfig } from '@/lib/types';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface StrictSearchConfigurationProps {
  onConfigChange: (config: StrictSearchConfig & { searchType: 'strict' }) => void;
  initialConfig?: Partial<StrictSearchConfig>;
  isLoading?: boolean;
}

// Predefined options for autocomplete
const POSITION_SUGGESTIONS = [
  'Engineering Manager',
  'Senior Engineering Manager', 
  'Engineering Lead',
  'Technical Lead',
  'Staff Engineer',
  'Principal Engineer',
  'Director of Engineering',
  'VP of Engineering',
  'CTO',
  'Head of Engineering'
];

const LOCATION_SUGGESTIONS = [
  'Remote',
  'Hybrid',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Los Angeles, CA',
  'Chicago, IL',
  'Denver, CO',
  'Portland, OR',
  'Miami, FL'
];

const TECHNOLOGY_SUGGESTIONS = [
  'React', 'Vue.js', 'Angular', 'Svelte',
  'Node.js', 'Express.js', 'Next.js', 'Nuxt.js',
  'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'PHP',
  'GraphQL', 'REST API', 'tRPC', 'Apollo',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins'
];

const DOMAIN_SUGGESTIONS = [
  'Fintech', 'Banking', 'Payments', 'Cryptocurrency', 'Blockchain',
  'Healthcare', 'Biotech', 'Medical Devices',
  'E-commerce', 'Retail', 'Marketplace',
  'SaaS', 'Enterprise Software', 'Developer Tools',
  'AI/ML', 'Data Science', 'Analytics',
  'Gaming', 'Entertainment', 'Media',
  'EdTech', 'Education', 'Learning',
  'Real Estate', 'PropTech',
  'Transportation', 'Logistics', 'Supply Chain',
  'Energy', 'CleanTech', 'Sustainability',
  'Security', 'Cybersecurity', 'Privacy'
];

const ATS_PLATFORMS = [
  { value: 'greenhouse', label: 'Greenhouse (Direct)', description: 'Jobs hosted on boards.greenhouse.io' },
  { value: 'lever', label: 'Lever (Direct)', description: 'Jobs hosted on jobs.lever.co' },
  { value: 'ashby', label: 'Ashby (Direct)', description: 'Jobs hosted on jobs.ashbyhq.com' },
  { value: 'workday', label: 'Workday', description: 'Jobs on *.myworkdayjobs.com sites' },
  { value: 'powered_greenhouse', label: 'Greenhouse (Powered)', description: 'Company sites using Greenhouse' },
  { value: 'powered_lever', label: 'Lever (Powered)', description: 'Company sites using Lever' },
  { value: 'powered_ashby', label: 'Ashby (Powered)', description: 'Company sites using Ashby' },
];

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
  required?: boolean;
}

function TagInput({ value, onChange, suggestions, placeholder, label, required }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);
    
    if (input.trim()) {
      const filtered = suggestions.filter(
        suggestion => 
          suggestion.toLowerCase().includes(input.toLowerCase()) &&
          !value.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !value.includes(tag.trim())) {
      onChange([...value, tag.trim()]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-themed">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-600 dark:hover:text-blue-300"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="input-field w-full"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addTag(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Type and press Enter to add, or click suggestions above
      </p>
    </div>
  );
}

export default function StrictSearchConfiguration({ 
  onConfigChange, 
  initialConfig, 
  isLoading 
}: StrictSearchConfigurationProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StrictSearchConfig>({
    resolver: zodResolver(StrictSearchConfigSchema),
    defaultValues: {
      position: initialConfig?.position || [],
      location: initialConfig?.location || [],
      technology: initialConfig?.technology || [],
      domain: initialConfig?.domain || [],
      atsplatforms: initialConfig?.atsplatforms || ['greenhouse', 'lever'],
      timeFilterDays: initialConfig?.timeFilterDays || 15,
      maxResultsPerQuery: initialConfig?.maxResultsPerQuery || 10,
      searchStartPosition: initialConfig?.searchStartPosition || 1,
      browserHeadless: initialConfig?.browserHeadless ?? true,
      pageTimeout: initialConfig?.pageTimeout || 20000,
      requestDelay: initialConfig?.requestDelay || 1000,
      verboseLogging: initialConfig?.verboseLogging || false,
      debugMode: initialConfig?.debugMode || false,
    }
  });

  const watchedValues = watch();

  // Use a ref to track if this is the initial render
  const isInitialRender = React.useRef(true);

  // Update parent component when form values change (but not on initial render)
  React.useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      // Call onConfigChange once on mount with initial values
      const config: StrictSearchConfig & { searchType: 'strict' } = {
        ...watchedValues,
        searchType: 'strict'
      };
      onConfigChange(config);
      return;
    }

    const config: StrictSearchConfig & { searchType: 'strict' } = {
      ...watchedValues,
      searchType: 'strict'
    };
    onConfigChange(config);
  }, [
    // Only depend on the actual values, not the watchedValues object
    watchedValues.position?.join(','),
    watchedValues.location?.join(','),
    watchedValues.technology?.join(','),
    watchedValues.domain?.join(','),
    watchedValues.atsplatforms?.join(','),
    watchedValues.timeFilterDays,
    watchedValues.maxResultsPerQuery,
    watchedValues.searchStartPosition,
    watchedValues.browserHeadless,
    watchedValues.pageTimeout,
    watchedValues.requestDelay,
    watchedValues.verboseLogging,
    watchedValues.debugMode
  ]); // Remove onConfigChange from dependencies

  return (
    <div className="space-y-6">
      <div className="card-themed">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-themed mb-2">
            🎯 Strict Search Configuration
          </h2>
          <p className="text-secondary-themed text-sm">
            Create laser-focused searches with precise parameters. Google will only return jobs that match your exact criteria.
          </p>
        </div>

        {/* Core Required Fields */}
        <div className="space-y-6">
          {/* Position */}
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                suggestions={POSITION_SUGGESTIONS}
                placeholder="e.g., Engineering Manager, Technical Lead"
                label="Job Positions"
                required
              />
            )}
          />
          {errors.position && (
            <p className="text-red-600 text-sm mt-1">{errors.position.message}</p>
          )}

          {/* Location */}
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                suggestions={LOCATION_SUGGESTIONS}
                placeholder="e.g., Remote, San Francisco, Hybrid"
                label="Locations"
                required
              />
            )}
          />
          {errors.location && (
            <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
          )}

          {/* Technology (Optional) */}
          <Controller
            name="technology"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                suggestions={TECHNOLOGY_SUGGESTIONS}
                placeholder="e.g., React, Node.js, AWS, Kubernetes"
                label="Technologies (Optional)"
              />
            )}
          />

          {/* Domain (Optional) */}
          <Controller
            name="domain"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                suggestions={DOMAIN_SUGGESTIONS}
                placeholder="e.g., Fintech, Healthcare, SaaS"
                label="Industry Domains (Optional)"
              />
            )}
          />

          {/* ATS Platforms */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-themed">
              ATS Platforms <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ATS_PLATFORMS.map((platform) => (
                <Controller
                  key={platform.value}
                  name="atsplatforms"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value.includes(platform.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, platform.value]);
                          } else {
                            field.onChange(field.value.filter(v => v !== platform.value));
                          }
                        }}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-themed">
                          {platform.label}
                        </div>
                        <div className="text-xs text-secondary-themed">
                          {platform.description}
                        </div>
                      </div>
                    </label>
                  )}
                />
              ))}
            </div>
            {errors.atsplatforms && (
              <p className="text-red-600 text-sm mt-1">{errors.atsplatforms.message}</p>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {showAdvanced ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
            <span>Advanced Settings</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-themed mb-2">
                    Time Filter (Days)
                  </label>
                  <Controller
                    name="timeFilterDays"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min="1"
                        max="365"
                        {...field}
                        className="input-field"
                      />
                    )}
                  />
                  <p className="text-xs text-secondary-themed mt-1">
                    Only show jobs posted within this many days
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed mb-2">
                    Max Results Per Query
                  </label>
                  <Controller
                    name="maxResultsPerQuery"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        className="input-field"
                      />
                    )}
                  />
                  <p className="text-xs text-secondary-themed mt-1">
                    Maximum results to fetch per ATS platform
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed mb-2">
                    Page Timeout (ms)
                  </label>
                  <Controller
                    name="pageTimeout"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min="1000"
                        max="60000"
                        step="1000"
                        {...field}
                        className="input-field"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed mb-2">
                    Request Delay (ms)
                  </label>
                  <Controller
                    name="requestDelay"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="100"
                        {...field}
                        className="input-field"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Controller
                  name="verboseLogging"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-themed">Enable verbose logging</span>
                    </label>
                  )}
                />

                <Controller
                  name="debugMode"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-themed">Enable debug mode</span>
                    </label>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Query Preview */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-themed mb-2">🔍 Search Query Preview</h3>
          <div className="text-xs font-mono text-secondary-themed break-all">
            {watchedValues.atsplatforms.length > 0 && (
              <div>
                <strong>Example:</strong> site:boards.greenhouse.io{' '}
                {watchedValues.position.length > 0 && (
                  <>({watchedValues.position.map(p => `"${p}"`).join(' OR ')}) </>
                )}
                {watchedValues.location.length > 0 && (
                  <>({watchedValues.location.map(l => `"${l}"`).join(' OR ')}) </>
                )}
                {watchedValues.technology && watchedValues.technology.length > 0 && (
                  <>({watchedValues.technology.map(t => `"${t}"`).join(' OR ')}) </>
                )}
                {watchedValues.domain && watchedValues.domain.length > 0 && (
                  <>({watchedValues.domain.map(d => `"${d}"`).join(' OR ')})</>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-secondary-themed mt-2">
            This shows how your search parameters will be converted into Google search queries
          </p>
        </div>
      </div>
    </div>
  );
}
