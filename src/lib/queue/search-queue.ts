import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { SearchJobData, SearchConfig } from '../types';
import { performFullSearch } from '../search/orchestrator';
import { updateSearchStatus, updateSearchProgress, saveSearchResults } from '../database/operations';
import { cleanup } from '../search/scraper';

// Search queue for background job processing
export const searchQueue = new Queue<SearchJobData>('job-search', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 5,      // Keep last 5 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

/**
 * Add a search job to the queue
 */
export async function queueSearchJob(
  searchId: string,
  searchConfig: SearchConfig,
  userId?: string
): Promise<string> {
  const jobData: SearchJobData = {
    searchId,
    searchConfig,
    userId,
    timestamp: new Date().toISOString()
  };

  const job = await searchQueue.add('process-search', jobData);
  
  console.log(`✅ Queued search job ${job.id} for search ${searchId}`);
  return job.id || '';
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const job = await Job.fromId(searchQueue, jobId);
  if (!job) return null;

  return {
    id: job.id,
    progress: await job.getState(),
    data: job.data,
    returnValue: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

// Worker instance for processing search jobs
let worker: Worker<SearchJobData> | null = null;

/**
 * Start the background worker
 */
export function startWorker() {
  if (worker) {
    console.log('Worker already running');
    return worker;
  }

  worker = new Worker<SearchJobData>('job-search', async (job: Job<SearchJobData>) => {
    const { searchId, searchConfig, userId } = job.data;
    
    console.log(`🚀 Starting search job ${job.id} for search ${searchId}`);
    
    try {
      // Update search status to processing
      await updateSearchStatus(searchId, 'processing', new Date());
      await job.updateProgress(5);
      
      // Progress callback to update database
      const onProgress = async (progress: any) => {
        await updateSearchProgress(searchId, {
          currentPlatform: progress.currentPlatform,
          progressPercentage: progress.percentage,
          currentResult: progress.pagesScraped || 0,
          totalResults: progress.resultsFound || 0,
        });
        
        await job.updateProgress(progress.percentage);
      };
      
      // Perform the actual search
      const { results, stats } = await performFullSearch(searchConfig, onProgress);
      
      // Save results to database
      await saveSearchResults(searchId, results, stats);
      
      // Update search status to completed
      await updateSearchStatus(searchId, 'completed', undefined, new Date());
      await job.updateProgress(100);
      
      console.log(`✅ Completed search job ${job.id} - found ${results.length} matches`);
      
      return {
        matchCount: results.length,
        stats,
        completedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Failed search job ${job.id}:`, error);
      
      // Update search status to failed
      await updateSearchStatus(searchId, 'failed', undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    }
  }, {
    connection: redis,
    concurrency: 2, // Process 2 searches simultaneously
    limiter: {
      max: 5,     // Max 5 jobs
      duration: 60000 // per minute
    }
  });

  // Worker event handlers
  worker.on('completed', (job, returnValue) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });

  console.log('🔄 Background worker started');
  return worker;
}

/**
 * Stop the background worker
 */
export async function stopWorker() {
  if (worker) {
    await worker.close();
    await cleanup(); // Clean up browser resources
    worker = null;
    console.log('⏹️ Background worker stopped');
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const waiting = await searchQueue.getWaiting();
  const active = await searchQueue.getActive();
  const completed = await searchQueue.getCompleted();
  const failed = await searchQueue.getFailed();
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    total: waiting.length + active.length + completed.length + failed.length
  };
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await stopWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await stopWorker();
  process.exit(0);
});
