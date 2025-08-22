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
const puppeteer = require('puppeteer');

// --- CONFIGURATION ---

// Your primary search criteria
const JOB_QUERY = '("engineering manager" OR "engineering lead") remote';
const TIME_FILTER_DAYS = '15'; // Search for jobs posted in the last 15 days

// Keywords to scan for within each job description.
// Add any specific skills or technologies you're looking for.
const KEYWORDS_TO_FIND = [
    'stripe',
    'payment',
    'payments',
    'fintech',
    'billing',
    'checkout'
];

// List of ATS platforms and their specific search queries
const ATS_QUERIES = [
    // Focusing on the most signal-rich sources for this version
    'site:jobs.ashbyhq.com',
    'site:boards.greenhouse.io',
    'site:jobs.lever.co',
    'intext:"Powered by Ashby" -site:jobs.ashbyhq.com',
    'intext:"Powered by Greenhouse" -site:boards.greenhouse.io',
    'intext:"Powered by Lever" -site:jobs.lever.co',
];

// --- SCRIPT LOGIC ---

/**
 * Fetches search results from the Google Custom Search API.
 * @param {string} query - The full search query string.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of search result items.
 */
async function performSearch(query) {
    // This function remains the same as the previous version.
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
        console.error('ERROR: GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables must be set.');
        process.exit(1);
    }

    const start = 1;
    const dateRestrict = `d[${TIME_FILTER_DAYS}]`;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodedQuery}&dateRestrict=${dateRestrict}&start=${start}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error (${response.status}): ${errorData.error.message}`);
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error(`Failed to fetch results for query "${query}":`, error.message);
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
    let page;
    try {
        page = await browser.newPage();
        // Set a reasonable timeout to prevent hanging on slow-loading pages
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        
        // Extract all visible text from the body of the page
        const content = await page.evaluate(() => document.body.innerText);
        return content.toLowerCase();
    } catch (error) {
        console.warn(`  -> ⚠️  Could not scrape ${url}: ${error.message.split('\n')[0]}`);
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
async function main() {
    console.log(`🚀 Starting job search for: "${JOB_QUERY}"`);
    console.log(`🔍 Scanning for keywords: [${KEYWORDS_TO_FIND.join(', ')}]`);
    console.log('---');

    const matchingJobs = [];
    const browser = await puppeteer.launch({ headless: "new" }); // Launch browser once

    for (const ats of ATS_QUERIES) {
        const fullQuery = `${ats} ${JOB_QUERY}`;
        console.log(`\nSearching ATS pattern: ${ats}`);

        const results = await performSearch(fullQuery);
        if (results.length === 0) {
            console.log('  -> No results found.');
            continue;
        }

        for (const item of results) {
            const { title, link } = item;
            console.log(`  -> Analyzing: "${title}"`);
            
            const content = await scrapePageContent(link, browser);
            if (!content) continue;

            const foundKeywords = KEYWORDS_TO_FIND.filter(keyword => content.includes(keyword));

            if (foundKeywords.length > 0) {
                matchingJobs.push({
                    title,
                    link,
                    keywords: foundKeywords,
                });
                console.log(`  -> ✅ MATCH FOUND! Keywords: [${foundKeywords.join(', ')}]`);
            }
        }
    }

    await browser.close(); // Close the browser when all searches are done

    console.log('\n---');
    console.log(`🏁 Search complete. Found ${matchingJobs.length} relevant job postings:`);
    console.log('---');

    if (matchingJobs.length > 0) {
        matchingJobs.forEach(job => {
            console.log(`\nTitle: ${job.title}`);
            console.log(`Link: ${job.link}`);
            console.log(`Matched Keywords: ${job.keywords.join(', ')}`);
        });
    } else {
        console.log('No jobs found matching your specific keyword criteria. Try broadening your keywords.');
    }
}

// Execute the script
main();
