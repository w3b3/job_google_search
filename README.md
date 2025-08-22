# Automated Job Search Analyzer

A powerful Node.js script that automates job searching by leveraging Google Custom Search API and web scraping to find relevant job postings based on specific keywords and criteria.

## 🎯 Overview

This tool streamlines the job hunting process by:
- Searching multiple ATS (Applicant Tracking System) platforms automatically
- Analyzing job descriptions for specific keywords and technologies
- Filtering results based on posting date and relevance
- Providing a curated list of matching opportunities

## ✨ Features

- **Multi-Platform Search**: Targets popular ATS platforms including Ashby, Greenhouse, and Lever
- **Keyword Matching**: Scans job descriptions for specific technologies, skills, or requirements
- **Date Filtering**: Focuses on recently posted positions (configurable timeframe)
- **Web Scraping**: Uses Puppeteer to extract full job description content
- **Intelligent Filtering**: Only returns jobs that match your specified criteria
- **Professional Output**: Clean, organized results with matched keywords highlighted

## 🛠 Prerequisites

- **Docker** (recommended) - for containerized deployment
- **OR** Node.js (v22 or higher) - for local development
- Google Cloud Platform account with Custom Search API enabled
- Google Custom Search Engine (CSE) configured

## 📋 Installation

### 🐳 Docker Installation (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job_google_search
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Google API credentials
   ```

3. **Build and run with Docker**
   ```bash
   # Build the Docker image
   docker build -t job-search-analyzer .
   
   # Run the container
   docker run --env-file .env job-search-analyzer
   ```

### 🔧 Local Development Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job_google_search
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Custom Search API**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Custom Search API
   - Create API credentials (API Key)
   - Set up a Custom Search Engine at [Google CSE](https://cse.google.com/)

4. **Configure environment variables**
   
   **Using .env file (recommended):**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API credentials
   ```
   
   **OR using shell environment:**
   
   **macOS/Linux:**
   ```bash
   export GOOGLE_API_KEY='your_api_key_here'
   export GOOGLE_CSE_ID='your_search_engine_id_here'
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set GOOGLE_API_KEY=your_api_key_here
   set GOOGLE_CSE_ID=your_search_engine_id_here
   ```

## ⚙️ Configuration

The application is now **fully configurable via environment variables**! No need to edit code - just customize your `.env` file:

```bash
# Copy the example configuration
cp .env.example .env

# Edit with your preferences
nano .env  # or use your preferred editor
```

### 🔧 Core Configuration Variables

#### **Google API Settings** (Required)
```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here
```

#### **Job Search Settings**
```bash
# What jobs to search for (use Google search operators)
JOB_QUERY=("engineering manager" OR "engineering lead") remote

# How recent should jobs be? (1, 7, 15, 30, 90, 365 days)
TIME_FILTER_DAYS=15

# Maximum results per ATS platform (1-10)
MAX_RESULTS_PER_QUERY=10
```

#### **Keyword Matching**
```bash
# Keywords to scan for (comma-separated, case-insensitive)
KEYWORDS_TO_FIND=stripe,payment,payments,fintech,billing,checkout

# Minimum keywords required to match (1 = any keyword matches)
MIN_KEYWORD_MATCHES=1
```

#### **ATS Platform Selection**
```bash
# Choose which platforms to search (comma-separated)
# Options: ashby, greenhouse, lever, workday, bamboohr, jobvite, smartrecruiters
# Special options: powered_ashby, powered_greenhouse, powered_lever, all
ATS_PLATFORMS=ashby,greenhouse,lever,powered_ashby,powered_greenhouse,powered_lever

# Add custom site searches (pipe-separated)
CUSTOM_ATS_QUERIES=site:careers.company.com|site:jobs.startup.io
```

### 🎛️ Advanced Configuration

#### **Browser & Scraping Settings**
```bash
# Browser mode (true=headless, false=visible for debugging)
BROWSER_HEADLESS=true

# Page load timeout in milliseconds
PAGE_TIMEOUT=20000

# Delay between requests (be respectful to servers)
REQUEST_DELAY=1000

# Custom user agent (optional)
USER_AGENT=Mozilla/5.0 (compatible; JobSearchBot/1.0)
```

#### **Logging & Output**
```bash
# Enable detailed logging
VERBOSE_LOGGING=false

# Enable debug information
DEBUG_MODE=false

# Output format (console, json, csv - future features)
OUTPUT_FORMAT=console

# Save results to file (future feature)
SAVE_RESULTS=false
RESULTS_FILE_PATH=./results.json
```

### 📋 Configuration Examples

#### **Fintech Jobs**
```bash
JOB_QUERY=("software engineer" OR "backend engineer") fintech
KEYWORDS_TO_FIND=stripe,payment,banking,cryptocurrency,blockchain,fintech
MIN_KEYWORD_MATCHES=1
TIME_FILTER_DAYS=7
```

#### **AI/ML Positions**
```bash
JOB_QUERY=("machine learning" OR "data scientist" OR "AI engineer")
KEYWORDS_TO_FIND=tensorflow,pytorch,python,machine learning,deep learning,nlp
MIN_KEYWORD_MATCHES=2
ATS_PLATFORMS=all
```

#### **DevOps/Infrastructure**
```bash
JOB_QUERY=("devops engineer" OR "platform engineer" OR "sre")
KEYWORDS_TO_FIND=kubernetes,docker,aws,terraform,jenkins,ci/cd,monitoring
MIN_KEYWORD_MATCHES=1
BROWSER_HEADLESS=false  # For debugging
DEBUG_MODE=true
```

#### **Startup Focus**
```bash
JOB_QUERY=("full stack" OR "senior engineer") startup
ATS_PLATFORMS=ashby,lever  # Popular with startups
CUSTOM_ATS_QUERIES=site:angel.co|site:wellfound.com
TIME_FILTER_DAYS=30
```

### 🔍 Search Query Tips

Use Google search operators for powerful queries:
- **Exact phrases**: `"senior engineer"`
- **OR conditions**: `("frontend" OR "backend")`
- **Exclude terms**: `-intern -junior`
- **Site specific**: `site:company.com`
- **Wildcards**: `"* engineer"` matches "software engineer", "data engineer", etc.

### 🏢 Available ATS Platforms

| Platform | Code | Description |
|----------|------|-------------|
| **Ashby** | `ashby` | Direct Ashby job boards |
| **Greenhouse** | `greenhouse` | Direct Greenhouse job boards |
| **Lever** | `lever` | Direct Lever job boards |
| **Workday** | `workday` | Workday-powered career sites |
| **BambooHR** | `bamboohr` | BambooHR job boards |
| **Jobvite** | `jobvite` | Jobvite-powered sites |
| **SmartRecruiters** | `smartrecruiters` | SmartRecruiters platforms |
| **Powered by Ashby** | `powered_ashby` | Sites using Ashby (broader search) |
| **Powered by Greenhouse** | `powered_greenhouse` | Sites using Greenhouse (broader) |
| **Powered by Lever** | `powered_lever` | Sites using Lever (broader) |
| **All Platforms** | `all` | Enable all available platforms |

### ✅ Configuration Validation

The application will show your configuration at startup and validate settings:

```bash
🔧 Configuration:
   Job Query: "("engineering manager" OR "engineering lead") remote"
   Keywords: [stripe, payment, payments, fintech, billing, checkout]
   Min Keyword Matches: 1
   Time Filter: 15 days
   ATS Platforms: 6 configured
   Browser Mode: Headless
---
```

**Pro Tips:**
- Use `DEBUG_MODE=true` to see all ATS queries being used
- Use `VERBOSE_LOGGING=true` for detailed progress information
- Set `BROWSER_HEADLESS=false` when debugging scraping issues
- Start with fewer ATS platforms and expand based on results

## 🚀 Usage

### 🐳 Docker Usage

#### Option 1: Docker Compose (Recommended)
```bash
# Build and run with docker-compose
npm run docker:up

# Or directly
docker-compose up --build

# View logs
npm run docker:logs

# Stop the container
npm run docker:down
```

#### Option 2: Direct Docker Commands
```bash
# Build the image (one-time setup)
docker build -t job-search-analyzer .

# Run the application
docker run --env-file .env job-search-analyzer

# For development with live reload
docker run --env-file .env -v $(pwd):/usr/src/app job-search-analyzer npm run dev
```

### 🔧 Local Usage

```bash
# Run the script
npm start

# Or with Node.js directly
node index.js

# Development mode with auto-restart on changes (Node 22+)
npm run dev
```

The script will:
1. **Validate Configuration**: Display your settings and validate environment variables
2. **Search ATS Platforms**: Query each configured platform with your job criteria
3. **Scrape Job Descriptions**: Extract full text content from job postings
4. **Match Keywords**: Filter jobs based on your keyword requirements
5. **Display Results**: Show matching jobs sorted by relevance with statistics

### Enhanced Output

The new version provides detailed statistics and better formatting:

```bash
============================================================
🏁 Search Complete - Statistics:
   ATS Platforms Searched: 6
   Total Results Found: 45
   Pages Successfully Scraped: 42
   Matching Jobs Found: 8
============================================================

📋 Job 1:
   Title: Senior Engineering Manager - Payments
   Link: https://jobs.ashbyhq.com/company/payments-manager
   Source: site:jobs.ashbyhq.com
   Matched Keywords (3): payment, stripe, fintech
```

### Sample Output

```
🚀 Starting job search for: "("engineering manager" OR "engineering lead") remote"
🔍 Scanning for keywords: [stripe, payment, payments, fintech, billing, checkout]
---

Searching ATS pattern: site:jobs.ashbyhq.com
  -> Analyzing: "Senior Engineering Manager - Payments"
  -> ✅ MATCH FOUND! Keywords: [payment, stripe]

🏁 Search complete. Found 3 relevant job postings:
---

Title: Senior Engineering Manager - Payments
Link: https://jobs.ashbyhq.com/company/payments-manager
Matched Keywords: payment, stripe
```

## 🔧 Customization

### Adding New ATS Platforms

Extend the `ATS_QUERIES` array with additional search patterns:

```javascript
const ATS_QUERIES = [
    'site:jobs.ashbyhq.com',
    'site:boards.greenhouse.io',
    'site:jobs.lever.co',
    'site:your-custom-ats.com',
    // Add more as needed
];
```

### Keyword Strategy

- **Technical Skills**: Add specific technologies, frameworks, or tools
- **Industry Terms**: Include domain-specific terminology
- **Company Types**: Target startups, enterprises, or specific sectors
- **Benefits**: Search for remote work, equity, specific perks

## 🚨 Important Notes

- **Rate Limiting**: Google Custom Search API has daily quotas (100 free searches/day)
- **Respectful Scraping**: The script includes delays and error handling to be respectful to target websites
- **Legal Compliance**: Ensure your usage complies with websites' terms of service
- **API Costs**: Monitor your Google API usage to avoid unexpected charges
- **Docker Security**: The container runs as a non-root user for enhanced security
- **Environment Variables**: Never commit your actual API keys - use `.env` files that are gitignored

## 🐳 Docker Features

### Security
- Runs as non-root user (nodejs:nodejs)
- Uses Alpine Linux base for minimal attack surface
- Multi-stage build optimization for smaller image size

### Performance
- Optimized Docker layers for better caching
- Uses system Chromium instead of bundled version
- Efficient dependency management with `npm ci`

### Development
```bash
# Interactive development mode
docker run -it --env-file .env -v $(pwd):/usr/src/app job-search-analyzer sh

# Build and run in one command
docker build -t job-search-analyzer . && docker run --env-file .env job-search-analyzer
```

## 🔮 Future Roadmap

### Planned Micro-SaaS Features

- **Web Interface**: User-friendly dashboard for configuration and results
- **User Accounts**: Save searches, track applications, set alerts
- **Advanced Filtering**: Salary ranges, company size, location preferences
- **Email Notifications**: Automated alerts for new matching positions
- **Analytics Dashboard**: Track search performance and market trends
- **Integration APIs**: Connect with job boards, CRM systems, and calendars
- **Premium Features**: Enhanced search capabilities, priority support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check that your environment variables are properly set
2. Verify your Google API credentials and quotas
3. Ensure all dependencies are installed correctly
4. Review the console output for specific error messages

## 🔗 Related Resources

- [Google Custom Search API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Puppeteer Documentation](https://pptr.dev/)
- [Node.js Documentation](https://nodejs.org/en/docs/)

---

**Disclaimer**: This tool is for educational and personal use. Always respect website terms of service and rate limits when scraping web content.
