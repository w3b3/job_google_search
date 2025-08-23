import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Search } from '@/lib/types';
import { getRecentSearches } from '@/lib/database/operations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const userId = searchParams.get('userId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 recent searches
    
    // Get recent searches
    const searches = await getRecentSearches(userId, limit);
    
    return NextResponse.json({
      success: true,
      data: searches,
      meta: {
        count: searches.length,
        limit
      }
    } as ApiResponse<Search[]>);
    
  } catch (error) {
    console.error('Error getting recent searches:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recent searches'
    } as ApiResponse, { status: 500 });
  }
}
