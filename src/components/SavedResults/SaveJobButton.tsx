'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react';
import type { 
  SavedResultCollection, 
  SaveJobRequest,
  CreateCollectionRequest,
  ApiResponse,
  CollectionListResponse 
} from '@/lib/types';

interface SaveJobButtonProps {
  jobResultId: string;
  jobTitle: string;
  userId?: string;
  className?: string;
}

export default function SaveJobButton({ jobResultId, jobTitle, userId, className = '' }: SaveJobButtonProps) {
  const [collections, setCollections] = useState<SavedResultCollection[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCollections, setSavedCollections] = useState<Set<string>>(new Set());

  // Load user's collections
  const loadCollections = async () => {
    if (!userId) return;

    try {
      const params = new URLSearchParams({
        userId,
        isArchived: 'false',
        sortBy: 'updated_at',
        sortOrder: 'desc',
        limit: '50'
      });

      const response = await fetch(`/api/collections?${params.toString()}`);
      const result: ApiResponse<CollectionListResponse> = await response.json();

      if (result.success && result.data) {
        setCollections(result.data.collections);
        // TODO: Check which collections already have this job saved
        checkSavedStatus(result.data.collections);
      }
    } catch (err) {
      console.error('Error loading collections:', err);
    }
  };

  // Check if job is already saved in collections
  const checkSavedStatus = async (collections: SavedResultCollection[]) => {
    // This would require additional API endpoint to check saved status
    // For now, we'll skip this optimization
  };

  useEffect(() => {
    if (showCollectionModal) {
      loadCollections();
    }
  }, [showCollectionModal, userId]);

  // Save job to collection
  const handleSaveToCollection = async (collectionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const saveRequest: SaveJobRequest = {
        jobResultId,
        collectionId,
        priorityLevel: 'medium'
      };

      const response = await fetch(`/api/collections/${collectionId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequest)
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSavedCollections(prev => new Set(prev).add(collectionId));
        setShowCollectionModal(false);
      } else {
        setError(result.error || 'Failed to save job');
      }
    } catch (err) {
      setError('Network error saving job');
      console.error('Error saving job:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new collection and save job
  const handleCreateAndSave = async (collectionData: CreateCollectionRequest) => {
    try {
      setLoading(true);
      setError(null);

      // Create collection
      const createResponse = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId })
        },
        body: JSON.stringify(collectionData)
      });

      const createResult: ApiResponse = await createResponse.json();

      if (!createResult.success || !createResult.data) {
        setError(createResult.error || 'Failed to create collection');
        return;
      }

      const newCollection = createResult.data;

      // Save job to new collection
      await handleSaveToCollection(newCollection.id);
      
      setShowCreateModal(false);
      loadCollections(); // Refresh collections list

    } catch (err) {
      setError('Network error creating collection');
      console.error('Error creating collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSaved = savedCollections.size > 0;

  return (
    <>
      <button
        onClick={() => setShowCollectionModal(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          isSaved 
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        } ${className}`}
        disabled={loading}
      >
        {isSaved ? (
          <BookmarkCheck size={16} />
        ) : (
          <Bookmark size={16} />
        )}
        {isSaved ? 'Saved' : 'Save Job'}
      </button>

      {/* Collection Selection Modal */}
      {showCollectionModal && (
        <CollectionSelectionModal
          collections={collections}
          jobTitle={jobTitle}
          loading={loading}
          error={error}
          onSave={handleSaveToCollection}
          onCreateNew={() => {
            setShowCollectionModal(false);
            setShowCreateModal(true);
          }}
          onClose={() => {
            setShowCollectionModal(false);
            setError(null);
          }}
        />
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          jobTitle={jobTitle}
          loading={loading}
          error={error}
          onCreate={handleCreateAndSave}
          onClose={() => {
            setShowCreateModal(false);
            setError(null);
          }}
        />
      )}
    </>
  );
}

// Collection Selection Modal
interface CollectionSelectionModalProps {
  collections: SavedResultCollection[];
  jobTitle: string;
  loading: boolean;
  error: string | null;
  onSave: (collectionId: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

function CollectionSelectionModal({
  collections,
  jobTitle,
  loading,
  error,
  onSave,
  onCreateNew,
  onClose
}: CollectionSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Save Job</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">No collections found</p>
              <button
                onClick={onCreateNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Your First Collection
              </button>
            </div>
          ) : (
            collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => onSave(collection.id)}
                disabled={loading}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: collection.colorTheme }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{collection.name}</div>
                    <div className="text-sm text-gray-600">
                      {collection.totalJobs} jobs
                      {collection.description && ` • ${collection.description.substring(0, 50)}...`}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Plus size={16} />
            New Collection
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Collection Modal
interface CreateCollectionModalProps {
  jobTitle: string;
  loading: boolean;
  error: string | null;
  onCreate: (data: CreateCollectionRequest) => void;
  onClose: () => void;
}

function CreateCollectionModal({ jobTitle, loading, error, onCreate, onClose }: CreateCollectionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    colorTheme: '#3b82f6',
    isPublic: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onCreate({
      name: formData.name,
      description: formData.description || undefined,
      tags: tags.length > 0 ? tags : undefined,
      colorTheme: formData.colorTheme,
      isPublic: formData.isPublic
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Collection</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a new collection and save: <span className="font-medium">{jobTitle.substring(0, 50)}...</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Frontend Jobs 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="remote, senior"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.colorTheme}
                onChange={(e) => setFormData(prev => ({ ...prev, colorTheme: e.target.value }))}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this collection public
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
