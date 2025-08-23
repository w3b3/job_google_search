#!/bin/bash

# Job Search Analyzer - Container Startup Script
# This script helps you run the full application stack in containers

set -e

echo "🚀 Starting Job Search Analyzer Application Stack"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your API keys"
    exit 1
fi

# Check if key environment variables are set in .env file
if ! grep -q "GOOGLE_API_KEY=" .env || ! grep -q "NEXTAUTH_SECRET=" .env; then
    echo "❌ Error: Required environment variables not found in .env file"
    echo "Please ensure GOOGLE_API_KEY, NEXTAUTH_SECRET, and other required variables are set"
    echo "Check .env.example for reference"
    exit 1
fi

echo "✅ Environment file validated"

# Function to show available commands
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start the full application stack (default)"
    echo "  dev         Start development mode (frontend only with live reload)"
    echo "  stop        Stop all containers"
    echo "  restart     Restart all containers"
    echo "  logs        Show logs from all containers"
    echo "  status      Show container status"
    echo "  cli         Run CLI job search analyzer only"
    echo "  monitoring  Start with monitoring tools (Redis Commander, SQLite Web)"
    echo "  build       Build all containers without starting"
    echo "  clean       Stop containers and remove volumes (⚠️  destroys data)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start              # Start frontend + worker + redis"
    echo "  $0 monitoring         # Start with monitoring tools"
    echo "  $0 cli                # Run one-time CLI search"
    echo "  $0 logs frontend      # Show frontend logs only"
}

# Parse command
COMMAND=${1:-start}

case $COMMAND in
    "start")
        echo "🔄 Starting application stack..."
        docker-compose -f docker-compose.full.yml up -d frontend worker redis
        echo ""
        echo "✅ Application started successfully!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "📊 Redis: localhost:6379"
        echo ""
        echo "📋 To view logs: $0 logs"
        echo "🛑 To stop: $0 stop"
        ;;
    
    "dev")
        echo "🔄 Starting development mode..."
        docker-compose -f docker-compose.dev.yml up -d
        echo ""
        echo "✅ Development mode started!"
        echo "🌐 Frontend: http://localhost:3000 (with live reload)"
        echo "📊 Redis: localhost:6379"
        echo ""
        echo "📋 To view logs: $0 logs"
        echo "🛑 To stop: $0 stop"
        ;;
    
    "stop")
        echo "🛑 Stopping all containers..."
        docker-compose -f docker-compose.full.yml down 2>/dev/null || true
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
        echo "✅ All containers stopped"
        ;;
    
    "restart")
        echo "🔄 Restarting application stack..."
        docker-compose -f docker-compose.full.yml restart
        echo "✅ Application restarted"
        ;;
    
    "logs")
        if [ -n "$2" ]; then
            echo "📋 Showing logs for $2..."
            docker-compose -f docker-compose.full.yml logs -f "$2"
        else
            echo "📋 Showing logs for all services..."
            docker-compose -f docker-compose.full.yml logs -f
        fi
        ;;
    
    "status")
        echo "📊 Container Status:"
        docker-compose -f docker-compose.full.yml ps
        ;;
    
    "cli")
        echo "🔍 Running CLI job search analyzer..."
        docker-compose -f docker-compose.full.yml --profile cli run --rm cli-analyzer
        ;;
    
    "monitoring")
        echo "🔄 Starting with monitoring tools..."
        docker-compose -f docker-compose.full.yml --profile monitoring up -d
        echo ""
        echo "✅ Application with monitoring started!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "📊 Redis Commander: http://localhost:8081"
        echo "🗄️  SQLite Web: http://localhost:8080"
        ;;
    
    "build")
        echo "🔨 Building all containers..."
        docker-compose -f docker-compose.full.yml build
        echo "✅ Build complete"
        ;;
    
    "clean")
        echo "⚠️  WARNING: This will destroy all data (database, redis, etc.)"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🧹 Cleaning up containers and volumes..."
            docker-compose -f docker-compose.full.yml down -v
            docker system prune -f
            echo "✅ Cleanup complete"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    
    "help"|"-h"|"--help")
        show_help
        ;;
    
    *)
        echo "❌ Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
