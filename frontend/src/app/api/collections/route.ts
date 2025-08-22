/**
 * API routes for saved result collections
 * GET /api/collections - List collections with filtering
 * POST /api/collections - Create new collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCollection,
  listCollections
} from '@/lib/database/saved-results-operations';
import type { 
  CreateCollectionRequest,
  CollectionFilters,
  ApiResponse,
  CollectionListResponse 
} from '@/lib/types';

// Validation schemas
const CreateCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
  colorTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  isPublic: z.boolean().optional(),
  searchId: z.string().optional()
});

const CollectionFiltersSchema = z.object({
  isArchived: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'total_jobs']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

/**
 * GET /api/collections
 * List collections with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const rawFilters = {
      isArchived: searchParams.get('isArchived') ? searchParams.get('isArchived') === 'true' : undefined,
      isPublic: searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as any || undefined,
      sortOrder: searchParams.get('sortOrder') as any || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    };
    
    // Validate filters
    const filters = CollectionFiltersSchema.parse(rawFilters);
    
    // TODO: Get userId from authentication when implemented
    const userId = searchParams.get('userId') || undefined;
    
    // Get collections
    const { collections, totalCount } = await listCollections(filters, userId);
    
    const response: ApiResponse<CollectionListResponse> = {
      success: true,
      data: {
        collections,
        totalCount,
        hasMore: (filters.offset || 0) + collections.length < totalCount
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error listing collections:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        message: error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to list collections'
    }, { status: 500 });
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const createRequest = CreateCollectionSchema.parse(body) as CreateCollectionRequest;
    
    // TODO: Get userId from authentication when implemented
    const userId = request.headers.get('x-user-id') || undefined;
    
    // Create collection
    const collection = await createCollection(createRequest, userId);
    
    const response: ApiResponse = {
      success: true,
      data: collection,
      message: 'Collection created successfully'
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('Error creating collection:', error);
    
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
      message: 'Failed to create collection'
    }, { status: 500 });
  }
}
