import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Search Analyzer',
  description: 'Automated job search across multiple ATS platforms with keyword matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🔍</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      Job Search Analyzer
                    </h1>
                    <p className="text-sm text-gray-500">
                      Automated job discovery across ATS platforms
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/api/health"
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    System Status
                  </a>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-gray-500">
                <p>Job Search Analyzer - Built with Next.js 15+ and containerized for scale</p>
                <p className="mt-1">
                  Powered by Google Custom Search API and Puppeteer web scraping
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
