import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, JobResult } from '@/lib/types';
import { getSearchResults } from '@/lib/database/operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const { searchId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200); // Max 200 results per request
    const offset = parseInt(searchParams.get('offset') || '0');
    const format = searchParams.get('format') || 'json';
    
    if (!searchId) {
      return NextResponse.json({
        success: false,
        error: 'Search ID is required'
      } as ApiResponse, { status: 400 });
    }
    
    // Get search results
    const results = await getSearchResults(searchId, limit, offset);
    
    if (format === 'csv') {
      // Return CSV format
      const csv = convertToCSV(results);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="search-results-${searchId}.csv"`
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        count: results.length,
        limit,
        offset,
        hasMore: results.length === limit
      }
    } as ApiResponse<JobResult[]>);
    
  } catch (error) {
    console.error('Error getting search results:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get search results'
    } as ApiResponse, { status: 500 });
  }
}

function convertToCSV(results: JobResult[]): string {
  if (results.length === 0) return 'No results found';
  
  const headers = [
    'Title',
    'Link',
    'ATS Source',
    'Keywords Matched',
    'Match Count',
    'Company Name',
    'Location',
    'Scraped At'
  ];
  
  const rows = results.map(result => [
    `"${result.title.replace(/"/g, '""')}"`,
    result.link,
    result.atsSource,
    `"${result.keywordsMatched.join(', ')}"`,
    result.matchCount,
    result.companyName || '',
    result.location || '',
    result.scrapedAt.toISOString()
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
