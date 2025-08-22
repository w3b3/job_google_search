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

Edit the configuration section in `index.js` to customize your search:

```javascript
// Your primary search criteria
const JOB_QUERY = '("engineering manager" OR "engineering lead") remote';
const TIME_FILTER_DAYS = '15'; // Search for jobs posted in the last 15 days

// Keywords to scan for within each job description
const KEYWORDS_TO_FIND = [
    'stripe',
    'payment',
    'payments',
    'fintech',
    'billing',
    'checkout'
];
```

### Configuration Options

- **JOB_QUERY**: Define your job search terms (role, location, etc.)
- **TIME_FILTER_DAYS**: Limit results to jobs posted within X days
- **KEYWORDS_TO_FIND**: Array of technologies/skills to match in job descriptions
- **ATS_QUERIES**: Predefined list of ATS platforms to search

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
1. Search each configured ATS platform
2. Analyze job descriptions for keyword matches
3. Display progress in real-time
4. Output a summary of matching positions

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
