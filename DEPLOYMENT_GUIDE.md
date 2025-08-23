# 🚀 Complete Deployment Guide - Monorepo

This guide walks you through deploying the Job Search Analyzer monorepo with both the CLI tool and Next.js web application in a well-organized structure.

## 📁 Project Structure Overview

```
job_google_search/                 # Monorepo Root
├── 📁 apps/                      # Applications
│   ├── cli/                      # CLI job search tool
│   │   ├── index.js              # CLI scraper
│   │   ├── package.json          # CLI dependencies
│   │   └── Dockerfile            # CLI container
│   └── web/                      # Next.js web application
│       ├── src/                  # Source code
│       ├── package.json          # Web app dependencies
│       ├── Dockerfile            # Production container
│       └── Dockerfile.dev        # Development container
├── 📁 data/                      # Persistent data storage
│   ├── sqlite/                   # SQLite database files
│   └── redis/                    # Redis persistence
│   └── .env.example              # CLI configuration
│
└── frontend/                     # 🆕 New Next.js Application
    ├── src/                      # Application source
    │   ├── app/                  # Next.js 15 App Router
    │   ├── components/           # React components
    │   └── lib/                  # Core logic & utilities
    ├── Dockerfile               # Next.js container
    ├── docker-compose.yml       # Full-stack services
    ├── package.json            # Frontend dependencies
    └── README.md               # Frontend documentation
```

## 🎯 Deployment Options

### Option 1: Next.js Frontend Only (Recommended)
Complete web application with UI, API, and background processing.

### Option 2: CLI Tool Only  
Original command-line tool for automated usage.

### Option 3: Both (Advanced)
Run both CLI and frontend side-by-side.

---

## 🌐 **Option 1: Next.js Frontend Deployment**

### **Step 1: Setup Environment**

```bash
# Navigate to frontend directory
cd frontend/

# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

**Required Configuration:**
```bash
# Your AWS PostgreSQL Database
DATABASE_URL=postgresql://username:password@your-ec2-instance.amazonaws.com:5432/jobsearch

# Redis (will be created by Docker Compose)  
REDIS_URL=redis://redis:6379

# Google API Credentials (REQUIRED)
GOOGLE_API_KEY=your_google_custom_search_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# Environment
NODE_ENV=production
```

### **Step 2: Deploy with Docker**

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f nextjs-app
```

### **Step 3: Initialize Database**

```bash
# Run database migration
docker-compose exec nextjs-app npm run db:migrate

# Verify database connection
curl http://localhost:3000/api/health
```

### **Step 4: Access Application**

- **🌐 Web Interface**: http://localhost:3000
- **⚕️ Health Check**: http://localhost:3000/api/health  
- **📊 Queue Stats**: http://localhost:3000/api/queue/stats
- **🔧 Redis Monitor**: http://localhost:8081 (with `--profile monitoring`)
- **🗄️ Database Admin**: http://localhost:8080 (with `--profile monitoring`)

### **Step 5: Test Search**

1. Open http://localhost:3000
2. Fill in Google API credentials
3. Configure search parameters
4. Click "🚀 Start Job Search"
5. Monitor real-time progress
6. View and export results

---

## 🖥️ **Option 2: CLI Tool Deployment**

### **Step 1: Setup Environment**

```bash
# Use original directory
cd job_google_search/

# Copy environment template  
cp .env.example .env

# Edit configuration
nano .env
```

### **Step 2: Run CLI Tool**

```bash
# With Docker Compose
docker-compose up --build

# Or build and run directly
docker build -t job-search-cli .
docker run --env-file .env job-search-cli
```

---

## 🔄 **Option 3: Both CLI and Frontend**

### **Directory Structure**
```bash
# Keep both implementations
job_google_search/
├── index.js              # CLI tool
├── docker-compose.yml    # CLI services  
├── frontend/             # Web application
│   └── docker-compose.yml # Frontend services
```

### **Deployment Commands**

```bash
# Start CLI tool
docker-compose up --build -d

# Start frontend (different ports)
cd frontend/
docker-compose up --build -d
```

---

## 🔧 **Production Configuration**

### **Environment Variables**

#### **Required**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
GOOGLE_API_KEY=your_google_api_key  
GOOGLE_CSE_ID=your_custom_search_engine_id
```

#### **Optional Optimization**
```bash
NODE_ENV=production
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
DEBUG=false
```

#### **Advanced Settings**
```bash
# Resource limits
WORKER_CONCURRENCY=3
MAX_BROWSER_INSTANCES=5
REQUEST_DELAY=1000
PAGE_TIMEOUT=30000

# Queue settings  
QUEUE_MAX_JOBS=100
QUEUE_MAX_ATTEMPTS=3
```

### **Resource Requirements**

#### **Minimum System Requirements**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB
- **Network**: Stable internet for API calls

#### **Recommended for Production**
- **CPU**: 4 cores  
- **RAM**: 8GB
- **Storage**: 20GB SSD
- **Load Balancer**: For multiple instances

---

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```bash
# Application health
curl http://localhost:3000/api/health

# Queue statistics
curl http://localhost:3000/api/queue/stats

# Database connection
docker-compose exec nextjs-app npm run db:migrate
```

### **Log Monitoring**
```bash
# Application logs
docker-compose logs -f nextjs-app

# Worker logs
docker-compose logs -f worker  

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

### **Performance Monitoring**
```bash
# Container stats
docker stats

# Queue monitoring  
docker-compose --profile monitoring up -d
# Visit: http://localhost:8081

# Database monitoring
# Visit: http://localhost:8080 (admin/admin)
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec postgres psql $DATABASE_URL
```

#### **Google API Errors**
```bash
# Verify API key
curl "https://www.googleapis.com/customsearch/v1?key=$GOOGLE_API_KEY&cx=$GOOGLE_CSE_ID&q=test"

# Check quotas in Google Cloud Console
```

#### **Worker Not Processing**
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Restart worker
docker-compose restart worker
```

#### **Browser/Puppeteer Issues**
```bash
# Check Chrome installation
docker-compose exec worker google-chrome --version

# Increase memory limit
docker-compose up --scale worker=1 -d
```

### **Debugging Commands**
```bash
# Interactive container access
docker-compose exec nextjs-app sh
docker-compose exec worker sh

# View container logs
docker-compose logs --tail=100 nextjs-app

# Reset services
docker-compose down && docker-compose up --build -d
```

---

## 🔄 **Updates & Maintenance**

### **Updating the Application**
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Restart services
docker-compose down && docker-compose up -d
```

### **Database Backups**
```bash
# Backup database
docker-compose exec postgres pg_dump -U jobsearch jobsearch > backup.sql

# Restore database  
docker-compose exec postgres psql -U jobsearch jobsearch < backup.sql
```

### **Scaling Workers**
```bash
# Scale background workers
docker-compose up --scale worker=3 -d

# Scale web application
docker-compose up --scale nextjs-app=2 -d
```

---

## 📈 **Performance Optimization**

### **For High Volume Usage**
```bash
# Increase worker concurrency
echo "WORKER_CONCURRENCY=5" >> .env

# Use external Redis/PostgreSQL
DATABASE_URL=postgresql://external-db:5432/jobsearch
REDIS_URL=redis://external-redis:6379

# Enable monitoring
docker-compose --profile monitoring up -d
```

### **Memory Optimization**
```bash
# Adjust container limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

---

## 🎯 **Success Checklist**

### ✅ **Deployment Verification**
- [ ] All containers running: `docker-compose ps`
- [ ] Health check passes: `curl localhost:3000/api/health`
- [ ] Database connected: API health shows database: true
- [ ] Redis connected: API health shows redis: true
- [ ] Web interface loads: http://localhost:3000
- [ ] Search completes successfully: Test with small search
- [ ] Results display correctly: Check search results page
- [ ] Export functions work: Download CSV/JSON

### ✅ **Production Readiness**  
- [ ] Environment variables configured
- [ ] External database connected (if using AWS EC2)
- [ ] Google API credentials valid
- [ ] Resource limits appropriate
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] SSL/HTTPS configured (for public deployment)
- [ ] Domain/DNS configured (for public deployment)

---

## 🚀 **Going Live**

### **Public Deployment**
If deploying publicly, consider:

1. **SSL Certificate**: Use Let's Encrypt or CloudFlare
2. **Domain Setup**: Point DNS to your server
3. **Reverse Proxy**: Nginx for production
4. **Security**: Firewall, rate limiting
5. **Monitoring**: Application performance monitoring
6. **Backups**: Automated database backups
7. **Updates**: CI/CD pipeline for deployments

### **Example Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

🎉 **Congratulations!** Your Job Search Analyzer is now deployed and ready to automate job discovery across multiple ATS platforms!
