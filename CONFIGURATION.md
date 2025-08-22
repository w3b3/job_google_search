# 🔧 Configuration Quick Reference

This document provides a quick reference for all environment variables available in the Job Search Analyzer.

## 📋 Environment Variables Checklist

### ✅ Required Variables
- [ ] `GOOGLE_API_KEY` - Your Google Custom Search API key
- [ ] `GOOGLE_CSE_ID` - Your Custom Search Engine ID

### 🎯 Job Search Configuration
- [ ] `JOB_QUERY` - What jobs to search for (default: `("engineering manager" OR "engineering lead") remote`)
- [ ] `TIME_FILTER_DAYS` - Job posting freshness in days (default: `15`)
- [ ] `MAX_RESULTS_PER_QUERY` - Results per ATS platform (default: `10`)
- [ ] `SEARCH_START_POSITION` - Starting position for results (default: `1`)

### 🔍 Keyword Matching
- [ ] `KEYWORDS_TO_FIND` - Comma-separated keywords to match (default: `stripe,payment,payments,fintech,billing,checkout`)
- [ ] `MIN_KEYWORD_MATCHES` - Minimum keywords required (default: `1`)

### 🏢 ATS Platform Selection
- [ ] `ATS_PLATFORMS` - Which platforms to search (default: `ashby,greenhouse,lever,powered_ashby,powered_greenhouse,powered_lever`)
- [ ] `CUSTOM_ATS_QUERIES` - Custom site searches (pipe-separated, optional)

### 🌐 Browser & Scraping
- [ ] `BROWSER_HEADLESS` - Headless browser mode (default: `true`)
- [ ] `PAGE_TIMEOUT` - Page load timeout in ms (default: `20000`)
- [ ] `REQUEST_DELAY` - Delay between requests in ms (default: `1000`)
- [ ] `USER_AGENT` - Custom user agent string (optional)

### 📊 Logging & Output
- [ ] `VERBOSE_LOGGING` - Enable detailed logging (default: `false`)
- [ ] `DEBUG_MODE` - Enable debug information (default: `false`)
- [ ] `OUTPUT_FORMAT` - Output format (default: `console`)
- [ ] `SAVE_RESULTS` - Save results to file (default: `false`)
- [ ] `RESULTS_FILE_PATH` - Results file path (default: `./results.json`)

## 🚀 Quick Setup Commands

```bash
# 1. Copy example configuration
cp .env.example .env

# 2. Edit with your settings
nano .env

# 3. Run with Docker
npm run docker:up

# 4. Or run locally
npm start
```

## 💡 Common Configurations

### Fintech Focus
```bash
JOB_QUERY=("software engineer" OR "backend engineer") fintech
KEYWORDS_TO_FIND=stripe,payment,banking,cryptocurrency,blockchain,fintech
MIN_KEYWORD_MATCHES=1
TIME_FILTER_DAYS=7
```

### AI/ML Jobs
```bash
JOB_QUERY=("machine learning" OR "data scientist" OR "AI engineer")
KEYWORDS_TO_FIND=tensorflow,pytorch,python,machine learning,deep learning,nlp
MIN_KEYWORD_MATCHES=2
ATS_PLATFORMS=all
```

### Startup Jobs
```bash
JOB_QUERY=("full stack" OR "senior engineer") startup
ATS_PLATFORMS=ashby,lever
CUSTOM_ATS_QUERIES=site:angel.co|site:wellfound.com
TIME_FILTER_DAYS=30
```

### Debug Mode
```bash
BROWSER_HEADLESS=false
DEBUG_MODE=true
VERBOSE_LOGGING=true
REQUEST_DELAY=2000
```

## 🔍 Available ATS Platforms

| Code | Platform | Type |
|------|----------|------|
| `ashby` | Ashby | Direct job boards |
| `greenhouse` | Greenhouse | Direct job boards |
| `lever` | Lever | Direct job boards |
| `workday` | Workday | Corporate career sites |
| `bamboohr` | BambooHR | HR platform jobs |
| `jobvite` | Jobvite | Recruiting platform |
| `smartrecruiters` | SmartRecruiters | Recruiting platform |
| `powered_ashby` | Powered by Ashby | Broader Ashby search |
| `powered_greenhouse` | Powered by Greenhouse | Broader Greenhouse search |
| `powered_lever` | Powered by Lever | Broader Lever search |
| `all` | All Platforms | Enable everything |

## 🎯 Search Query Examples

```bash
# Exact role with location
JOB_QUERY="senior software engineer" remote

# Multiple roles
JOB_QUERY=("frontend engineer" OR "backend engineer" OR "full stack")

# Exclude terms
JOB_QUERY="software engineer" -intern -junior

# Company size focus
JOB_QUERY="engineering manager" startup

# Technology focus
JOB_QUERY="python developer" ("django" OR "flask")

# Industry specific
JOB_QUERY="data engineer" ("healthcare" OR "fintech")
```

## ⚠️ Important Notes

- **API Limits**: Google Custom Search has daily quotas (100 free searches/day)
- **Rate Limiting**: Use `REQUEST_DELAY` to be respectful to websites
- **Security**: Never commit your actual API keys to version control
- **Docker**: All environment variables work seamlessly in Docker containers
- **Debugging**: Use `BROWSER_HEADLESS=false` and `DEBUG_MODE=true` for troubleshooting

## 📞 Support

If you need help with configuration:
1. Check the main README.md for detailed examples
2. Use `DEBUG_MODE=true` to see what's happening
3. Start with default values and customize gradually
4. Verify your Google API setup if you get API errors
