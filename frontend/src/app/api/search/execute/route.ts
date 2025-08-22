import { NextRequest, NextResponse } from 'next/server';
import { SearchConfigSchema, ApiResponse, SearchJobResponse } from '@/lib/types';
import { createSearch } from '@/lib/database/operations';
import { queueSearchJob } from '@/lib/queue/search-queue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, config, userId } = body;
    
    // Validate the search configuration
    const validationResult = SearchConfigSchema.safeParse(config);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration',
        details: validationResult.error.errors
      } as ApiResponse, { status: 400 });
    }
    
    const validatedConfig = validationResult.data;
    
    // Create search record in database
    const searchId = await createSearch(
      name || `Search ${new Date().toLocaleString()}`,
      validatedConfig,
      userId
    );
    
    // Queue the search job for background processing
    const jobId = await queueSearchJob(searchId, validatedConfig, userId);
    
    console.log(`✅ Created search ${searchId} and queued job ${jobId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        searchId,
        jobId,
        status: 'queued',
        message: 'Search has been queued for processing'
      } as SearchJobResponse
    } as ApiResponse<SearchJobResponse>);
    
  } catch (error) {
    console.error('Error executing search:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start search'
    } as ApiResponse, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
