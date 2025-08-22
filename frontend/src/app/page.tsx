import SearchConfiguration from '@/components/SearchConfiguration';
import RecentSearches from '@/components/RecentSearches';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Configure Job Search
              </h2>
              <p className="mt-2 text-gray-600">
                Set up your automated job search across multiple ATS platforms. 
                The system will scrape job descriptions and match them against your keywords.
              </p>
            </div>
            
            <SearchConfiguration />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Searches */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Searches
            </h3>
            <RecentSearches />
          </div>
          
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Platform Coverage
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ashby Jobs</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Greenhouse</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lever</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Workday</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Available</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Custom Sites</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Configurable</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Tip: Start with fewer platforms and expand based on results
              </p>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600">Real-time progress tracking</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600">Keyword-based filtering</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600">CSV/JSON export</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600">Background processing</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600">Docker containerized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
