import type { Metadata } from 'next';
import SessionProvider from '@/components/SessionProvider';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Search Analyzer - Automate Your Job Discovery with AI',
  description: 'Revolutionize your job search with AI-powered automation. Find opportunities across 10+ platforms, track progress in real-time, and organize results intelligently. Save 10+ hours per week with 88% time reduction.',
  keywords: ['job search automation', 'AI job finder', 'career platform', 'job scraping', 'automated job discovery', 'ATS platforms', 'job tracking', 'career automation'],
  authors: [{ name: 'Job Search Analyzer Team' }],
  creator: 'Job Search Analyzer',
  publisher: 'Job Search Analyzer',
  category: 'Technology',
  
  openGraph: {
    title: 'Job Search Analyzer - AI-Powered Job Discovery Platform',
    description: 'Save 10+ hours per week with automated job searching across multiple platforms. 88% time reduction, 200+ jobs daily, real-time tracking.',
    url: 'https://job-search-analyzer.com',
    siteName: 'Job Search Analyzer',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Job Search Analyzer - Automate Your Job Search with AI',
    }],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Job Search Analyzer - AI-Powered Job Discovery',
    description: 'Automate your job search with 88% time reduction. Find 200+ jobs daily across 10+ platforms.',
    images: ['/og-image.jpg'],
    creator: '@jobsearchanalyzer',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  verification: {
    google: 'your-google-verification-code',
  },
  
  alternates: {
    canonical: 'https://job-search-analyzer.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-white dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-300 ease-in-out antialiased">
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
