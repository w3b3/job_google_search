import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getSearchById, deleteSearch } from '@/lib/database/operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const { searchId } = await params;
    
    if (!searchId) {
      return NextResponse.json({
        success: false,
        error: 'Search ID is required'
      } as ApiResponse, { status: 400 });
    }
    
    const search = await getSearchById(searchId);
    
    if (!search) {
      return NextResponse.json({
        success: false,
        error: 'Search not found'
      } as ApiResponse, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: search
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error getting search:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get search'
    } as ApiResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const { searchId } = await params;
    
    if (!searchId) {
      return NextResponse.json({
        success: false,
        error: 'Search ID is required'
      } as ApiResponse, { status: 400 });
    }
    
    // Check if search exists first
    const search = await getSearchById(searchId);
    
    if (!search) {
      return NextResponse.json({
        success: false,
        error: 'Search not found'
      } as ApiResponse, { status: 404 });
    }
    
    // Delete the search and all related data
    const deletedCount = await deleteSearch(searchId);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted search and ${deletedCount.jobResults} job results`,
      data: {
        searchId,
        deletedJobResults: deletedCount.jobResults,
        deletedProgressRecords: deletedCount.progressRecords
      }
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error deleting search:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete search'
    } as ApiResponse, { status: 500 });
  }
}
