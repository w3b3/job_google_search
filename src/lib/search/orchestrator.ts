import { SearchConfig, JobResult, ProgressCallback, LegacySearchConfig, StrictSearchConfig } from '../types';
import { performGoogleSearch, buildSearchQueries } from './google-search';
import { scrapeJobContent, checkKeywordMatch } from './scraper';
import { findRecentSimilarSearches, shouldUseCache, SearchOptimizationResult } from './search-cache';

export interface SearchStats {
  totalSearches: number;
  totalResults: number;
  totalScraped: number;
  totalMatches: number;
  startTime: Date;
  endTime?: Date;
  
  // Cache optimization statistics
  cacheOptimization?: {
    totalQueries: number;
    cachedQueries: number;
    newQueries: number;
    optimizationPercentage: number;
    cacheHits: number;
    timeSaved: number; // Estimated seconds saved
  };
}

/**
 * Main orchestrator function that performs the complete job search
 * Enhanced with intelligent caching and search optimization
 */
export async function performFullSearch(
  config: SearchConfig,
  onProgress?: ProgressCallback,
  userId?: string
): Promise<{ results: JobResult[], stats: SearchStats }> {
  const startTime = new Date();
  
  // Initialize statistics
  const stats: SearchStats = {
    totalSearches: 0,
    totalResults: 0,
    totalScraped: 0,
    totalMatches: 0,
    startTime
  };
  
  const matchingJobs: JobResult[] = [];
  const searchQueries = buildSearchQueries(config);
  stats.totalSearches = searchQueries.length;
  
  // 🚀 SEARCH OPTIMIZATION: Check for cached results
  let optimization: SearchOptimizationResult | null = null;
  if (shouldUseCache(config)) {
    optimization = await findRecentSimilarSearches(config, searchQueries, 6, userId);
    
    // Add cached results to our result set
    if (optimization.cacheHits.length > 0) {
      for (const hit of optimization.cacheHits) {
        // Update results to have new searchId (will be set by caller)
        const cachedResults = hit.results.map(result => ({
          ...result,
          searchId: '', // Will be updated by caller
          scrapedAt: hit.executedAt // Use cache hit timestamp for context
        }));
        
        matchingJobs.push(...cachedResults);
        stats.totalResults += hit.results.length;
        stats.totalScraped += hit.results.length;
        stats.totalMatches += hit.results.filter(r => r.isMatch).length;
      }
      
      if (config.verboseLogging) {
        console.log(`[CACHE] 📦 Loaded ${matchingJobs.length} cached results from ${optimization.cacheHits.length} cached queries`);
      }
    }
    
    // Update stats with optimization metrics
    stats.cacheOptimization = {
      totalQueries: optimization.totalQueries,
      cachedQueries: optimization.cachedQueries,
      newQueries: optimization.newQueries.length,
      optimizationPercentage: Math.round((optimization.cachedQueries / optimization.totalQueries) * 100),
      cacheHits: optimization.cacheHits.length,
      timeSaved: optimization.cachedQueries * 5 // Estimate 5 seconds saved per cached query
    };
  }
  
  // Determine which queries to actually execute
  const queriesToExecute = optimization ? optimization.newQueries : searchQueries;
  const totalQueriesToExecute = queriesToExecute.length;
  
  // Log startup information with optimization details
  if (config.verboseLogging) {
    if (config.searchType === 'strict') {
      const strictConfig = config as StrictSearchConfig & { searchType: 'strict' };
      console.log(`[VERBOSE] 🚀 Starting STRICT job search`);
      console.log(`[VERBOSE] 🎯 Positions: [${strictConfig.position.join(', ')}]`);
      console.log(`[VERBOSE] 📍 Locations: [${strictConfig.location.join(', ')}]`);
      console.log(`[VERBOSE] 💻 Technologies: [${strictConfig.technology?.join(', ') || 'None'}]`);
      console.log(`[VERBOSE] 🏢 Domains: [${strictConfig.domain?.join(', ') || 'None'}]`);
    } else {
      const legacyConfig = config as LegacySearchConfig & { searchType: 'legacy' };
      console.log(`[VERBOSE] 🚀 Starting job search for: "${legacyConfig.jobQuery}"`);
      console.log(`[VERBOSE] 🔍 Scanning for keywords: [${legacyConfig.keywords.join(', ')}]`);
    }
    console.log(`[VERBOSE] 🏢 ATS Platforms: ${searchQueries.length} total configured`);
    
    if (optimization && optimization.cachedQueries > 0) {
      console.log(`[VERBOSE] ⚡ Search Optimization ENABLED`);
      console.log(`[VERBOSE] 📊 ${optimization.optimizationSummary}`);
      console.log(`[VERBOSE] 🎯 Executing ${totalQueriesToExecute} new queries (${optimization.cachedQueries} cached)`);
    } else {
      console.log(`[VERBOSE] 🔍 Executing all ${totalQueriesToExecute} queries (no cache hits)`);
    }
    
    console.log(`[VERBOSE] ⏱️ Time Filter: ${config.timeFilterDays} days`);
  }
  
  // Progress tracking (account for cached results)
  const cachedResults = matchingJobs.length;
  onProgress?.({
    percentage: optimization && optimization.cachedQueries > 0 ? (optimization.cachedQueries / searchQueries.length) * 100 : 0,
    message: optimization && optimization.cachedQueries > 0 
      ? `Found ${cachedResults} cached results, searching ${totalQueriesToExecute} new queries...`
      : `Starting search across ${searchQueries.length} platforms...`,
    currentPlatform: undefined,
    platformsCompleted: optimization ? optimization.cachedQueries : 0,
    totalPlatforms: searchQueries.length,
    resultsFound: stats.totalMatches,
    pagesScraped: stats.totalScraped
  });
  
  // Process each NEW search query (skipping cached ones)
  for (let index = 0; index < queriesToExecute.length; index++) {
    const fullQuery = queriesToExecute[index];
    const platformsAlreadyCompleted = optimization ? optimization.cachedQueries : 0;
    const platformProgress = ((platformsAlreadyCompleted + index) / searchQueries.length) * 100;
    
    if (config.verboseLogging) {
      console.log(`[VERBOSE] [${platformsAlreadyCompleted + index + 1}/${searchQueries.length}] Executing NEW query: ${fullQuery}`);
    }
    
    onProgress?.({
      percentage: platformProgress,
      message: `Searching query ${platformsAlreadyCompleted + index + 1}/${searchQueries.length}...`,
      currentPlatform: `Query ${platformsAlreadyCompleted + index + 1}`,
      platformsCompleted: platformsAlreadyCompleted + index,
      totalPlatforms: searchQueries.length,
      resultsFound: stats.totalMatches,
      pagesScraped: stats.totalScraped
    });
    
    try {
      // Perform Google search
      const searchResults = await performGoogleSearch(fullQuery, config);
      stats.totalResults += searchResults.length;
      
      if (searchResults.length === 0) {
        if (config.verboseLogging) {
          console.log(`[VERBOSE] No results found for query: ${fullQuery}`);
        }
        continue;
      }
      
      if (config.verboseLogging) {
        console.log(`[VERBOSE] Found ${searchResults.length} results to analyze`);
      }
      
      // Process each search result
      for (let resultIndex = 0; resultIndex < searchResults.length; resultIndex++) {
        const item = searchResults[resultIndex];
        const { title, link } = item;
        const resultProgress = platformProgress + ((resultIndex / searchResults.length) * (100 / searchQueries.length));
        
        if (config.verboseLogging) {
          console.log(`[VERBOSE] [${resultIndex + 1}/${searchResults.length}] Analyzing: "${title}"`);
        }
        
        onProgress?.({
          percentage: resultProgress,
          message: `Analyzing: "${title.substring(0, 50)}..."`,
          currentPlatform: `Query ${platformsAlreadyCompleted + index + 1}`,
          platformsCompleted: platformsAlreadyCompleted + index,
          totalPlatforms: searchQueries.length,
          resultsFound: stats.totalMatches,
          pagesScraped: stats.totalScraped
        });
        
        try {
          // Scrape job content
          const content = await scrapeJobContent(link, config);
          if (!content) {
            if (config.debugMode) {
              console.log(`[DEBUG] No content scraped from ${link}`);
            }
            continue;
          }
          
          stats.totalScraped++;
          
          // Check matches based on search type
          let foundKeywords: string[] = [];
          let isMatch = false;
          
          if (config.searchType === 'strict') {
            // For strict search, Google already filtered results, so all results are matches
            isMatch = true;
            foundKeywords = []; // No keyword matching needed for strict search
          } else {
            // Legacy keyword matching
            const legacyConfig = config as LegacySearchConfig & { searchType: 'legacy' };
            foundKeywords = checkKeywordMatch(content, legacyConfig.keywords, legacyConfig.minKeywordMatches);
            isMatch = foundKeywords.length > 0;
          }
          
          // Store ALL results, regardless of keyword matches
          const jobResult: JobResult = {
            id: '', // Will be set when saved to database
            searchId: '', // Will be set by caller
            title,
            link,
            atsSource: fullQuery,
            keywordsMatched: foundKeywords,
            matchCount: foundKeywords.length,
            isMatch,
            scrapedContent: content,
            scrapedAt: new Date()
          };
          
          matchingJobs.push(jobResult);
          
          if (isMatch) {
            stats.totalMatches++;
            if (config.verboseLogging) {
              console.log(`[VERBOSE] ✅ MATCH FOUND! Keywords: [${foundKeywords.join(', ')}]`);
            }
          } else if (config.debugMode) {
            console.log(`[DEBUG] No keyword matches found for ${link} - storing anyway`);
          }
          
        } catch (error) {
          console.error(`[ERROR] Failed to process ${link}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
    } catch (error) {
      console.error(`[ERROR] Failed to execute search query:`, error instanceof Error ? error.message : 'Unknown error');
      // Continue with next query
    }
  }
  
  stats.endTime = new Date();
  const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
  
  // Final progress update
  const finalMessage = optimization && optimization.cachedQueries > 0
    ? `Search completed! Found ${stats.totalMatches} matching jobs (${optimization.cachedQueries} queries cached, ${optimization.optimizationPercentage}% faster).`
    : `Search completed! Found ${stats.totalMatches} matching jobs.`;
  
  onProgress?.({
    percentage: 100,
    message: finalMessage,
    currentPlatform: undefined,
    platformsCompleted: searchQueries.length,
    totalPlatforms: searchQueries.length,
    resultsFound: stats.totalMatches,
    pagesScraped: stats.totalScraped
  });
  
  // Log final statistics
  if (config.verboseLogging) {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Search Complete - Statistics:');
    console.log(`   ATS Platforms Configured: ${stats.totalSearches}`);
    console.log(`   Total Results Found: ${stats.totalResults}`);
    console.log(`   Pages Successfully Scraped: ${stats.totalScraped}`);
    console.log(`   Matching Jobs Found: ${stats.totalMatches}`);
    console.log(`   Duration: ${duration.toFixed(1)} seconds`);
    
    // Cache optimization statistics
    if (stats.cacheOptimization && stats.cacheOptimization.cachedQueries > 0) {
      console.log('\n⚡ Search Optimization Results:');
      console.log(`   Queries Executed: ${stats.cacheOptimization.newQueries}/${stats.cacheOptimization.totalQueries}`);
      console.log(`   Queries Cached: ${stats.cacheOptimization.cachedQueries} (${stats.cacheOptimization.optimizationPercentage}%)`);
      console.log(`   Estimated Time Saved: ${stats.cacheOptimization.timeSaved} seconds`);
      console.log(`   Cache Hit Rate: ${stats.cacheOptimization.cacheHits} cache hits`);
    } else {
      console.log('\n🔍 No cached results used (all queries executed fresh)');
    }
    
    if (stats.totalScraped > 0) {
      const matchRate = (stats.totalMatches / stats.totalScraped * 100).toFixed(1);
      console.log(`\n📊 Match Rate: ${matchRate}%`);
    }
    console.log('='.repeat(60));
  }
  
  // Sort results by match count (descending)
  matchingJobs.sort((a, b) => b.matchCount - a.matchCount);
  
  return {
    results: matchingJobs,
    stats
  };
}
