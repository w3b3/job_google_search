#!/usr/bin/env node
/**
 * Standalone worker process for background job processing
 * Run with: npm run worker
 */

import { startWorker, testRedisConnection } from './queue/search-queue';
import { testConnection } from './database/connection';

async function main() {
  console.log('🚀 Starting Job Search Worker...');
  
  // Test connections
  console.log('🔍 Testing connections...');
  
  const dbConnected = await testConnection();
  const redisConnected = await testRedisConnection();
  
  if (!dbConnected) {
    console.error('❌ Database connection failed. Exiting...');
    process.exit(1);
  }
  
  if (!redisConnected) {
    console.error('❌ Redis connection failed. Exiting...');
    process.exit(1);
  }
  
  console.log('✅ All connections successful');
  
  // Start the worker
  const worker = startWorker();
  
  console.log('🎯 Worker is ready to process search jobs');
  console.log('📊 Use Ctrl+C to stop the worker gracefully');
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Graceful shutdown initiated...');
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
