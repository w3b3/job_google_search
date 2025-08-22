// automated-job-search-analyzer.js

/*
 * Description:
 * This script automates job searches using the Google Custom Search API, then uses
 * Puppeteer to visit each job posting and scan its content for specific keywords.
 * It outputs a list of jobs that match your technical and role criteria.
 *
 * Author: Gemini
 * Version: 2.0.0
 *
 * --- SETUP INSTRUCTIONS ---
 *
 * 1.  Complete the Google API & CSE setup from the previous version.
 *
 * 2.  Install Node.js dependencies:
 * - This script requires the 'puppeteer' package to perform web scraping.
 * - In your terminal, in the same directory as this file, run:
 * npm init -y
 * npm install puppeteer
 *
 * 3.  Set Environment Variables (if not already set):
 * (On macOS/Linux)
 * export GOOGLE_API_KEY='YOUR_API_KEY_HERE'
 * export GOOGLE_CSE_ID='YOUR_SEARCH_ENGINE_ID_HERE'
 *
 * (On Windows - Command Prompt)
 * set GOOGLE_API_KEY=YOUR_API_KEY_HERE
 * set GOOGLE_CSE_ID=YOUR_SEARCH_ENGINE_ID_HERE
 *
 * 4.  Run the script:
 * - node automated-job-search-analyzer.js
 *
 * --- --- --- --- --- --- ---
 */

// --- DEPENDENCIES ---
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

// Load environment variables from .env file if it exists
dotenv.config();

// --- CONFIGURATION ---

/**
 * Load and validate environment variables with fallback defaults
 */
const CONFIG = {
    // Google API Configuration
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
    
    // Job Search Configuration
    JOB_QUERY: process.env.JOB_QUERY || '("engineering manager" OR "engineering lead") remote',
    TIME_FILTER_DAYS: process.env.TIME_FILTER_DAYS || '15',
    MAX_RESULTS_PER_QUERY: parseInt(process.env.MAX_RESULTS_PER_QUERY) || 10,
    SEARCH_START_POSITION: parseInt(process.env.SEARCH_START_POSITION) || 1,
    
    // Keyword Configuration
    KEYWORDS_TO_FIND: process.env.KEYWORDS_TO_FIND 
        ? process.env.KEYWORDS_TO_FIND.split(',').map(k => k.trim().toLowerCase())
        : ['stripe', 'payment', 'payments', 'fintech', 'billing', 'checkout'],
    MIN_KEYWORD_MATCHES: parseInt(process.env.MIN_KEYWORD_MATCHES) || 1,
    
    // Browser Configuration
    BROWSER_HEADLESS: process.env.BROWSER_HEADLESS !== 'false', // Default to true
    PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT) || 20000,
    REQUEST_DELAY: parseInt(process.env.REQUEST_DELAY) || 1000,
    USER_AGENT: process.env.USER_AGENT || '',
    
    // Logging Configuration
    VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    OUTPUT_FORMAT: process.env.OUTPUT_FORMAT || 'console',
    SAVE_RESULTS: process.env.SAVE_RESULTS === 'true',
    RESULTS_FILE_PATH: process.env.RESULTS_FILE_PATH || './results.json'
};

/**
 * ATS Platform Mapping - converts friendly names to search queries
 */
const ATS_PLATFORM_MAP = {
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

/**
 * Build ATS queries based on configuration
 */
function buildATSQueries() {
    const platformsConfig = process.env.ATS_PLATFORMS || 'ashby,greenhouse,lever,powered_ashby,powered_greenhouse,powered_lever';
    const customQueries = process.env.CUSTOM_ATS_QUERIES || '';
    
    let queries = [];
    
    // Handle 'all' option
    if (platformsConfig.includes('all')) {
        queries = Object.values(ATS_PLATFORM_MAP);
    } else {
        // Parse selected platforms
        const selectedPlatforms = platformsConfig.split(',').map(p => p.trim());
        queries = selectedPlatforms
            .filter(platform => ATS_PLATFORM_MAP[platform])
            .map(platform => ATS_PLATFORM_MAP[platform]);
    }
    
    // Add custom queries if provided
    if (customQueries) {
        const customQueryList = customQueries.split('|').map(q => q.trim()).filter(q => q);
        queries.push(...customQueryList);
    }
    
    return queries;
}

// Build the final ATS queries array
const ATS_QUERIES = buildATSQueries();

/**
 * Logging utility functions
 */
const logger = {
    info: (message) => console.log(message),
    verbose: (message) => CONFIG.VERBOSE_LOGGING && console.log(`[VERBOSE] ${message}`),
    debug: (message) => CONFIG.DEBUG_MODE && console.log(`[DEBUG] ${message}`),
    error: (message) => console.error(`[ERROR] ${message}`),
    warn: (message) => console.warn(`[WARN] ${message}`)
};

// --- SCRIPT LOGIC ---

/**
 * Fetches search results from the Google Custom Search API.
 * @param {string} query - The full search query string.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of search result items.
 */
async function performSearch(query) {
    const { GOOGLE_API_KEY, GOOGLE_CSE_ID, TIME_FILTER_DAYS, SEARCH_START_POSITION, MAX_RESULTS_PER_QUERY } = CONFIG;

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        logger.error('GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables must be set.');
        process.exit(1);
    }

    const dateRestrict = `d[${TIME_FILTER_DAYS}]`;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodedQuery}&dateRestrict=${dateRestrict}&start=${SEARCH_START_POSITION}&num=${MAX_RESULTS_PER_QUERY}`;

    logger.debug(`API URL: ${url.replace(GOOGLE_API_KEY, '[REDACTED]')}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error (${response.status}): ${errorData.error.message}`);
        }
        const data = await response.json();
        logger.verbose(`Found ${data.items?.length || 0} results for query: ${query}`);
        return data.items || [];
    } catch (error) {
        logger.error(`Failed to fetch results for query "${query}": ${error.message}`);
        return [];
    }
}

/**
 * Scrapes the text content of a given URL using Puppeteer.
 * @param {string} url - The URL of the job posting to scrape.
 * @param {object} browser - The Puppeteer browser instance.
 * @returns {Promise<string>} The text content of the page, converted to lowercase.
 */
async function scrapePageContent(url, browser) {
    const { PAGE_TIMEOUT, USER_AGENT, REQUEST_DELAY } = CONFIG;
    let page;
    
    try {
        page = await browser.newPage();
        
        // Set custom user agent if provided
        if (USER_AGENT) {
            await page.setUserAgent(USER_AGENT);
            logger.debug(`Using custom user agent: ${USER_AGENT}`);
        }
        
        // Add request delay to be respectful
        if (REQUEST_DELAY > 0) {
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
        }
        
        logger.verbose(`Scraping: ${url}`);
        await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: PAGE_TIMEOUT 
        });
        
        // Extract all visible text from the body of the page
        const content = await page.evaluate(() => document.body.innerText);
        logger.debug(`Scraped ${content.length} characters from ${url}`);
        return content.toLowerCase();
    } catch (error) {
        logger.warn(`Could not scrape ${url}: ${error.message.split('\n')[0]}`);
        return ''; // Return empty string on failure
    } finally {
        if (page) {
            await page.close();
        }
    }
}

/**
 * Main function to run the job search and analysis.
 */
/**
 * Validates configuration and displays startup information
 */
function validateAndDisplayConfig() {
    const { JOB_QUERY, KEYWORDS_TO_FIND, MIN_KEYWORD_MATCHES, BROWSER_HEADLESS } = CONFIG;
    
    logger.info('🔧 Configuration:');
    logger.info(`   Job Query: "${JOB_QUERY}"`);
    logger.info(`   Keywords: [${KEYWORDS_TO_FIND.join(', ')}]`);
    logger.info(`   Min Keyword Matches: ${MIN_KEYWORD_MATCHES}`);
    logger.info(`   Time Filter: ${CONFIG.TIME_FILTER_DAYS} days`);
    logger.info(`   ATS Platforms: ${ATS_QUERIES.length} configured`);
    logger.info(`   Browser Mode: ${BROWSER_HEADLESS ? 'Headless' : 'Visible'}`);
    
    if (CONFIG.DEBUG_MODE) {
        logger.debug('ATS Queries:');
        ATS_QUERIES.forEach((query, index) => {
            logger.debug(`   ${index + 1}. ${query}`);
        });
    }
    
    logger.info('---');
}

/**
 * Checks if job matches keyword criteria
 */
function checkKeywordMatch(content, keywords, minMatches) {
    const foundKeywords = keywords.filter(keyword => content.includes(keyword));
    return foundKeywords.length >= minMatches ? foundKeywords : [];
}

async function main() {
    const { JOB_QUERY, KEYWORDS_TO_FIND, MIN_KEYWORD_MATCHES, BROWSER_HEADLESS } = CONFIG;
    
    logger.info(`🚀 Starting job search for: "${JOB_QUERY}"`);
    logger.info(`🔍 Scanning for keywords: [${KEYWORDS_TO_FIND.join(', ')}]`);
    
    validateAndDisplayConfig();

    const matchingJobs = [];
    const totalStats = {
        totalSearches: ATS_QUERIES.length,
        totalResults: 0,
        totalScraped: 0,
        totalMatches: 0
    };

    // Launch browser with configuration
    const browserOptions = { 
        headless: BROWSER_HEADLESS ? "new" : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // For Docker compatibility
    };
    
    logger.verbose(`Launching browser with options: ${JSON.stringify(browserOptions)}`);
    const browser = await puppeteer.launch(browserOptions);

    for (const [index, ats] of ATS_QUERIES.entries()) {
        const fullQuery = `${ats} ${JOB_QUERY}`;
        logger.info(`\n[${index + 1}/${ATS_QUERIES.length}] Searching ATS pattern: ${ats}`);

        const results = await performSearch(fullQuery);
        totalStats.totalResults += results.length;
        
        if (results.length === 0) {
            logger.info('  -> No results found.');
            continue;
        }

        logger.verbose(`  -> Found ${results.length} results to analyze`);

        for (const [resultIndex, item] of results.entries()) {
            const { title, link } = item;
            logger.info(`  -> [${resultIndex + 1}/${results.length}] Analyzing: "${title}"`);
            
            const content = await scrapePageContent(link, browser);
            if (!content) continue;
            
            totalStats.totalScraped++;

            const foundKeywords = checkKeywordMatch(content, KEYWORDS_TO_FIND, MIN_KEYWORD_MATCHES);

            if (foundKeywords.length > 0) {
                matchingJobs.push({
                    title,
                    link,
                    keywords: foundKeywords,
                    atsSource: ats,
                    matchCount: foundKeywords.length
                });
                totalStats.totalMatches++;
                logger.info(`  -> ✅ MATCH FOUND! Keywords: [${foundKeywords.join(', ')}]`);
            } else {
                logger.verbose(`  -> No keyword matches found`);
            }
        }
    }

    await browser.close();

    // Display results
    logger.info('\n' + '='.repeat(60));
    logger.info(`🏁 Search Complete - Statistics:`);
    logger.info(`   ATS Platforms Searched: ${totalStats.totalSearches}`);
    logger.info(`   Total Results Found: ${totalStats.totalResults}`);
    logger.info(`   Pages Successfully Scraped: ${totalStats.totalScraped}`);
    logger.info(`   Matching Jobs Found: ${totalStats.totalMatches}`);
    logger.info('='.repeat(60));

    if (matchingJobs.length > 0) {
        // Sort by match count (descending) for better results
        matchingJobs.sort((a, b) => b.matchCount - a.matchCount);
        
        matchingJobs.forEach((job, index) => {
            logger.info(`\n📋 Job ${index + 1}:`);
            logger.info(`   Title: ${job.title}`);
            logger.info(`   Link: ${job.link}`);
            logger.info(`   Source: ${job.atsSource}`);
            logger.info(`   Matched Keywords (${job.matchCount}): ${job.keywords.join(', ')}`);
        });
        
        // Future feature: Save results if configured
        if (CONFIG.SAVE_RESULTS) {
            logger.info(`\n💾 Results would be saved to: ${CONFIG.RESULTS_FILE_PATH}`);
            // TODO: Implement file saving functionality
        }
    } else {
        logger.info('\n❌ No jobs found matching your keyword criteria.');
        logger.info('💡 Suggestions:');
        logger.info('   - Try broadening your keywords');
        logger.info('   - Reduce MIN_KEYWORD_MATCHES');
        logger.info('   - Increase TIME_FILTER_DAYS');
        logger.info('   - Add more ATS platforms');
    }
}

// Execute the script
main();
