import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SearchConfigSchema, ApiResponse, SearchJobResponse } from '@/lib/types';
import { createSearch } from '@/lib/database/operations';
import { queueSearchJob } from '@/lib/queue/search-queue';
import { getUserUsageStats, incrementUserSearchUsage } from '@/lib/database/auth-operations';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please sign in to create searches'
      } as ApiResponse, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check usage limits
    const usageStats = await getUserUsageStats(userId);
    
    if (!usageStats.canCreateSearch) {
      return NextResponse.json({
        success: false,
        error: 'Search limit exceeded',
        message: `You have used ${usageStats.searchesUsed} of ${usageStats.searchLimit} searches this month. ${
          usageStats.accountType === 'free' 
            ? 'Upgrade to Pro for unlimited searches or wait for your limit to reset.' 
            : 'Please contact support.'
        }`,
        usageStats,
      } as ApiResponse, { status: 429 });
    }
    
    const body = await request.json();
    const { name, config } = body;
    
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
    
    // Add backend Google API credentials
    const configWithApiKeys = {
      ...validatedConfig,
      googleApiKey: process.env.GOOGLE_API_KEY!,
      googleCseId: process.env.GOOGLE_CSE_ID!,
    };
    
    // Create search record in database
    const searchId = await createSearch(
      name || `Search ${new Date().toLocaleString()}`,
      configWithApiKeys,
      userId
    );
    
    // Increment usage counter
    await incrementUserSearchUsage(userId, searchId);
    
    // Queue the search job for background processing
    const jobId = await queueSearchJob(searchId, configWithApiKeys, userId);
    
    console.log(`✅ Created search ${searchId} and queued job ${jobId} for user ${userId}`);
    
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
