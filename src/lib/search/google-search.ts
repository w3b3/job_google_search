import { SearchConfig, GoogleSearchResult } from '../types';

/**
 * Performs a Google Custom Search API query
 * Ported from original performSearch function
 */
export async function performGoogleSearch(
  query: string, 
  config: SearchConfig
): Promise<GoogleSearchResult[]> {
  const { timeFilterDays, searchStartPosition, maxResultsPerQuery } = config;
  
  // Get API keys from environment variables
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCseId = process.env.GOOGLE_CSE_ID;

  if (!googleApiKey || !googleCseId) {
    throw new Error('GOOGLE_API_KEY and GOOGLE_CSE_ID must be provided in environment variables');
  }

  const dateRestrict = `d[${timeFilterDays}]`;
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodedQuery}&dateRestrict=${dateRestrict}&start=${searchStartPosition}&num=${maxResultsPerQuery}`;

  if (config.debugMode) {
    console.log(`[DEBUG] API URL: ${url.replace(googleApiKey, '[REDACTED]')}`);
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      throw new Error(`Google API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const results = data.items || [];
    
    if (config.verboseLogging) {
      console.log(`[VERBOSE] Found ${results.length} results for query: ${query}`);
    }
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ERROR] Failed to fetch results for query "${query}": ${errorMessage}`);
    
    // If it's a rate limit error, throw a specific error
    if (errorMessage.includes('429') || errorMessage.includes('quotaExceeded')) {
      throw new Error('Google API quota exceeded. Please try again later or check your API limits.');
    }
    
    return [];
  }
}

/**
 * Build ATS queries based on configuration
 * Ported from original buildATSQueries function
 */
export function buildATSQueries(config: SearchConfig): string[] {
  // ATS Platform mapping
  const ATS_PLATFORM_MAP: Record<string, string> = {
    ashby: 'site:jobs.ashbyhq.com',
    greenhouse: 'site:boards.greenhouse.io',
    lever: 'site:jobs.lever.co',
    workday: 'site:*.myworkdayjobs.com',
    bamboohr: 'site:*.bamboohr.com',
    jobvite: 'site:jobs.jobvite.com',
    smartrecruiters: 'site:jobs.smartrecruiters.com',
    powered_ashby: 'intext:"Powered by Ashby" -site:jobs.ashbyhq.com',
    powered_greenhouse: 'intext:"Powered by Greenhouse" -site:boards.greenhouse.io',
    powered_lever: 'intext:"Powered by Lever" -site:jobs.lever.co'
  };

  let queries: string[] = [];
  
  // Handle 'all' option
  if (config.atsplatforms.includes('all')) {
    queries = Object.values(ATS_PLATFORM_MAP);
  } else {
    // Parse selected platforms
    queries = config.atsplatforms
      .filter(platform => ATS_PLATFORM_MAP[platform])
      .map(platform => ATS_PLATFORM_MAP[platform]);
  }
  
  // Add custom queries if provided
  if (config.customAtsQueries && config.customAtsQueries.length > 0) {
    const customQueryList = config.customAtsQueries
      .flatMap(q => q.split('|'))
      .map(q => q.trim())
      .filter(q => q);
    queries.push(...customQueryList);
  }
  
  if (config.debugMode) {
    console.log('[DEBUG] Built ATS queries:', queries);
  }
  
  return queries;
}
