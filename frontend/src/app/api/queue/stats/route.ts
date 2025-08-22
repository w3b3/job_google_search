import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getQueueStats } from '@/lib/queue/search-queue';

export async function GET(request: NextRequest) {
  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get queue statistics'
    } as ApiResponse, { status: 500 });
  }
}
