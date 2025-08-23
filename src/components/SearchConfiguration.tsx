'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SearchConfigSchema, SearchConfig, LegacySearchConfig, StrictSearchConfig } from '@/lib/types';
import { useRouter } from 'next/navigation';
import SearchModeSelector, { SearchMode } from './SearchModeSelector';
import StrictSearchConfiguration from './StrictSearchConfiguration';

const ATS_PLATFORMS = [
  { id: 'ashby', name: 'Ashby', description: 'Direct Ashby job boards', popular: true },
  { id: 'greenhouse', name: 'Greenhouse', description: 'Direct Greenhouse job boards', popular: true },
  { id: 'lever', name: 'Lever', description: 'Direct Lever job boards', popular: true },
  { id: 'powered_ashby', name: 'Powered by Ashby', description: 'Sites using Ashby (broader)', popular: true },
  { id: 'powered_greenhouse', name: 'Powered by Greenhouse', description: 'Sites using Greenhouse (broader)', popular: true },
  { id: 'powered_lever', name: 'Powered by Lever', description: 'Sites using Lever (broader)', popular: true },
  { id: 'workday', name: 'Workday', description: 'Corporate career sites', popular: false },
  { id: 'bamboohr', name: 'BambooHR', description: 'HR platform jobs', popular: false },
  { id: 'jobvite', name: 'Jobvite', description: 'Recruiting platform', popular: false },
  { id: 'smartrecruiters', name: 'SmartRecruiters', description: 'Recruiting platform', popular: false },
];

const KEYWORD_TEMPLATES = {
  fintech: ['stripe', 'payment', 'payments', 'fintech', 'billing', 'checkout', 'banking'],
  'ai-ml': ['tensorflow', 'pytorch', 'python', 'machine learning', 'deep learning', 'nlp', 'artificial intelligence'],
  devops: ['kubernetes', 'docker', 'aws', 'terraform', 'jenkins', 'ci/cd', 'monitoring'],
  startup: ['startup', 'early stage', 'series a', 'series b', 'equity', 'stock options'],
  remote: ['remote', 'distributed', 'work from home', 'wfh', 'anywhere'],
};

// Job role suggestions for autocomplete
const JOB_ROLE_SUGGESTIONS = [
  'software engineer',
  'senior software engineer',
  'frontend engineer',
  'backend engineer',
  'full stack engineer',
  'engineering manager',
  'engineering lead',
  'staff engineer',
  'principal engineer',
  'data engineer',
  'data scientist',
  'machine learning engineer',
  'devops engineer',
  'product manager',
  'technical lead',
  'architect',
  'security engineer',
  'mobile engineer',
  'qa engineer',
  'site reliability engineer'
];

// Location suggestions
const LOCATION_SUGGESTIONS = [
  'remote',
  'hybrid',
  'san francisco',
  'new york',
  'seattle',
  'austin',
  'boston',
  'chicago',
  'los angeles',
  'denver',
  'portland',
  'atlanta'
];

// Company type suggestions
const COMPANY_TYPE_SUGGESTIONS = [
  'startup',
  'fintech',
  'healthcare',
  'edtech',
  'enterprise',
  'saas',
  'e-commerce',
  'crypto',
  'blockchain',
  'ai',
  'gaming'
];

// Preset configurations for common job searches
const PRESET_CONFIGURATIONS = {
  'software-engineer-remote': {
    name: '💻 Software Engineer (Remote)',
    description: 'Remote software engineering positions',
    config: {
      jobQuery: '"software engineer" remote',
      keywords: ['react', 'javascript', 'typescript', 'node.js', 'python'],
      timeFilterDays: 7,
      maxResultsPerQuery: 10,
      minKeywordMatches: 1,
    }
  },
  'engineering-manager': {
    name: '👥 Engineering Manager',
    description: 'Engineering leadership roles',
    config: {
      jobQuery: '("engineering manager" OR "engineering lead" OR "tech lead")',
      keywords: ['leadership', 'team', 'management', 'agile', 'scrum'],
      timeFilterDays: 14,
      maxResultsPerQuery: 8,
      minKeywordMatches: 1,
    }
  },
  'fintech-engineer': {
    name: '💳 Fintech Engineer',
    description: 'Financial technology positions',
    config: {
      jobQuery: '("software engineer" OR "backend engineer") fintech',
      keywords: ['stripe', 'payment', 'payments', 'fintech', 'billing', 'checkout', 'banking'],
      timeFilterDays: 10,
      maxResultsPerQuery: 10,
      minKeywordMatches: 2,
    }
  },
  'startup-fullstack': {
    name: '🚀 Startup Full-Stack',
    description: 'Full-stack roles at startups',
    config: {
      jobQuery: '("full stack" OR "fullstack") ("startup" OR "series a" OR "series b")',
      keywords: ['startup', 'equity', 'stock options', 'early stage', 'growth'],
      timeFilterDays: 14,
      maxResultsPerQuery: 10,
      minKeywordMatches: 1,
    }
  },
  'ai-ml-engineer': {
    name: '🤖 AI/ML Engineer',
    description: 'Artificial intelligence and machine learning roles',
    config: {
      jobQuery: '("machine learning" OR "AI engineer" OR "data scientist")',
      keywords: ['tensorflow', 'pytorch', 'python', 'machine learning', 'deep learning', 'nlp'],
      timeFilterDays: 14,
      maxResultsPerQuery: 8,
      minKeywordMatches: 2,
    }
  },
  'devops-sre': {
    name: '⚙️ DevOps/SRE',
    description: 'DevOps and Site Reliability Engineering',
    config: {
      jobQuery: '("devops engineer" OR "site reliability engineer" OR "platform engineer")',
      keywords: ['kubernetes', 'docker', 'aws', 'terraform', 'jenkins', 'ci/cd', 'monitoring'],
      timeFilterDays: 10,
      maxResultsPerQuery: 8,
      minKeywordMatches: 2,
    }
  }
};

interface SearchConfigurationProps {
  onSearchCreated?: () => void | Promise<void>;
}

export default function SearchConfiguration({ onSearchCreated }: SearchConfigurationProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('strict');
  const [searchName, setSearchName] = useState('');
  
  // Strict search configuration
  const [strictConfig, setStrictConfig] = useState<StrictSearchConfig & { searchType: 'strict' }>({
    searchType: 'strict',
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

  // Legacy search configuration
  const [keywordInput, setKeywordInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [queryBuilderMode, setQueryBuilderMode] = useState<'simple' | 'advanced'>('simple');
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  // Query builder state
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCompanyType, setSelectedCompanyType] = useState('');
  const [excludeTerms, setExcludeTerms] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState('');
  
  const roleInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<LegacySearchConfig>({
    resolver: zodResolver(SearchConfigSchema),
    defaultValues: {
      jobQuery: '',
      timeFilterDays: 15,
      maxResultsPerQuery: 10,
      searchStartPosition: 1,
      keywords: ['stripe', 'payment', 'payments', 'fintech', 'billing', 'checkout'],
      minKeywordMatches: 1,
      atsplatforms: ['ashby', 'greenhouse', 'lever', 'powered_ashby', 'powered_greenhouse', 'powered_lever'],
      customAtsQueries: [],
      browserHeadless: true,
      pageTimeout: 20000,
      requestDelay: 1000,
      verboseLogging: false,
      debugMode: false,
    }
  });

  // Initialize with a user-friendly default query
  useEffect(() => {
    if (!watch('jobQuery')) {
      setValue('jobQuery', 'engineering manager remote');
    }
  }, [setValue, watch]);

  const selectedPlatforms = watch('atsplatforms') || [];
  const keywords = watch('keywords') || [];

  // Autocomplete helper functions
  const filterSuggestions = (input: string, suggestions: string[]) => {
    if (!input.trim()) return [];
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
  };

  const handleRoleInput = (value: string) => {
    setSelectedRole(value);
    const filtered = filterSuggestions(value, JOB_ROLE_SUGGESTIONS);
    setRoleSuggestions(filtered);
    setShowRoleSuggestions(filtered.length > 0);
  };

  const handleLocationInput = (value: string) => {
    setSelectedLocation(value);
    const filtered = filterSuggestions(value, LOCATION_SUGGESTIONS);
    setLocationSuggestions(filtered);
    setShowLocationSuggestions(filtered.length > 0);
  };

  const handleCompanyInput = (value: string) => {
    setSelectedCompanyType(value);
    const filtered = filterSuggestions(value, COMPANY_TYPE_SUGGESTIONS);
    setCompanySuggestions(filtered);
    setShowCompanySuggestions(filtered.length > 0);
  };

  // Build query from components
  const buildQueryFromComponents = () => {
    let query = '';
    
    if (selectedRole) {
      // Add quotes around multi-word roles
      const roleQuery = selectedRole.includes(' ') ? `"${selectedRole}"` : selectedRole;
      query += roleQuery;
    }
    
    if (selectedLocation) {
      query += query ? ` ${selectedLocation}` : selectedLocation;
    }
    
    if (selectedCompanyType) {
      query += query ? ` ${selectedCompanyType}` : selectedCompanyType;
    }
    
    // Add exclude terms
    if (excludeTerms.length > 0) {
      const excludeQuery = excludeTerms.map(term => `-${term}`).join(' ');
      query += query ? ` ${excludeQuery}` : excludeQuery;
    }
    
    return query;
  };

  // Update query when components change
  useEffect(() => {
    if (showQueryBuilder && queryBuilderMode === 'simple') {
      const newQuery = buildQueryFromComponents();
      if (newQuery !== watch('jobQuery')) {
        setValue('jobQuery', newQuery);
      }
    }
  }, [selectedRole, selectedLocation, selectedCompanyType, excludeTerms, showQueryBuilder, queryBuilderMode, setValue, watch]);

  // Add exclude term
  const addExcludeTerm = () => {
    if (excludeInput.trim() && !excludeTerms.includes(excludeInput.trim())) {
      setExcludeTerms([...excludeTerms, excludeInput.trim()]);
      setExcludeInput('');
    }
  };

  const removeExcludeTerm = (term: string) => {
    setExcludeTerms(excludeTerms.filter(t => t !== term));
  };

  // Load preset configuration
  const loadPreset = (presetKey: keyof typeof PRESET_CONFIGURATIONS) => {
    const preset = PRESET_CONFIGURATIONS[presetKey];
    const config = preset.config;
    
    // Update form values
    setValue('jobQuery', config.jobQuery);
    setValue('keywords', config.keywords);
    setValue('timeFilterDays', config.timeFilterDays);
    setValue('maxResultsPerQuery', config.maxResultsPerQuery);
    setValue('minKeywordMatches', config.minKeywordMatches);
    
    // Reset query builder state
    setSelectedRole('');
    setSelectedLocation('');
    setSelectedCompanyType('');
    setExcludeTerms([]);
    setShowQueryBuilder(false);
    
    // Show a brief confirmation
    alert(`✅ Loaded preset: ${preset.name}`);
  };

  const onSubmit = async (data?: LegacySearchConfig) => {
    setIsSubmitting(true);
    
    try {
      let config: SearchConfig;
      let name: string;

      if (searchMode === 'strict') {
        // Use strict configuration
        config = strictConfig;
        name = searchName || `Strict Search - ${new Date().toLocaleString()}`;
      } else {
        // Use legacy configuration
        if (!data) {
          throw new Error('Legacy search data is required');
        }
        config = { ...data, searchType: 'legacy' } as LegacySearchConfig & { searchType: 'legacy' };
        name = searchName || `Legacy Search - ${new Date().toLocaleString()}`;
      }

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

  const handleStrictSubmit = () => {
    // Validate strict config
    if (strictConfig.position.length === 0) {
      alert('Please add at least one job position');
      return;
    }
    if (strictConfig.location.length === 0) {
      alert('Please add at least one location');
      return;
    }
    if (strictConfig.atsplatforms.length === 0) {
      alert('Please select at least one ATS platform');
      return;
    }
    
    onSubmit();
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setValue('keywords', [...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setValue('keywords', keywords.filter(k => k !== keyword));
  };

  const loadKeywordTemplate = (template: keyof typeof KEYWORD_TEMPLATES) => {
    const templateKeywords = KEYWORD_TEMPLATES[template];
    const uniqueKeywords = Array.from(new Set([...keywords, ...templateKeywords]));
    setValue('keywords', uniqueKeywords);
  };

  const togglePlatform = (platformId: string) => {
    const newPlatforms = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId];
    setValue('atsplatforms', newPlatforms);
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

      {/* Search Mode Selector */}
      <SearchModeSelector 
        selectedMode={searchMode} 
        onModeChange={setSearchMode} 
      />

      {/* Configuration Based on Mode */}
      {searchMode === 'strict' ? (
        <>
          <StrictSearchConfiguration 
            onConfigChange={setStrictConfig}
            initialConfig={strictConfig}
            isLoading={isSubmitting}
          />
          
          {/* Submit Button for Strict Search */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleStrictSubmit}
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
                '🚀 Start Strict Search'
              )}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Enhanced Job Search Configuration */}
      <div className="card-themed">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-themed">🎯 What job are you looking for?</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              className="text-sm btn-primary-themed px-4 py-2 rounded-lg font-medium"
            >
              🚀 Quick Start Templates
            </button>
            <button
              type="button"
              onClick={() => setShowQueryBuilder(!showQueryBuilder)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium theme-transition"
              aria-label={showQueryBuilder ? 'Hide query builder' : 'Show query builder'}
            >
              {showQueryBuilder ? '✏️ Manual Entry' : '🛠️ Query Builder'}
            </button>
          </div>
        </div>

        {showQueryBuilder ? (
          /* Query Builder Interface */
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setQueryBuilderMode('simple')}
                className={`px-4 py-2 rounded-lg text-sm font-medium theme-transition ${
                  queryBuilderMode === 'simple'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-600'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                Simple Builder
              </button>
              <button
                type="button"
                onClick={() => setQueryBuilderMode('advanced')}
                className={`px-4 py-2 rounded-lg text-sm font-medium theme-transition ${
                  queryBuilderMode === 'advanced'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-600'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                Advanced Query
              </button>
            </div>

            {queryBuilderMode === 'simple' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Role Input with Autocomplete */}
                <div className="relative">
                  <label htmlFor="role-input" className="block text-sm font-medium text-themed mb-2">
                    Job Role *
                  </label>
                  <input
                    id="role-input"
                    ref={roleInputRef}
                    type="text"
                    value={selectedRole}
                    onChange={(e) => handleRoleInput(e.target.value)}
                    onFocus={() => handleRoleInput(selectedRole)}
                    onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                    placeholder="e.g., software engineer, product manager"
                    className="input-field"
                    aria-describedby="role-help"
                    autoComplete="off"
                  />
                  <p id="role-help" className="text-xs text-secondary-themed mt-1">
                    Start typing to see suggestions
                  </p>
                  
                  {showRoleSuggestions && roleSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {roleSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setSelectedRole(suggestion);
                            setShowRoleSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700 focus:outline-none text-sm text-themed theme-transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Input with Autocomplete */}
                <div className="relative">
                  <label htmlFor="location-input" className="block text-sm font-medium text-themed mb-2">
                    Location
                  </label>
                  <input
                    id="location-input"
                    ref={locationInputRef}
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onFocus={() => handleLocationInput(selectedLocation)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    placeholder="e.g., remote, san francisco, hybrid"
                    className="input-field"
                    aria-describedby="location-help"
                    autoComplete="off"
                  />
                  <p id="location-help" className="text-xs text-secondary-themed mt-1">
                    Leave empty for all locations
                  </p>
                  
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(suggestion);
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700 focus:outline-none text-sm text-themed theme-transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Type Input with Autocomplete */}
                <div className="relative">
                  <label htmlFor="company-input" className="block text-sm font-medium text-themed mb-2">
                    Company Type
                  </label>
                  <input
                    id="company-input"
                    ref={companyInputRef}
                    type="text"
                    value={selectedCompanyType}
                    onChange={(e) => handleCompanyInput(e.target.value)}
                    onFocus={() => handleCompanyInput(selectedCompanyType)}
                    onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                    placeholder="e.g., startup, fintech, enterprise"
                    className="input-field"
                    aria-describedby="company-help"
                    autoComplete="off"
                  />
                  <p id="company-help" className="text-xs text-secondary-themed mt-1">
                    Optional: filter by company type or industry
                  </p>
                  
                  {showCompanySuggestions && companySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {companySuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyType(suggestion);
                            setShowCompanySuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700 focus:outline-none text-sm text-themed theme-transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exclude Terms */}
                <div>
                  <label htmlFor="exclude-input" className="block text-sm font-medium text-themed mb-2">
                    Exclude Terms
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="exclude-input"
                      type="text"
                      value={excludeInput}
                      onChange={(e) => setExcludeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExcludeTerm())}
                      placeholder="e.g., intern, junior"
                      className="input-field flex-1"
                      aria-describedby="exclude-help"
                    />
                    <button
                      type="button"
                      onClick={addExcludeTerm}
                      className="btn-secondary"
                      aria-label="Add exclude term"
                    >
                      Add
                    </button>
                  </div>
                  <p id="exclude-help" className="text-xs text-secondary-themed mb-2">
                    Jobs containing these terms will be filtered out
                  </p>
                  
                  {excludeTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {excludeTerms.map((term) => (
                        <span
                          key={term}
                          className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 theme-transition"
                        >
                          -{term}
                          <button
                            type="button"
                            onClick={() => removeExcludeTerm(term)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 theme-transition"
                            aria-label={`Remove exclude term: ${term}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Advanced Query Mode - Manual Entry */
              <div>
                <label htmlFor="advanced-query" className="block text-sm font-medium text-gray-700 mb-2">
                  Advanced Search Query *
                </label>
                <textarea
                  id="advanced-query"
                  {...register('jobQuery')}
                  rows={3}
                  placeholder='("software engineer" OR "backend engineer") AND (remote OR "san francisco") -intern'
                  className="input-field resize-none"
                  aria-describedby="advanced-query-help"
                />
                <div id="advanced-query-help" className="text-sm text-gray-500 mt-2 space-y-1">
                  <p><strong>Google Search Operators:</strong></p>
                  <ul className="list-disc list-inside text-xs space-y-1 ml-4">
                    <li><code>OR</code> - Match either term: <code>"manager" OR "lead"</code></li>
                    <li><code>AND</code> - Match both terms: <code>engineer AND remote</code></li>
                    <li><code>"quotes"</code> - Exact phrase: <code>"product manager"</code></li>
                    <li><code>-exclude</code> - Exclude terms: <code>-intern -junior</code></li>
                    <li><code>()</code> - Group terms: <code>("frontend" OR "backend") engineer</code></li>
                  </ul>
                </div>
              </div>
            )}

            {/* Generated Query Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Search Query:</h4>
              <code className="text-sm text-gray-900 bg-white px-3 py-2 rounded border block">
                {watch('jobQuery') || 'Enter job details above to see the generated query'}
              </code>
            </div>
          </div>
        ) : (
          /* Manual Entry Mode */
          <div className="space-y-4">
            <div>
              <label htmlFor="manual-query" className="block text-sm font-medium text-gray-700 mb-2">
                Job Search Query *
              </label>
              <input
                id="manual-query"
                {...register('jobQuery')}
                type="text"
                placeholder="engineering manager remote"
                className="input-field text-lg"
                aria-describedby="manual-query-help"
              />
              {errors.jobQuery && (
                <p className="text-red-600 text-sm mt-1" role="alert">{errors.jobQuery.message}</p>
              )}
              <div id="manual-query-help" className="text-sm text-gray-500 mt-2">
                <p className="mb-1">💡 <strong>Examples:</strong></p>
                <ul className="text-xs space-y-1 ml-4">
                  <li>• <code>software engineer remote</code></li>
                  <li>• <code>"product manager" fintech</code></li>
                  <li>• <code>senior engineer -junior</code></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings - Collapsed by Default */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={showAdvanced}
            aria-controls="advanced-settings"
          >
            <span className="text-sm font-medium text-gray-700">
              ⚙️ Advanced Settings
            </span>
            <span className="text-gray-400">
              {showAdvanced ? '▼' : '▶'}
            </span>
          </button>
          
          {showAdvanced && (
            <div id="advanced-settings" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="time-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Filter (days)
                </label>
                <input
                  id="time-filter"
                  {...register('timeFilterDays', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="365"
                  className="input-field"
                  aria-describedby="time-filter-help"
                />
                <p id="time-filter-help" className="text-xs text-gray-500 mt-1">
                  Only show jobs posted within this many days
                </p>
              </div>
              <div>
                <label htmlFor="max-results" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Results per Platform
                </label>
                <input
                  id="max-results"
                  {...register('maxResultsPerQuery', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="10"
                  className="input-field"
                  aria-describedby="max-results-help"
                />
                <p id="max-results-help" className="text-xs text-gray-500 mt-1">
                  Limit results per job board (1-10)
                </p>
              </div>
              <div>
                <label htmlFor="min-keywords" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Keyword Matches
                </label>
                <input
                  id="min-keywords"
                  {...register('minKeywordMatches', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="input-field"
                  aria-describedby="min-keywords-help"
                />
                <p id="min-keywords-help" className="text-xs text-gray-500 mt-1">
                  Minimum keywords that must match
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keywords Configuration */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">🔍 Keyword Matching</h3>
        
        {/* Keyword Templates */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Quick templates:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(KEYWORD_TEMPLATES).map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => loadKeywordTemplate(template as keyof typeof KEYWORD_TEMPLATES)}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Keyword Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="Add keyword..."
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={addKeyword}
            className="btn-primary"
          >
            Add
          </button>
        </div>

        {/* Keyword Tags */}
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="text-gray-500 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        
        {errors.keywords && (
          <p className="text-red-600 text-sm mt-2">{errors.keywords.message}</p>
        )}
      </div>

      {/* ATS Platform Selection */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">🏢 ATS Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ATS_PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPlatforms.includes(platform.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{platform.name}</h4>
                    {platform.popular && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform.id)}
                  onChange={() => togglePlatform(platform.id)}
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>
        
        {errors.atsplatforms && (
          <p className="text-red-600 text-sm mt-2">{errors.atsplatforms.message}</p>
        )}
      </div>

      {/* Advanced Settings */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
          ⚙️ Advanced Settings
        </summary>
        <div className="p-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Timeout (ms)
              </label>
              <input
                {...register('pageTimeout', { valueAsNumber: true })}
                type="number"
                min="5000"
                max="60000"
                step="1000"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Delay (ms)
              </label>
              <input
                {...register('requestDelay', { valueAsNumber: true })}
                type="number"
                min="0"
                max="10000"
                step="100"
                className="input-field"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom User Agent (optional)
            </label>
            <input
              {...register('userAgent')}
              type="text"
              placeholder="Mozilla/5.0 (compatible; JobSearchBot/1.0)"
              className="input-field"
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                {...register('verboseLogging')}
                type="checkbox"
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Verbose Logging</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('debugMode')}
                type="checkbox"
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Debug Mode</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('browserHeadless')}
                type="checkbox"
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Headless Browser</span>
            </label>
          </div>
        </div>
      </details>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn-primary text-lg px-8 py-3 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? '🔄 Starting Search...' : '🚀 Start Job Search'}
        </button>
      </div>
    </form>

    {/* Quick Start Templates Modal */}
    {showTemplatesModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🚀 Quick Start Templates</h2>
              <p className="text-sm text-gray-600 mt-2">
                Choose from popular job search configurations to get started quickly, then customize as needed.
              </p>
            </div>
            <button
              onClick={() => setShowTemplatesModal(false)}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(PRESET_CONFIGURATIONS).map(([key, preset]) => (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => {
                    loadPreset(key as keyof typeof PRESET_CONFIGURATIONS);
                    setShowTemplatesModal(false);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {preset.name}
                    </h4>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Load ${preset.name} preset`}
                    >
                      Use This
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {preset.description}
                  </p>
                  
                  <div className="space-y-2 text-xs text-gray-500">
                    <div>
                      <strong>Query:</strong> <code className="bg-gray-100 px-1 rounded">{preset.config.jobQuery}</code>
                    </div>
                    <div>
                      <strong>Keywords:</strong> {preset.config.keywords.slice(0, 3).join(', ')}
                      {preset.config.keywords.length > 3 && ` +${preset.config.keywords.length - 3} more`}
                    </div>
                    <div className="flex gap-4">
                      <span><strong>Days:</strong> {preset.config.timeFilterDays}</span>
                      <span><strong>Results:</strong> {preset.config.maxResultsPerQuery}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-lg">💡</span>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Pro Tip</h4>
                  <p className="text-sm text-blue-800">
                    Start with a preset that's close to what you're looking for, then use the query builder or manual entry to fine-tune your search.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
        </form>
      )}
    </div>
  );
}
