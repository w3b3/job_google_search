'use client';

import React from 'react';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export type SearchMode = 'strict' | 'legacy';

interface SearchModeSelectorProps {
  selectedMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const SEARCH_MODES = [
  {
    id: 'strict' as const,
    name: 'Strict Search',
    description: 'Laser-focused search with precise parameters',
    icon: '🎯',
    features: [
      'Exact job title matching',
      'Precise location filtering', 
      'Technology stack requirements',
      'Industry domain targeting',
      'Higher quality results',
      'Fewer false positives'
    ],
    recommended: true,
    badge: 'Recommended'
  },
  {
    id: 'legacy' as const,
    name: 'Legacy Search',
    description: 'Traditional keyword-based search',
    icon: '🔍',
    features: [
      'Flexible keyword matching',
      'Broader result coverage',
      'Content-based filtering',
      'Backward compatibility',
      'More results (may include irrelevant ones)'
    ],
    recommended: false,
    badge: 'Classic'
  }
];

export default function SearchModeSelector({ selectedMode, onModeChange }: SearchModeSelectorProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-themed">Choose Search Mode</h2>
        <p className="text-sm text-secondary-themed">
          Select how you want to configure your job search
        </p>
      </div>

      <RadioGroup value={selectedMode} onChange={onModeChange}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SEARCH_MODES.map((mode) => (
            <RadioGroup.Option
              key={mode.id}
              value={mode.id}
              className={({ active, checked }) =>
                `relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none ${
                  checked
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                } ${
                  active ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{mode.icon}</span>
                        <RadioGroup.Label className="font-medium text-themed">
                          {mode.name}
                        </RadioGroup.Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {mode.recommended && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            {mode.badge}
                          </span>
                        )}
                        {checked && (
                          <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    
                    <RadioGroup.Description className="text-sm text-secondary-themed mb-3">
                      {mode.description}
                    </RadioGroup.Description>
                    
                    <ul className="space-y-1">
                      {mode.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-xs text-secondary-themed">
                          <span className="mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>

      {/* Mode-specific tips */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {selectedMode === 'strict' ? (
          <div>
            <h4 className="text-sm font-medium text-themed mb-2">💡 Strict Search Tips</h4>
            <ul className="text-xs text-secondary-themed space-y-1">
              <li>• Use specific job titles like "Engineering Manager" instead of just "Manager"</li>
              <li>• Add technology requirements to filter for relevant tech stacks</li>
              <li>• Include industry domains to target specific sectors</li>
              <li>• Results will be highly relevant but potentially fewer in number</li>
            </ul>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-themed mb-2">💡 Legacy Search Tips</h4>
            <ul className="text-xs text-secondary-themed space-y-1">
              <li>• Use broader keywords to capture more variations</li>
              <li>• Expect to filter through more results manually</li>
              <li>• Good for exploratory searches when you're not sure of exact requirements</li>
              <li>• May include some irrelevant results that mention your keywords</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
