'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SearchConfigSchema, SearchConfig } from '@/lib/types';
import { useRouter } from 'next/navigation';

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

export default function SearchConfiguration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<SearchConfig>({
    resolver: zodResolver(SearchConfigSchema),
    defaultValues: {
      jobQuery: '("engineering manager" OR "engineering lead") remote',
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

  const selectedPlatforms = watch('atsplatforms') || [];
  const keywords = watch('keywords') || [];

  const onSubmit = async (data: SearchConfig) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/search/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Search - ${new Date().toLocaleString()}`,
          config: data
        })
      });

      const result = await response.json();

      if (result.success) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Job Search Configuration */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">🎯 Job Search Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Query *
            </label>
            <input
              {...register('jobQuery')}
              type="text"
              placeholder='("engineering manager" OR "engineering lead") remote'
              className="input-field"
            />
            {errors.jobQuery && (
              <p className="text-red-600 text-sm mt-1">{errors.jobQuery.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Use Google search operators: OR, AND, quotes, parentheses, -exclude
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Filter (days)
              </label>
              <input
                {...register('timeFilterDays', { valueAsNumber: true })}
                type="number"
                min="1"
                max="365"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Results per Platform
              </label>
              <input
                {...register('maxResultsPerQuery', { valueAsNumber: true })}
                type="number"
                min="1"
                max="10"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Keyword Matches
              </label>
              <input
                {...register('minKeywordMatches', { valueAsNumber: true })}
                type="number"
                min="1"
                className="input-field"
              />
            </div>
          </div>
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
  );
}
