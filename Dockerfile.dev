# Development Dockerfile for Next.js Web Application
# Optimized for development with live reload and debugging

FROM node:22-alpine

# Install dependencies for better-sqlite3 and development tools
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Create nextjs user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create data directory for SQLite and set permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Start the development server
CMD ["npm", "run", "dev"]