# Use Node 22 LTS as the base image with Alpine for smaller size
FROM node:22-alpine

# Install necessary packages for Puppeteer
# - Chrome dependencies for running headless browser
# - ca-certificates for HTTPS requests
# - fonts for proper text rendering
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set the working directory
WORKDIR /usr/src/app

# Copy package files first for better Docker layer caching
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies
# Use npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source code
COPY --chown=nodejs:nodejs . .

# Set Puppeteer to use the system-installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Switch to non-root user
USER nodejs

# Expose port (not strictly necessary for this CLI app, but good practice)
EXPOSE 3000

# Add healthcheck (optional - can be customized based on your needs)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Default command to run the application
CMD ["npm", "start"]
