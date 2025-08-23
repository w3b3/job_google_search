import puppeteer, { Browser, Page } from 'puppeteer';
import { SearchConfig } from '../types';

// Browser pool for reusing browser instances
class BrowserPool {
  private browsers: Browser[] = [];
  private readonly maxBrowsers = 3;
  
  async getBrowser(): Promise<Browser> {
    // Find an existing connected browser
    for (const browser of this.browsers) {
      if (browser.isConnected()) {
        return browser;
      }
    }
    
    // Create new browser if under limit
    if (this.browsers.length < this.maxBrowsers) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      return browser;
    }
    
    // Return first available browser
    return this.browsers[0];
  }
  
  private async createBrowser(): Promise<Browser> {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-plugins',
        '--disable-images', // Faster loading
        '--disable-javascript', // Even faster, most job pages work without JS
      ],
    });
  }
  
  async cleanup() {
    await Promise.all(
      this.browsers.map(browser => browser.close().catch(console.error))
    );
    this.browsers = [];
  }
}

export const browserPool = new BrowserPool();

/**
 * Scrapes job content from a URL using Puppeteer
 * Ported and enhanced from original scrapePageContent function
 */
export async function scrapeJobContent(
  url: string, 
  config: SearchConfig
): Promise<string> {
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    browser = await browserPool.getBrowser();
    page = await browser.newPage();
    
    // Set custom user agent if provided
    if (config.userAgent) {
      await page.setUserAgent(config.userAgent);
      if (config.debugMode) {
        console.log(`[DEBUG] Using custom user agent: ${config.userAgent}`);
      }
    }
    
    // Add request delay to be respectful
    if (config.requestDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.requestDelay));
    }
    
    if (config.verboseLogging) {
      console.log(`[VERBOSE] Scraping: ${url}`);
    }
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1280, height: 720 });
    
    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['stylesheet', 'image', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: config.pageTimeout 
    });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract all visible text from the body
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      // Get text content and clean it up
      const text = document.body.innerText || document.body.textContent || '';
      return text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[\r\n]+/g, ' ') // Remove line breaks
        .trim();
    });
    
    if (config.debugMode) {
      console.log(`[DEBUG] Scraped ${content.length} characters from ${url}`);
    }
    
    return content.toLowerCase();
    
  } catch (error) {
    const errorMessage = (error instanceof Error ? error.message : 'Unknown error').split('\n')[0]; // Get first line only
    console.warn(`[WARN] Could not scrape ${url}: ${errorMessage}`);
    
    // Return empty string on failure to continue processing
    return '';
    
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
    // Don't close browser - reuse it for efficiency
  }
}

/**
 * Checks if content matches keyword criteria
 * Ported from original checkKeywordMatch function
 */
export function checkKeywordMatch(
  content: string, 
  keywords: string[], 
  minMatches: number
): string[] {
  const contentLower = content.toLowerCase();
  const foundKeywords = keywords.filter(keyword => 
    contentLower.includes(keyword.toLowerCase())
  );
  
  return foundKeywords.length >= minMatches ? foundKeywords : [];
}

/**
 * Clean up browser resources
 */
export async function cleanup() {
  await browserPool.cleanup();
}
