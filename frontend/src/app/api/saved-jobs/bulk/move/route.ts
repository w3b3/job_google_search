/**
 * API route for bulk moving saved jobs between collections
 * POST /api/saved-jobs/bulk/move - Move saved jobs to different collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  bulkMoveSavedResults,
  getCollectionById
} from '@/lib/database/saved-results-operations';
import type { 
  BulkMoveJobsRequest,
  ApiResponse 
} from '@/lib/types';

// Validation schema
const BulkMoveSchema = z.object({
  savedJobIds: z.array(z.string().min(1)).min(1, 'At least one job ID required').max(100, 'Too many jobs'),
  targetCollectionId: z.string().min(1, 'Target collection ID required')
});

/**
 * POST /api/saved-jobs/bulk/move
 * Move saved jobs to a different collection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const bulkMoveRequest = BulkMoveSchema.parse(body) as BulkMoveJobsRequest;
    
    // Check if target collection exists
    const targetCollection = await getCollectionById(bulkMoveRequest.targetCollectionId);
    if (!targetCollection) {
      return NextResponse.json({
        success: false,
        error: 'Target collection not found'
      }, { status: 404 });
    }
    
    // TODO: Add authorization check - user should have access to target collection
    
    // Perform bulk move
    const movedCount = await bulkMoveSavedResults(
      bulkMoveRequest.savedJobIds,
      bulkMoveRequest.targetCollectionId
    );
    
    const response: ApiResponse = {
      success: true,
      data: { 
        movedCount,
        targetCollection: {
          id: targetCollection.id,
          name: targetCollection.name
        }
      },
      message: `${movedCount} saved jobs moved to "${targetCollection.name}" successfully`
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error bulk moving saved jobs:', error);
    
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
      message: 'Failed to bulk move saved jobs'
    }, { status: 500 });
  }
}
