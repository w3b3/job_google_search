import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/database/connection';
import { testRedisConnection } from '@/lib/queue/redis';

export async function GET(request: NextRequest) {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test database connection
    checks.database = await testConnection();
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  try {
    // Test Redis connection
    checks.redis = await testRedisConnection();
  } catch (error) {
    console.error('Redis health check failed:', error);
  }
  
  const isHealthy = checks.database && checks.redis;
  
  return NextResponse.json({
    healthy: isHealthy,
    checks
  }, {
    status: isHealthy ? 200 : 503
  });
}
