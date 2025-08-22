'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List, Archive, Share2, Trash2, Edit } from 'lucide-react';
import type { 
  SavedResultCollection, 
  CollectionFilters, 
  CollectionListResponse,
  ApiResponse 
} from '@/lib/types';

interface CollectionsDashboardProps {
  userId?: string;
}

export default function CollectionsDashboard({ userId }: CollectionsDashboardProps) {
  const [collections, setCollections] = useState<SavedResultCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<CollectionFilters>({
    isArchived: false,
    sortBy: 'updated_at',
    sortOrder: 'desc',
    limit: 20
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Load collections
  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived.toString());
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/collections?${params.toString()}`);
      const result: ApiResponse<CollectionListResponse> = await response.json();

      if (result.success && result.data) {
        setCollections(result.data.collections);
        setTotalCount(result.data.totalCount);
      } else {
        setError(result.error || 'Failed to load collections');
      }
    } catch (err) {
      setError('Network error loading collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search handler with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery, offset: 0 }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load collections when filters change
  useEffect(() => {
    loadCollections();
  }, [filters, userId]);

  // Create new collection
  const handleCreateCollection = async (collectionData: {
    name: string;
    description?: string;
    tags?: string[];
    colorTheme?: string;
    isPublic?: boolean;
  }) => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId })
        },
        body: JSON.stringify(collectionData)
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        loadCollections(); // Refresh the list
      } else {
        setError(result.error || 'Failed to create collection');
      }
    } catch (err) {
      setError('Network error creating collection');
      console.error('Error creating collection:', err);
    }
  };

  // Delete collection
  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? All saved jobs will be removed.')) {
      return;
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        loadCollections(); // Refresh the list
      } else {
        setError(result.error || 'Failed to delete collection');
      }
    } catch (err) {
      setError('Network error deleting collection');
      console.error('Error deleting collection:', err);
    }
  };

  // Toggle archive status
  const handleToggleArchive = async (collection: SavedResultCollection) => {
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !collection.isArchived })
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        loadCollections(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update collection');
      }
    } catch (err) {
      setError('Network error updating collection');
      console.error('Error updating collection:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Collections</h1>
          <p className="text-gray-600">
            Manage your saved job collections ({totalCount} total)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Collection
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List size={20} />
            </button>
          </div>

          {/* Archive Filter */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, isArchived: !prev.isArchived, offset: 0 }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              filters.isArchived 
                ? 'bg-gray-600 text-white border-gray-600' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Archive size={16} />
            {filters.isArchived ? 'Show Active' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Collections Grid/List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Archive size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections found</h3>
          <p className="text-gray-600 mb-4">
            {filters.isArchived 
              ? "You don't have any archived collections." 
              : "Create your first collection to start saving jobs."}
          </p>
          {!filters.isArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Collection
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              viewMode={viewMode}
              onDelete={() => handleDeleteCollection(collection.id)}
              onToggleArchive={() => handleToggleArchive(collection)}
            />
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCollection}
        />
      )}
    </div>
  );
}

// Collection Card Component
interface CollectionCardProps {
  collection: SavedResultCollection;
  viewMode: 'grid' | 'list';
  onDelete: () => void;
  onToggleArchive: () => void;
}

function CollectionCard({ collection, viewMode, onDelete, onToggleArchive }: CollectionCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: collection.colorTheme }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{collection.name}</h3>
              <p className="text-sm text-gray-600 truncate">{collection.description}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>{collection.totalJobs} jobs</span>
              <span>Updated {formatDate(collection.updatedAt)}</span>
              {collection.isPublic && <Share2 size={16} className="text-blue-600" />}
              {collection.isArchived && <Archive size={16} className="text-gray-400" />}
            </div>
          </div>
          <CollectionActions 
            collection={collection}
            onDelete={onDelete}
            onToggleArchive={onToggleArchive}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-6 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: collection.colorTheme }}
        />
        <CollectionActions 
          collection={collection}
          onDelete={onDelete}
          onToggleArchive={onToggleArchive}
        />
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">{collection.name}</h3>
        {collection.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{collection.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{collection.totalJobs} jobs</span>
        <span>{formatDate(collection.updatedAt)}</span>
      </div>

      {collection.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {collection.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {collection.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{collection.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {collection.isPublic && (
          <div className="flex items-center gap-1 text-blue-600">
            <Share2 size={16} />
            <span className="text-xs">Public</span>
          </div>
        )}
        {collection.isArchived && (
          <div className="flex items-center gap-1 text-gray-400">
            <Archive size={16} />
            <span className="text-xs">Archived</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Collection Actions Component
interface CollectionActionsProps {
  collection: SavedResultCollection;
  onDelete: () => void;
  onToggleArchive: () => void;
}

function CollectionActions({ collection, onDelete, onToggleArchive }: CollectionActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
          <button
            onClick={() => {
              // TODO: Navigate to collection edit page
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => {
              onToggleArchive();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Archive size={16} />
            {collection.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Create Collection Modal Component
interface CreateCollectionModalProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    tags?: string[];
    colorTheme?: string;
    isPublic?: boolean;
  }) => void;
}

function CreateCollectionModal({ onClose, onCreate }: CreateCollectionModalProps) {
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
        <h2 className="text-xl font-bold mb-4">Create New Collection</h2>
        
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
              placeholder="e.g., Fintech Jobs 2024"
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
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., fintech, remote, senior (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Theme
            </label>
            <input
              type="color"
              value={formData.colorTheme}
              onChange={(e) => setFormData(prev => ({ ...prev, colorTheme: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
