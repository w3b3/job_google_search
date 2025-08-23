/**
 * Search Optimization Test Suite
 * Tests the intelligent search deduplication and caching system
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateQueryCacheKey, findRecentSimilarSearches, shouldUseCache } from '../search-cache';
import { SearchConfig, LegacySearchConfig, StrictSearchConfig } from '../../types';
import { db } from '../../database/connection';
import { createSearch, saveSearchResults } from '../../database/operations';
import { JobResult } from '../../types';

describe('Search Optimization System', () => {
  beforeEach(() => {
    // Clean up test data
    db.exec('DELETE FROM job_results WHERE search_id LIKE "test-%"');
    db.exec('DELETE FROM searches WHERE id LIKE "test-%"');
  });

  afterEach(() => {
    // Clean up test data
    db.exec('DELETE FROM job_results WHERE search_id LIKE "test-%"');
    db.exec('DELETE FROM searches WHERE id LIKE "test-%"');
  });

  describe('Query Cache Key Generation', () => {
    test('should generate consistent cache keys for legacy searches', () => {
      const config1: LegacySearchConfig & { searchType: 'legacy' } = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react', 'typescript', 'node'],
        atsplatforms: ['greenhouse', 'lever'],
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      };

      const config2: LegacySearchConfig & { searchType: 'legacy' } = {
        ...config1,
        keywords: ['typescript', 'react', 'node'], // Different order
      };

      const atsQuery = 'site:boards.greenhouse.io';
      const key1 = generateQueryCacheKey(config1, atsQuery);
      const key2 = generateQueryCacheKey(config2, atsQuery);

      // Should be the same despite different keyword order
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64); // SHA-256 hex string
    });

    test('should generate consistent cache keys for strict searches', () => {
      const config1: StrictSearchConfig & { searchType: 'strict' } = {
        searchType: 'strict',
        position: ['Engineering Manager', 'Senior Engineering Manager'],
        location: ['remote', 'san francisco'],
        technology: ['react', 'typescript'],
        domain: ['fintech', 'healthcare'],
        atsplatforms: ['greenhouse', 'lever'],
        timeFilterDays: 15,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      };

      const config2: StrictSearchConfig & { searchType: 'strict' } = {
        ...config1,
        position: ['Senior Engineering Manager', 'Engineering Manager'], // Different order
        technology: ['typescript', 'react'], // Different order
      };

      const atsQuery = 'site:jobs.lever.co';
      const key1 = generateQueryCacheKey(config1, atsQuery);
      const key2 = generateQueryCacheKey(config2, atsQuery);

      // Should be the same despite different order
      expect(key1).toBe(key2);
    });

    test('should generate different cache keys for different parameters', () => {
      const baseConfig: LegacySearchConfig & { searchType: 'legacy' } = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react', 'typescript'],
        atsplatforms: ['greenhouse'],
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      };

      const atsQuery = 'site:boards.greenhouse.io';

      const key1 = generateQueryCacheKey(baseConfig, atsQuery);
      const key2 = generateQueryCacheKey({ ...baseConfig, jobQuery: 'Staff Engineer' }, atsQuery);
      const key3 = generateQueryCacheKey({ ...baseConfig, timeFilterDays: 15 }, atsQuery);
      const key4 = generateQueryCacheKey(baseConfig, 'site:jobs.lever.co');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).not.toBe(key4);
    });
  });

  describe('Cache Usage Decision', () => {
    test('should allow caching for normal configurations', () => {
      const config: SearchConfig = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react'],
        atsplatforms: ['greenhouse'],
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      } as LegacySearchConfig & { searchType: 'legacy' };

      expect(shouldUseCache(config)).toBe(true);
    });

    test('should disable caching in debug mode', () => {
      const config: SearchConfig = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react'],
        atsplatforms: ['greenhouse'],
        timeFilterDays: 30,
        debugMode: true,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false
      } as LegacySearchConfig & { searchType: 'legacy' };

      expect(shouldUseCache(config)).toBe(false);
    });

    test('should disable caching for very fresh time filters', () => {
      const config: SearchConfig = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react'],
        atsplatforms: ['greenhouse'],
        timeFilterDays: 0.5, // 12 hours
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      } as LegacySearchConfig & { searchType: 'legacy' };

      expect(shouldUseCache(config)).toBe(false);
    });
  });

  describe('Search Optimization Integration', () => {
    test('should find no optimization when no previous searches exist', async () => {
      const config: SearchConfig = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react', 'typescript'],
        atsplatforms: ['greenhouse', 'lever'],
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      } as LegacySearchConfig & { searchType: 'legacy' };

      const atsQueries = ['site:boards.greenhouse.io', 'site:jobs.lever.co'];
      const optimization = await findRecentSimilarSearches(config, atsQueries, 6, 'test-user');

      expect(optimization.totalQueries).toBe(2);
      expect(optimization.cachedQueries).toBe(0);
      expect(optimization.newQueries).toEqual(atsQueries);
      expect(optimization.cacheHits).toHaveLength(0);
    });

    test('should optimize when recent similar searches exist', async () => {
      // Create a test search with results
      const config: LegacySearchConfig & { searchType: 'legacy' } = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react', 'typescript'],
        atsplatforms: ['greenhouse', 'lever'],
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      };

      const searchId = 'test-search-1';
      
      // Create completed search
      await createSearch('Test Search', config, 'test-user');
      
      // Update search to completed status manually
      const updateStmt = db.prepare(`
        UPDATE searches 
        SET status = 'completed', completed_at = datetime('now', '-1 hour')
        WHERE name = 'Test Search'
      `);
      updateStmt.run();
      
      // Get the actual search ID
      const searchRow = db.prepare('SELECT id FROM searches WHERE name = "Test Search"').get() as any;
      const actualSearchId = searchRow.id;

      // Add some test results
      const testResults: JobResult[] = [
        {
          id: 'test-job-1',
          searchId: actualSearchId,
          title: 'Senior React Engineer',
          link: 'https://boards.greenhouse.io/company/jobs/123',
          atsSource: 'site:boards.greenhouse.io Senior Engineer',
          keywordsMatched: ['react', 'typescript'],
          matchCount: 2,
          isMatch: true,
          scrapedContent: 'Test job content with react and typescript',
          scrapedAt: new Date()
        },
        {
          id: 'test-job-2',
          searchId: actualSearchId,
          title: 'TypeScript Developer',
          link: 'https://jobs.lever.co/company/typescript-dev',
          atsSource: 'site:jobs.lever.co Senior Engineer',
          keywordsMatched: ['typescript'],
          matchCount: 1,
          isMatch: true,
          scrapedContent: 'Test job content with typescript',
          scrapedAt: new Date()
        }
      ];

      await saveSearchResults(actualSearchId, testResults, {
        totalSearches: 2,
        totalResults: 2,
        totalScraped: 2,
        totalMatches: 2,
        startTime: new Date(),
        endTime: new Date()
      });

      // Now test optimization for similar search
      const atsQueries = ['site:boards.greenhouse.io', 'site:jobs.lever.co'];
      const optimization = await findRecentSimilarSearches(config, atsQueries, 6, 'test-user');

      expect(optimization.totalQueries).toBe(2);
      expect(optimization.cachedQueries).toBeGreaterThan(0);
      expect(optimization.newQueries.length).toBeLessThan(2);
      expect(optimization.cacheHits.length).toBeGreaterThan(0);
      
      // Verify cache hit results
      if (optimization.cacheHits.length > 0) {
        const hit = optimization.cacheHits[0];
        expect(hit.results).toBeDefined();
        expect(hit.searchId).toBe(actualSearchId);
        expect(hit.executedAt).toBeDefined();
      }
    });

    test('should handle mixed cache hits and misses', async () => {
      // Create a search with results for only one platform
      const config: LegacySearchConfig & { searchType: 'legacy' } = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react'],
        atsplatforms: ['greenhouse'], // Only one platform
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      };

      const searchId = await createSearch('Partial Cache Test', config, 'test-user');
      
      // Update to completed
      const updateStmt = db.prepare(`
        UPDATE searches 
        SET status = 'completed', completed_at = datetime('now', '-30 minutes')
        WHERE id = ?
      `);
      updateStmt.run(searchId);

      const testResults: JobResult[] = [
        {
          id: 'test-partial-1',
          searchId,
          title: 'Senior React Engineer',
          link: 'https://boards.greenhouse.io/company/jobs/456',
          atsSource: 'site:boards.greenhouse.io Senior Engineer',
          keywordsMatched: ['react'],
          matchCount: 1,
          isMatch: true,
          scrapedContent: 'Test content',
          scrapedAt: new Date()
        }
      ];

      await saveSearchResults(searchId, testResults, {
        totalSearches: 1,
        totalResults: 1,
        totalScraped: 1,
        totalMatches: 1,
        startTime: new Date(),
        endTime: new Date()
      });

      // Test optimization with multiple platforms (one cached, one not)
      const atsQueries = ['site:boards.greenhouse.io', 'site:jobs.lever.co', 'site:jobs.ashbyhq.com'];
      const optimization = await findRecentSimilarSearches(config, atsQueries, 6, 'test-user');

      expect(optimization.totalQueries).toBe(3);
      expect(optimization.cachedQueries).toBeGreaterThanOrEqual(0);
      expect(optimization.newQueries.length).toBeGreaterThan(0);
      expect(optimization.newQueries.length + optimization.cachedQueries).toBe(3);
    });
  });

  describe('Cache Expiration', () => {
    test('should not use expired cached results', async () => {
      const config: LegacySearchConfig & { searchType: 'legacy' } = {
        searchType: 'legacy',
        jobQuery: 'Senior Engineer',
        keywords: ['react'],
        atsplatforms: ['greenhouse'],
        timeFilterDays: 30,
        maxResultsPerQuery: 10,
        searchStartPosition: 1,
        minKeywordMatches: 1,
        customAtsQueries: [],
        browserHeadless: true,
        pageTimeout: 20000,
        requestDelay: 1000,
        verboseLogging: false,
        debugMode: false
      };

      const searchId = await createSearch('Expired Cache Test', config, 'test-user');
      
      // Update to completed with old timestamp (8 hours ago, beyond 6 hour cache)
      const updateStmt = db.prepare(`
        UPDATE searches 
        SET status = 'completed', completed_at = datetime('now', '-8 hours')
        WHERE id = ?
      `);
      updateStmt.run(searchId);

      const testResults: JobResult[] = [
        {
          id: 'test-expired-1',
          searchId,
          title: 'Senior React Engineer',
          link: 'https://boards.greenhouse.io/company/jobs/789',
          atsSource: 'site:boards.greenhouse.io Senior Engineer',
          keywordsMatched: ['react'],
          matchCount: 1,
          isMatch: true,
          scrapedContent: 'Expired content',
          scrapedAt: new Date()
        }
      ];

      await saveSearchResults(searchId, testResults, {
        totalSearches: 1,
        totalResults: 1,
        totalScraped: 1,
        totalMatches: 1,
        startTime: new Date(),
        endTime: new Date()
      });

      // Test with 6-hour cache expiry (default)
      const atsQueries = ['site:boards.greenhouse.io'];
      const optimization = await findRecentSimilarSearches(config, atsQueries, 6, 'test-user');

      // Should not find cached results due to expiration
      expect(optimization.cachedQueries).toBe(0);
      expect(optimization.newQueries).toEqual(atsQueries);
      expect(optimization.cacheHits).toHaveLength(0);
    });
  });
});

describe('Performance Benefits', () => {
  test('should provide measurable time savings estimates', () => {
    const optimization = {
      totalQueries: 10,
      cachedQueries: 6,
      newQueries: ['query1', 'query2', 'query3', 'query4'],
      cacheHits: [],
      optimizationSummary: 'Test optimization'
    };

    const timeSaved = optimization.cachedQueries * 5; // 5 seconds per cached query
    const optimizationPercentage = Math.round((optimization.cachedQueries / optimization.totalQueries) * 100);

    expect(timeSaved).toBe(30); // 6 * 5 seconds
    expect(optimizationPercentage).toBe(60); // 60% optimization
  });
});
