/**
 * API routes for individual saved jobs
 * GET /api/saved-jobs/[savedJobId] - Get saved job details
 * PUT /api/saved-jobs/[savedJobId] - Update saved job
 * DELETE /api/saved-jobs/[savedJobId] - Remove saved job
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getSavedResultById,
  updateSavedResult,
  removeSavedResult,
  updateSavedResultViewStats
} from '@/lib/database/saved-results-operations';
import type { 
  UpdateSavedJobRequest,
  ApiResponse 
} from '@/lib/types';

// Validation schema
const UpdateSavedJobSchema = z.object({
  userNotes: z.string().max(1000, 'Notes too long').optional(),
  userRating: z.number().min(1).max(5).optional(),
  applicationStatus: z.enum(['not_applied', 'applied', 'interviewing', 'rejected', 'offered', 'accepted', 'withdrawn']).optional(),
  priorityLevel: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  applicationDate: z.string().optional(), // ISO date string
  followUpDate: z.string().optional(),
  interviewDate: z.string().optional(),
  salaryOffered: z.number().min(0).optional(),
  customTags: z.array(z.string().max(50)).max(10, 'Too many tags').optional()
});

/**
 * GET /api/saved-jobs/[savedJobId]
 * Get saved job details and optionally update view stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { savedJobId: string } }
) {
  try {
    const { savedJobId } = params;
    const { searchParams } = new URL(request.url);
    const trackView = searchParams.get('trackView') === 'true';
    
    // Get saved job
    const savedJob = await getSavedResultById(savedJobId);
    
    if (!savedJob) {
      return NextResponse.json({
        success: false,
        error: 'Saved job not found'
      }, { status: 404 });
    }
    
    // Update view stats if requested
    if (trackView) {
      await updateSavedResultViewStats(savedJobId);
      // Refresh the saved job to get updated view count
      const updatedSavedJob = await getSavedResultById(savedJobId);
      if (updatedSavedJob) {
        savedJob.viewCount = updatedSavedJob.viewCount;
        savedJob.lastViewedAt = updatedSavedJob.lastViewedAt;
      }
    }
    
    const response: ApiResponse = {
      success: true,
      data: savedJob
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error getting saved job:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get saved job'
    }, { status: 500 });
  }
}

/**
 * PUT /api/saved-jobs/[savedJobId]
 * Update saved job details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { savedJobId: string } }
) {
  try {
    const { savedJobId } = params;
    const body = await request.json();
    
    // Validate request body
    const updateRequest = UpdateSavedJobSchema.parse(body) as UpdateSavedJobRequest;
    
    // Update saved job
    const updatedSavedJob = await updateSavedResult(savedJobId, updateRequest);
    
    if (!updatedSavedJob) {
      return NextResponse.json({
        success: false,
        error: 'Saved job not found'
      }, { status: 404 });
    }
    
    const response: ApiResponse = {
      success: true,
      data: updatedSavedJob,
      message: 'Saved job updated successfully'
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error updating saved job:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        message: error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update saved job'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/saved-jobs/[savedJobId]
 * Remove saved job from collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { savedJobId: string } }
) {
  try {
    const { savedJobId } = params;
    
    // Check if saved job exists
    const savedJob = await getSavedResultById(savedJobId);
    if (!savedJob) {
      return NextResponse.json({
        success: false,
        error: 'Saved job not found'
      }, { status: 404 });
    }
    
    // TODO: Add authorization check - only owner should be able to delete
    
    // Remove saved job
    const removed = await removeSavedResult(savedJobId);
    
    if (!removed) {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove saved job'
      }, { status: 500 });
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Saved job removed successfully'
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error removing saved job:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove saved job'
    }, { status: 500 });
  }
}
