/**
 * API routes for saved jobs within collections
 * GET /api/collections/[collectionId]/jobs - List saved jobs in collection
 * POST /api/collections/[collectionId]/jobs - Save job to collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listSavedResults,
  saveJobToCollection,
  isJobSavedInCollection,
  getCollectionById
} from '@/lib/database/saved-results-operations';
import type { 
  SaveJobRequest,
  SavedJobFilters,
  ApiResponse,
  SavedJobsResponse,
  ApplicationStatus,
  PriorityLevel 
} from '@/lib/types';

// Validation schemas
const SaveJobSchema = z.object({
  jobResultId: z.string().min(1, 'Job result ID is required'),
  userNotes: z.string().max(1000, 'Notes too long').optional(),
  userRating: z.number().min(1).max(5).optional(),
  priorityLevel: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  customTags: z.array(z.string().max(50)).max(10, 'Too many tags').optional()
});

const SavedJobFiltersSchema = z.object({
  collectionId: z.string().optional(),
  applicationStatus: z.array(z.enum(['not_applied', 'applied', 'interviewing', 'rejected', 'offered', 'accepted', 'withdrawn'])).optional(),
  priorityLevel: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),
  userRating: z.object({
    min: z.number().min(1).max(5).optional(),
    max: z.number().min(1).max(5).optional()
  }).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['added_at', 'user_rating', 'match_count', 'application_date']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

/**
 * GET /api/collections/[collectionId]/jobs
 * List saved jobs in collection with filtering and pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Check if collection exists
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found'
      }, { status: 404 });
    }
    
    // Parse query parameters
    const rawFilters = {
      applicationStatus: searchParams.get('applicationStatus') ? 
        searchParams.get('applicationStatus')!.split(',') as ApplicationStatus[] : undefined,
      priorityLevel: searchParams.get('priorityLevel') ? 
        searchParams.get('priorityLevel')!.split(',') as PriorityLevel[] : undefined,
      userRating: searchParams.get('userRatingMin') || searchParams.get('userRatingMax') ? {
        min: searchParams.get('userRatingMin') ? parseInt(searchParams.get('userRatingMin')!) : undefined,
        max: searchParams.get('userRatingMax') ? parseInt(searchParams.get('userRatingMax')!) : undefined
      } : undefined,
      dateRange: searchParams.get('dateStart') && searchParams.get('dateEnd') ? {
        start: searchParams.get('dateStart')!,
        end: searchParams.get('dateEnd')!
      } : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as any || undefined,
      sortOrder: searchParams.get('sortOrder') as any || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    };
    
    // Validate filters
    const filters = SavedJobFiltersSchema.parse(rawFilters);
    
    // Add collection filter
    filters.collectionId = collectionId;
    
    // Get saved jobs
    const { savedResults, totalCount } = await listSavedResults(filters);
    
    const response: ApiResponse<SavedJobsResponse> = {
      success: true,
      data: {
        savedJobs: savedResults,
        totalCount,
        hasMore: (filters.offset || 0) + savedResults.length < totalCount
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error listing saved jobs:', error);
    
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
      message: 'Failed to list saved jobs'
    }, { status: 500 });
  }
}

/**
 * POST /api/collections/[collectionId]/jobs
 * Save a job to the collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const body = await request.json();
    
    // Check if collection exists
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found'
      }, { status: 404 });
    }
    
    // Validate request body
    const saveRequest = SaveJobSchema.parse(body);
    
    // Check if job is already saved in this collection
    const alreadySaved = await isJobSavedInCollection(saveRequest.jobResultId, collectionId);
    if (alreadySaved) {
      return NextResponse.json({
        success: false,
        error: 'Job already saved in this collection'
      }, { status: 409 });
    }
    
    // Create save job request
    const saveJobRequest: SaveJobRequest = {
      ...saveRequest,
      collectionId
    };
    
    // Save job to collection
    const savedResult = await saveJobToCollection(saveJobRequest);
    
    const response: ApiResponse = {
      success: true,
      data: savedResult,
      message: 'Job saved to collection successfully'
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('Error saving job to collection:', error);
    
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
      message: 'Failed to save job to collection'
    }, { status: 500 });
  }
}
