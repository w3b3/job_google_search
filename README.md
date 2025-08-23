# Job Search Analyzer

A comprehensive job search automation platform built as a Next.js application for finding and analyzing job postings using Google Custom Search API and intelligent web scraping.

## 🏗️ Architecture

This is a **single Next.js application** that provides:

- **Web Interface**: Full-featured React frontend with user authentication and job management
- **API Backend**: RESTful API routes for job search and data management  
- **Background Processing**: Automated job search execution with Puppeteer web scraping
- **Queue Management**: Redis-based job queue for scalable processing

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Google Custom Search API credentials

⚠️ **IMPORTANT**: This application runs **EXCLUSIVELY** in Docker containers. Do NOT install Node.js locally or run any npm commands outside of containers.

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your Google API credentials:
```bash
# Required for both CLI and web app
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# Required for web app authentication
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Development

🐳 **CRITICAL: 100% DOCKER-FIRST DEVELOPMENT**

**❌ NEVER RUN LOCALLY:**
- ❌ `npm install`
- ❌ `npm run dev`
- ❌ `npm run db:migrate`
- ❌ Any local Node.js commands

**✅ ALWAYS USE CONTAINERS:**

Start the development environment:
```bash
# Start all services with live reload (foreground)
docker-compose up --build

# Or run in background
npm run docker:up:detached

# Or use the npm script (foreground)
npm run docker:up
```

## 📁 Project Structure

```
job_google_search/              # Next.js Application Root
├── src/                        # Application source code
│   ├── app/                   # Next.js 13+ app directory
│   │   ├── api/              # API routes (backend)
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard pages
│   │   └── search/           # Search-related pages
│   ├── components/           # React components
│   │   ├── SavedResults/     # Job collection components
│   │   ├── SearchConfiguration.tsx
│   │   └── SearchResults.tsx
│   └── lib/                  # Utilities and services
│       ├── auth.ts           # Authentication logic
│       ├── database/         # Database operations
│       ├── queue/            # Redis queue management
│       ├── search/           # Google search & scraping
│       └── worker.ts         # Background job processor
├── data/                     # Persistent data storage
│   ├── sqlite/              # SQLite database files
│   └── redis/               # Redis persistence
├── docs/                     # Documentation
├── public/                   # Static assets
├── docker-compose.yml        # Docker services configuration
├── Dockerfile               # Development container
└── package.json             # Dependencies and scripts
```

## 🛠️ Available Scripts

### Available Commands

**All commands run inside Docker containers:**

```bash
# Development (with live reload)
npm run docker:up             # Start all services (foreground)
npm run docker:up:detached    # Start all services (background)
docker-compose up --build    # Direct docker-compose command

# Management
npm run docker:down           # Stop all services
npm run docker:restart        # Restart all services

# Logs
npm run docker:logs           # View all container logs
npm run docker:logs:web       # View web service logs only
npm run docker:logs:worker    # View worker service logs only

# Database & Worker (inside containers)
docker-compose exec web npm run db:migrate    # Run database migrations
docker-compose exec worker npm run worker     # Check worker status
```

**Note:** This application is designed to run exclusively in Docker. All development happens in containers with live reload.

## 🔧 Services

### Web Application (Port 3000)
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **API**: RESTful API routes for job search and user management
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: SQLite with better-sqlite3
- **Queue**: BullMQ with Redis for background job processing

### Background Worker
- **Job Processing**: Automated job search execution
- **Web Scraping**: Puppeteer-based content analysis
- **Queue Management**: Redis-based job queue processing

### CLI Tool
- **Standalone**: Independent job search automation
- **Configurable**: Environment-based configuration
- **Batch Processing**: Process multiple search queries

### Redis (Port 6379)
- **Queue Management**: Job queue for background processing
- **Caching**: Session and search result caching
- **Pub/Sub**: Real-time updates for web application

## 🐳 Docker Configuration

### Single Development Setup
```bash
# Start all services with live reload
docker-compose up --build

# Run in background
docker-compose up --build -d

# View logs
npm run docker:logs

# Scale worker services if needed
docker-compose up --build --scale worker=2
```

### Service Health Checks
All services include health checks for monitoring:
- Web app: HTTP health endpoint
- Redis: Redis ping command
- CLI: Node.js version check

## 📊 Features

### Next.js Application Features
- ✅ User authentication with Google OAuth
- ✅ Interactive job search interface
- ✅ Real-time search progress tracking
- ✅ Job collection and organization
- ✅ Advanced search filters
- ✅ Responsive design
- ✅ Background job processing
- ✅ Usage analytics and limits

## 🔐 Security

- **Container Security**: Non-root users in all containers
- **API Security**: Rate limiting and authentication
- **Data Protection**: Secure environment variable handling
- **Network Isolation**: Docker network segmentation

## 📈 Performance

- **Multi-stage Builds**: Optimized Docker images
- **Caching**: Redis-based caching for improved performance
- **Queue Processing**: Background job processing for scalability
- **Database**: SQLite for fast local data access

## 🧪 Development

### Docker-Only Development

**🚨 ALL DATABASE OPERATIONS MUST BE DONE IN CONTAINERS:**

```bash
# Start development environment with live reload
docker-compose up --build

# Run database migrations (INSIDE CONTAINER ONLY)
docker-compose exec web npm run db:migrate

# Database operations (INSIDE CONTAINER ONLY)
docker-compose exec web node -e "console.log('Database operations here')"

# View logs
npm run docker:logs:web
```

**⚠️ WARNING: Local and container databases are SEPARATE. Never mix local and container database operations!**

### Testing
```bash
# Run tests for web app
cd apps/web && npm test

# Run linting
npm run lint
```

## 📚 Documentation

- [Project Standards](./docs/PROJECT_STANDARDS.md) - Coding standards and best practices
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [Google Auth Setup](./docs/GOOGLE_AUTH_IMPLEMENTATION.md) - Authentication configuration

## 🤝 Contributing

1. Follow the project standards outlined in `docs/PROJECT_STANDARDS.md`
2. Use conventional commit messages
3. Ensure all tests pass and linting is clean
4. Update documentation for new features

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation in the `docs/` directory
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Node.js, Next.js, Docker, and modern web technologies**