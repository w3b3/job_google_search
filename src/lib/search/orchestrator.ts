import { SearchConfig, JobResult, ProgressCallback, LegacySearchConfig, StrictSearchConfig } from '../types';
import { performGoogleSearch, buildSearchQueries } from './google-search';
import { scrapeJobContent, checkKeywordMatch } from './scraper';

export interface SearchStats {
  totalSearches: number;
  totalResults: number;
  totalScraped: number;
  totalMatches: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Main orchestrator function that performs the complete job search
 * Ported and enhanced from original main() function
 */
export async function performFullSearch(
  config: SearchConfig,
  onProgress?: ProgressCallback
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
  
  // Log startup information
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
    console.log(`[VERBOSE] 🏢 ATS Platforms: ${searchQueries.length} configured`);
    console.log(`[VERBOSE] ⏱️ Time Filter: ${config.timeFilterDays} days`);
  }
  
  // Progress tracking
  onProgress?.({
    percentage: 0,
    message: `Starting search across ${searchQueries.length} platforms...`,
    currentPlatform: undefined,
    platformsCompleted: 0,
    totalPlatforms: searchQueries.length,
    resultsFound: 0,
    pagesScraped: 0
  });
  
  // Process each search query
  for (let index = 0; index < searchQueries.length; index++) {
    const fullQuery = searchQueries[index];
    const platformProgress = (index / searchQueries.length) * 100;
    
    if (config.verboseLogging) {
      console.log(`[VERBOSE] [${index + 1}/${searchQueries.length}] Executing query: ${fullQuery}`);
    }
    
    onProgress?.({
      percentage: platformProgress,
      message: `Searching query ${index + 1}...`,
      currentPlatform: `Query ${index + 1}`,
      platformsCompleted: index,
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
        const resultProgress = platformProgress + ((resultIndex / searchResults.length) * (100 / atsQueries.length));
        
        if (config.verboseLogging) {
          console.log(`[VERBOSE] [${resultIndex + 1}/${searchResults.length}] Analyzing: "${title}"`);
        }
        
        onProgress?.({
          percentage: resultProgress,
          message: `Analyzing: "${title.substring(0, 50)}..."`,
          currentPlatform: ats,
          platformsCompleted: index,
          totalPlatforms: atsQueries.length,
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
  onProgress?.({
    percentage: 100,
    message: `Search completed! Found ${stats.totalMatches} matching jobs.`,
    currentPlatform: undefined,
    platformsCompleted: atsQueries.length,
    totalPlatforms: atsQueries.length,
    resultsFound: stats.totalMatches,
    pagesScraped: stats.totalScraped
  });
  
  // Log final statistics
  if (config.verboseLogging) {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Search Complete - Statistics:');
    console.log(`   ATS Platforms Searched: ${stats.totalSearches}`);
    console.log(`   Total Results Found: ${stats.totalResults}`);
    console.log(`   Pages Successfully Scraped: ${stats.totalScraped}`);
    console.log(`   Matching Jobs Found: ${stats.totalMatches}`);
    console.log(`   Duration: ${duration.toFixed(1)} seconds`);
    
    if (stats.totalScraped > 0) {
      const matchRate = (stats.totalMatches / stats.totalScraped * 100).toFixed(1);
      console.log(`   Match Rate: ${matchRate}%`);
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
