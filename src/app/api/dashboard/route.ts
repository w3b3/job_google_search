/**
 * API routes for dashboard and analytics
 * GET /api/dashboard - Get user dashboard statistics
 * GET /api/dashboard/pipeline - Get application pipeline statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserDashboardStats,
  getApplicationPipelineStats
} from '@/lib/database/saved-results-operations';
import type { ApiResponse } from '@/lib/types';

/**
 * GET /api/dashboard
 * Get comprehensive dashboard statistics for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // TODO: Get userId from authentication when implemented
    const userId = searchParams.get('userId');
    const statsType = searchParams.get('type') || 'overview';
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 });
    }
    
    if (statsType === 'pipeline') {
      // Get application pipeline statistics
      const pipelineStats = await getApplicationPipelineStats(userId);
      
      const response: ApiResponse = {
        success: true,
        data: {
          type: 'pipeline',
          stats: pipelineStats,
          total: Object.values(pipelineStats).reduce((sum, count) => sum + count, 0)
        }
      };
      
      return NextResponse.json(response);
    } else {
      // Get comprehensive dashboard statistics
      const dashboardStats = await getUserDashboardStats(userId);
      
      if (!dashboardStats) {
        return NextResponse.json({
          success: false,
          error: 'User not found or no data available'
        }, { status: 404 });
      }
      
      // Also get pipeline stats for overview
      const pipelineStats = await getApplicationPipelineStats(userId);
      
      const response: ApiResponse = {
        success: true,
        data: {
          type: 'overview',
          user: dashboardStats,
          pipeline: pipelineStats,
          summary: {
            totalApplications: Object.values(pipelineStats).reduce((sum, count) => sum + count, 0),
            activeApplications: pipelineStats.applied + pipelineStats.interviewing,
            successRate: pipelineStats.offered > 0 ? 
              Math.round((pipelineStats.offered / (pipelineStats.applied + pipelineStats.interviewing + pipelineStats.rejected + pipelineStats.offered)) * 100) : 0
          }
        }
      };
      
      return NextResponse.json(response);
    }
    
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get dashboard statistics'
    }, { status: 500 });
  }
}
