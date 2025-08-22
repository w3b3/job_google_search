/**
 * API routes for bulk operations on saved jobs
 * PUT /api/saved-jobs/bulk - Bulk update saved jobs
 * POST /api/saved-jobs/bulk/move - Bulk move saved jobs to different collection
 * DELETE /api/saved-jobs/bulk - Bulk delete saved jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  bulkUpdateSavedResults,
  bulkMoveSavedResults,
  bulkDeleteSavedResults
} from '@/lib/database/saved-results-operations';
import type { 
  BulkUpdateSavedJobsRequest,
  BulkMoveJobsRequest,
  BulkDeleteJobsRequest,
  ApiResponse 
} from '@/lib/types';

// Validation schemas
const BulkUpdateSchema = z.object({
  savedJobIds: z.array(z.string().min(1)).min(1, 'At least one job ID required').max(100, 'Too many jobs'),
  updates: z.object({
    userNotes: z.string().max(1000, 'Notes too long').optional(),
    userRating: z.number().min(1).max(5).optional(),
    applicationStatus: z.enum(['not_applied', 'applied', 'interviewing', 'rejected', 'offered', 'accepted', 'withdrawn']).optional(),
    priorityLevel: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    applicationDate: z.string().optional(),
    followUpDate: z.string().optional(),
    interviewDate: z.string().optional(),
    salaryOffered: z.number().min(0).optional(),
    customTags: z.array(z.string().max(50)).max(10, 'Too many tags').optional()
  })
});

const BulkMoveSchema = z.object({
  savedJobIds: z.array(z.string().min(1)).min(1, 'At least one job ID required').max(100, 'Too many jobs'),
  targetCollectionId: z.string().min(1, 'Target collection ID required')
});

const BulkDeleteSchema = z.object({
  savedJobIds: z.array(z.string().min(1)).min(1, 'At least one job ID required').max(100, 'Too many jobs')
});

/**
 * PUT /api/saved-jobs/bulk
 * Bulk update saved jobs
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const bulkUpdateRequest = BulkUpdateSchema.parse(body) as BulkUpdateSavedJobsRequest;
    
    // Perform bulk update
    const updatedCount = await bulkUpdateSavedResults(
      bulkUpdateRequest.savedJobIds,
      bulkUpdateRequest.updates
    );
    
    const response: ApiResponse = {
      success: true,
      data: { updatedCount },
      message: `${updatedCount} saved jobs updated successfully`
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error bulk updating saved jobs:', error);
    
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
      message: 'Failed to bulk update saved jobs'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/saved-jobs/bulk
 * Bulk delete saved jobs
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const bulkDeleteRequest = BulkDeleteSchema.parse(body) as BulkDeleteJobsRequest;
    
    // Perform bulk delete
    const deletedCount = await bulkDeleteSavedResults(bulkDeleteRequest.savedJobIds);
    
    const response: ApiResponse = {
      success: true,
      data: { deletedCount },
      message: `${deletedCount} saved jobs deleted successfully`
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error bulk deleting saved jobs:', error);
    
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
      message: 'Failed to bulk delete saved jobs'
    }, { status: 500 });
  }
}
