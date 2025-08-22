# 🔍 Job Search Analyzer - Next.js Frontend

A powerful, containerized job search application built with Next.js 15+ that automates job discovery across multiple ATS platforms with intelligent keyword matching.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Google Custom Search API credentials
- That's it! (SQLite database included)

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

**Required Environment Variables:**
```bash
# Only these two are required! Database is handled automatically.
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
```

### 2. Run with Docker Compose
```bash
# Start all services
npm run docker:up

# Or directly
docker-compose up --build -d

# View logs
docker-compose logs -f nextjs-app
```

### 3. Initialize Database
```bash
# Run database migration
docker-compose exec nextjs-app npm run db:migrate
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Queue Stats**: http://localhost:3000/api/queue/stats

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│  Background     │────│     SQLite      │
│   (Frontend)    │    │    Worker       │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│      Redis      │──────────────┘
                        │     (Queue)     │
                        └─────────────────┘
```

### Services

- **`nextjs-app`**: Main web application with UI and API routes
- **`worker`**: Background job processor for web scraping  
- **`redis`**: Queue management and caching
- **`sqlite`**: Embedded database (no separate container needed!)

## 🎯 Features

### ✨ User Interface
- **Configuration Form**: Visual job search setup with templates
- **Real-time Progress**: Live updates during search execution
- **Results Dashboard**: Sortable, filterable job listings
- **Export Options**: CSV and JSON download formats
- **Search History**: Track and revisit previous searches

### 🔧 Search Capabilities  
- **Multi-Platform Support**: 10+ ATS platforms (Ashby, Greenhouse, Lever, etc.)
- **Custom Site Support**: Add any career page
- **Smart Keyword Matching**: Configurable minimum match thresholds
- **Advanced Filtering**: Date ranges, result limits, exclusions
- **Google Search Integration**: Leverages Google Custom Search API

### 🚀 Performance
- **Background Processing**: Non-blocking search execution
- **Queue Management**: Reliable job processing with retry logic
- **Browser Optimization**: Efficient Puppeteer resource management
- **Containerized**: Docker-ready with health checks

## 🔧 Configuration

### Search Templates
Pre-built configurations for common use cases:

```typescript
// Fintech Jobs
{
  jobQuery: '("software engineer" OR "backend engineer") fintech',
  keywords: ['stripe', 'payment', 'banking', 'cryptocurrency'],
  atsplatforms: ['ashby', 'greenhouse', 'lever']
}

// AI/ML Positions  
{
  jobQuery: '("machine learning" OR "data scientist")',
  keywords: ['tensorflow', 'pytorch', 'python', 'nlp'],
  minKeywordMatches: 2
}
```

### ATS Platforms
| Platform | Type | Coverage |
|----------|------|----------|
| Ashby | Direct | High-growth startups |
| Greenhouse | Direct | Enterprise & mid-market |
| Lever | Direct | Tech companies |
| Workday | Corporate | Large enterprises |
| Custom Sites | Configurable | Any career page |

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run worker separately
npm run worker
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Connect to database
docker-compose exec postgres psql -U jobsearch -d jobsearch
```

### Monitoring
```bash
# View application logs
docker-compose logs -f nextjs-app

# View worker logs  
docker-compose logs -f worker

# Monitor queue
docker-compose logs -f redis

# Start monitoring services
docker-compose --profile monitoring up -d
# Redis Commander: http://localhost:8081
# pgAdmin: http://localhost:8080
```

## 📊 API Endpoints

### Search Operations
- `POST /api/search/execute` - Start new search
- `GET /api/search/status/{id}` - Get search status
- `GET /api/search/results/{id}` - Get search results
- `GET /api/search/recent` - List recent searches

### System Status
- `GET /api/health` - Health check
- `GET /api/queue/stats` - Queue statistics

## 🔐 Security

- **Non-root containers**: All services run as unprivileged users
- **Environment isolation**: Secrets managed via environment variables
- **API key encryption**: Database storage of sensitive credentials
- **Resource limits**: Memory and CPU constraints
- **Health monitoring**: Automatic restart on failures

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale workers
docker-compose up --scale worker=3 -d

# Scale application
docker-compose up --scale nextjs-app=2 -d
```

### Performance Tuning
- **Browser Pool**: Reuse Puppeteer instances
- **Concurrent Processing**: Multiple search jobs
- **Database Indexing**: Optimized queries
- **Redis Caching**: Queue optimization

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec nextjs-app npm run db:migrate
```

**Puppeteer Browser Issues**
```bash
# Check Chrome installation
docker-compose exec worker google-chrome --version

# View worker logs
docker-compose logs worker
```

**Queue Not Processing**
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Monitor queue stats
curl http://localhost:3000/api/queue/stats
```

### Logs & Debugging
```bash
# Enable debug mode
echo "DEBUG=true" >> .env
docker-compose restart

# View detailed logs
docker-compose logs -f --tail=100
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment file
cp .env.example .env.production

# Set production values
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_pass@prod-db:5432/jobsearch
```

### Container Registry
```bash
# Build for production
docker build -t your-registry/job-search-app .

# Push to registry
docker push your-registry/job-search-app
```

### Health Monitoring
- **Health Endpoint**: `/api/health`
- **Metrics**: Queue stats, processing times
- **Alerts**: Failed searches, system errors

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive API and setup guides
- **Health Checks**: Built-in system monitoring

---

**Built with:**
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS
- Puppeteer (Web Scraping)
- BullMQ (Queue Management)
- PostgreSQL (Database)
- Redis (Cache & Queue)
- Docker (Containerization)
