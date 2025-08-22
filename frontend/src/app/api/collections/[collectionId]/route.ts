/**
 * API routes for individual collections
 * GET /api/collections/[collectionId] - Get collection details
 * PUT /api/collections/[collectionId] - Update collection
 * DELETE /api/collections/[collectionId] - Delete collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCollectionById,
  updateCollection,
  deleteCollection,
  updateCollectionAccessTime,
  getCollectionSummary
} from '@/lib/database/saved-results-operations';
import type { 
  UpdateCollectionRequest,
  ApiResponse 
} from '@/lib/types';

// Validation schema
const UpdateCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
  colorTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  autoUpdate: z.boolean().optional()
});

/**
 * GET /api/collections/[collectionId]
 * Get collection details with optional statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { collectionId } = params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    
    if (includeStats) {
      // Get collection with computed statistics
      const collectionSummary = await getCollectionSummary(collectionId);
      
      if (!collectionSummary) {
        return NextResponse.json({
          success: false,
          error: 'Collection not found'
        }, { status: 404 });
      }
      
      // Update access time
      await updateCollectionAccessTime(collectionId);
      
      const response: ApiResponse = {
        success: true,
        data: collectionSummary
      };
      
      return NextResponse.json(response);
    } else {
      // Get basic collection details
      const collection = await getCollectionById(collectionId);
      
      if (!collection) {
        return NextResponse.json({
          success: false,
          error: 'Collection not found'
        }, { status: 404 });
      }
      
      // Update access time
      await updateCollectionAccessTime(collectionId);
      
      const response: ApiResponse = {
        success: true,
        data: collection
      };
      
      return NextResponse.json(response);
    }
    
  } catch (error) {
    console.error('Error getting collection:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get collection'
    }, { status: 500 });
  }
}

/**
 * PUT /api/collections/[collectionId]
 * Update collection
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { collectionId } = params;
    const body = await request.json();
    
    // Validate request body
    const updateRequest = UpdateCollectionSchema.parse(body) as UpdateCollectionRequest;
    
    // Update collection
    const updatedCollection = await updateCollection(collectionId, updateRequest);
    
    if (!updatedCollection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found'
      }, { status: 404 });
    }
    
    const response: ApiResponse = {
      success: true,
      data: updatedCollection,
      message: 'Collection updated successfully'
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error updating collection:', error);
    
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
      message: 'Failed to update collection'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[collectionId]
 * Delete collection and all its saved results
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { collectionId } = params;
    
    // Check if collection exists
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found'
      }, { status: 404 });
    }
    
    // TODO: Add authorization check - only owner should be able to delete
    
    // Delete collection
    const deleted = await deleteCollection(collectionId);
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete collection'
      }, { status: 500 });
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Collection deleted successfully'
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error deleting collection:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete collection'
    }, { status: 500 });
  }
}
