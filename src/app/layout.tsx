import type { Metadata } from 'next';
import SessionProvider from '@/components/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Search Analyzer - Automated Job Discovery',
  description: 'Find your next opportunity with AI-powered job search across multiple ATS platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
