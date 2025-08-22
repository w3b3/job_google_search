import Redis from 'ioredis';

declare global {
  var __redis: Redis | undefined;
}

const redis = globalThis.__redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
  family: 4, // Force IPv4
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__redis = redis;
}

// Test Redis connection
export async function testRedisConnection() {
  try {
    await redis.ping();
    console.log('✅ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

export { redis };
