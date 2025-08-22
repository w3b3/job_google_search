import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, SearchStatusResponse } from '@/lib/types';
import { getSearchById, getSearchProgress, getSearchResults } from '@/lib/database/operations';

export async function GET(
  request: NextRequest,
  { params }: { params: { searchId: string } }
) {
  try {
    const { searchId } = params;
    
    if (!searchId) {
      return NextResponse.json({
        success: false,
        error: 'Search ID is required'
      } as ApiResponse, { status: 400 });
    }
    
    // Get search information
    const search = await getSearchById(searchId);
    
    if (!search) {
      return NextResponse.json({
        success: false,
        error: 'Search not found'
      } as ApiResponse, { status: 404 });
    }
    
    // Get progress information
    const progress = await getSearchProgress(searchId);
    
    // Get results if search is completed
    let results = undefined;
    if (search.status === 'completed') {
      results = await getSearchResults(searchId, 100); // Get first 100 results
    }
    
    return NextResponse.json({
      success: true,
      data: {
        search,
        progress,
        results
      } as SearchStatusResponse
    } as ApiResponse<SearchStatusResponse>);
    
  } catch (error) {
    console.error('Error getting search status:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get search status'
    } as ApiResponse, { status: 500 });
  }
}
