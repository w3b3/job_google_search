/** @type {import('next').NextConfig} */
const nextConfig = {
  // Updated for Next.js 15
  serverExternalPackages: ['puppeteer', 'better-sqlite3'],
  
  // Environment variable configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Optimize for Docker
  output: 'standalone',
  
  // Webpack configuration for better module resolution
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle SQLite native modules
      config.externals.push('better-sqlite3');
    }
    return config;
  },
}

module.exports = nextConfig
