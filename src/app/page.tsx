'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);
  
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen surface-themed">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  if (session) {
    return null; // Will redirect
  }
  
  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Job Search Analyzer",
    "description": "AI-powered job search automation platform that helps professionals find opportunities across multiple ATS platforms with 88% time reduction",
    "url": "https://job-search-analyzer.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": "2024-12-31",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1247",
      "bestRating": "5",
      "worstRating": "1"
    },
    "features": [
      "Automated Job Discovery",
      "Real-Time Progress Tracking", 
      "Intelligent Web Scraping",
      "Smart Job Management"
    ]
  };
  
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen">
      {/* Fixed Header */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700 z-50 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔍</span>
              </div>
              <span className="text-xl font-bold text-themed">Job Search Analyzer</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#features" className="text-secondary-themed hover:text-themed transition-colors">Features</a>
              <a href="#benefits" className="text-secondary-themed hover:text-themed transition-colors">Benefits</a>
              <a href="#pricing" className="text-secondary-themed hover:text-themed transition-colors">Pricing</a>
              <ThemeToggle size="sm" variant="dropdown" />
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-background-dark dark:via-surface-dark dark:to-background-dark theme-transition overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 dark:bg-interactive-primary-dark/20 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 dark:bg-purple-400/20 rounded-full opacity-30 animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-green-200 dark:bg-green-400/20 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-40 w-24 h-24 bg-orange-200 dark:bg-orange-400/20 rounded-full opacity-20 animate-bounce" style={{animationDelay: '3s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Enhanced Logo */}
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-primary-600 to-purple-600 rounded-3xl flex items-center justify-center mb-8 transform hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white font-bold text-3xl">🚀</span>
            </div>
            
            {/* Enhanced Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-themed mb-6 leading-tight">
              Automate Your Job Search
              <span className="block bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                with AI-Powered Discovery
              </span>
            </h1>
            
            {/* Enhanced Subheadline */}
            <p className="text-xl md:text-2xl text-secondary-themed mb-8 max-w-4xl mx-auto leading-relaxed">
              Find your dream job faster with intelligent automation, real-time tracking, and comprehensive analytics. 
              <span className="font-semibold text-themed">Save 10+ hours per week</span> while accessing 
              <span className="font-semibold text-themed">200+ jobs daily</span> from multiple platforms.
            </p>
            
            {/* Value Propositions */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-green-500">✓</span>
                <span className="text-sm font-medium text-themed">88% Time Reduction</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-green-500">✓</span>
                <span className="text-sm font-medium text-themed">10+ Platforms</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-green-500">✓</span>
                <span className="text-sm font-medium text-themed">Real-time Tracking</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-green-500">✓</span>
                <span className="text-sm font-medium text-themed">Smart Analytics</span>
              </div>
            </div>
            
            {/* Enhanced CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="group bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Start Free with Google</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              
              <a 
                href="#features" 
                className="bg-white/90 dark:bg-slate-800/90 text-themed hover:bg-white dark:hover:bg-slate-800 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 backdrop-blur-sm"
              >
                Watch Demo
              </a>
            </div>
            
            <div className="text-sm text-secondary-themed">
              <span className="font-medium">2 free searches/month</span> • No credit card required • <span className="font-medium">Setup in 30 seconds</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary-600 dark:border-primary-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary-600 dark:bg-primary-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
      {/* Core Features Section */}
      <section id="features" className="bg-white dark:bg-slate-800 py-24 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-themed mb-6">
              Powerful Features That
              <span className="block bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                Transform Job Searching
              </span>
            </h2>
            <p className="text-xl text-secondary-themed max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with intelligent automation 
              to revolutionize how you discover and manage job opportunities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Feature 1: Automated Job Discovery */}
            <div className="group">
              <div className="card-themed border-2 border-transparent group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-all duration-300 h-full">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-themed mb-3">Automated Job Discovery</h3>
                    <p className="text-secondary-themed mb-4 leading-relaxed">
                      Leverage Google Custom Search API and intelligent scraping to find relevant opportunities 
                      across multiple platforms automatically. Our system never sleeps, continuously hunting for your perfect match.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Multi-platform aggregation (10+ ATS systems)
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Intelligent keyword matching and filtering
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Duplicate elimination and smart deduplication
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Location-based targeting and remote job filtering
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Real-Time Progress Tracking */}
            <div className="group">
              <div className="card-themed border-2 border-transparent group-hover:border-green-200 dark:group-hover:border-green-800 transition-all duration-300 h-full">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-themed mb-3">Real-Time Progress Tracking</h3>
                    <p className="text-secondary-themed mb-4 leading-relaxed">
                      Watch your searches progress in real-time with detailed status updates, completion tracking, 
                      and live metrics. Know exactly what's happening at every moment.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Live progress updates with percentage completion
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Platform-by-platform completion status
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Real-time result count and discovery metrics
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Error handling with automatic retry mechanisms
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Intelligent Web Scraping */}
            <div className="group">
              <div className="card-themed border-2 border-transparent group-hover:border-purple-200 dark:group-hover:border-purple-800 transition-all duration-300 h-full">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">🤖</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-themed mb-3">Intelligent Web Scraping</h3>
                    <p className="text-secondary-themed mb-4 leading-relaxed">
                      Powered by Puppeteer automation, extract detailed job information including company data, 
                      requirements, benefits, and salary information with unprecedented accuracy.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Comprehensive data extraction with 95% accuracy
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Company information and culture insights
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Salary ranges and benefits package detection
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Job type classification and remote work indicators
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Smart Job Management */}
            <div className="group">
              <div className="card-themed border-2 border-transparent group-hover:border-orange-200 dark:group-hover:border-orange-800 transition-all duration-300 h-full">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-themed mb-3">Smart Job Management</h3>
                    <p className="text-secondary-themed mb-4 leading-relaxed">
                      Create custom collections, add personal notes, track application status, and prioritize opportunities 
                      with our intelligent organization system designed for serious job seekers.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Custom collection creation and smart categorization
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Personal notes, ratings, and interview tracking
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Application status pipeline management
                      </li>
                      <li className="flex items-center text-sm text-secondary-themed">
                        <span className="text-green-500 mr-2">✓</span>
                        Priority levels and deadline reminders
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Process */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-themed mb-4">How It Works</h3>
              <p className="text-lg text-secondary-themed">
                Three simple steps to transform your job search experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl text-white font-bold">1</span>
                  </div>
                  {/* Connection line */}
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-green-300 transform translate-x-4"></div>
                </div>
                <h4 className="text-xl font-bold text-themed mb-3">Configure & Launch</h4>
                <p className="text-secondary-themed leading-relaxed">
                  Set your job criteria, keywords, salary expectations, and preferred platforms. 
                  Our AI learns your preferences for better matching.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl text-white font-bold">2</span>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-green-300 to-orange-300 transform translate-x-4"></div>
                </div>
                <h4 className="text-xl font-bold text-themed mb-3">AI Processes & Discovers</h4>
                <p className="text-secondary-themed leading-relaxed">
                  Our intelligent system scans job boards, extracts detailed information, 
                  and filters matches based on your criteria in real-time.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-3xl text-white font-bold">3</span>
                </div>
                <h4 className="text-xl font-bold text-themed mb-3">Organize & Apply</h4>
                <p className="text-secondary-themed leading-relaxed">
                  Get curated results with comprehensive analytics, organize opportunities 
                  in collections, and track your application pipeline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="surface-themed py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-themed mb-6">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-secondary-themed max-w-3xl mx-auto">
              Powered by enterprise-grade technology stack for reliability, scalability, and performance
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">⚛️</span>
              </div>
              <div className="text-sm font-semibold text-themed">Next.js 15</div>
              <div className="text-xs text-secondary-themed">React Framework</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎭</span>
              </div>
              <div className="text-sm font-semibold text-themed">Puppeteer</div>
              <div className="text-xs text-secondary-themed">Web Automation</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="text-sm font-semibold text-themed">Redis Queue</div>
              <div className="text-xs text-secondary-themed">Background Processing</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="text-sm font-semibold text-themed">Google API</div>
              <div className="text-xs text-secondary-themed">Search Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="bg-white dark:bg-slate-800 py-24 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-themed mb-6">
              Measurable Results That Matter
            </h2>
            <p className="text-xl text-secondary-themed max-w-3xl mx-auto">
              See the dramatic difference our platform makes in your job search efficiency and success rate
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">88%</div>
              <div className="text-sm font-semibold text-themed">Time Saved</div>
              <div className="text-xs text-secondary-themed">Per search session</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">200+</div>
              <div className="text-sm font-semibold text-themed">Jobs Daily</div>
              <div className="text-xs text-secondary-themed">Discovery rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">10+</div>
              <div className="text-sm font-semibold text-themed">Platforms</div>
              <div className="text-xs text-secondary-themed">Simultaneous coverage</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">95%</div>
              <div className="text-sm font-semibold text-themed">Accuracy</div>
              <div className="text-xs text-secondary-themed">Data extraction</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 overflow-x-auto">
            <h3 className="text-2xl font-bold text-themed mb-8 text-center">Traditional vs. Automated Job Search</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-600">
                    <th className="text-left py-4 px-6 text-themed font-semibold">Metric</th>
                    <th className="text-center py-4 px-6 text-secondary-themed font-medium">Traditional Method</th>
                    <th className="text-center py-4 px-6 text-primary-600 font-semibold">Job Search Analyzer</th>
                    <th className="text-center py-4 px-6 text-green-600 font-bold">Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  <tr>
                    <td className="py-4 px-6 text-themed font-medium">Time per search</td>
                    <td className="py-4 px-6 text-center text-secondary-themed">2-3 hours</td>
                    <td className="py-4 px-6 text-center text-primary-600 font-semibold">15 minutes</td>
                    <td className="py-4 px-6 text-center text-green-600 font-bold">88% faster</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-themed font-medium">Platform coverage</td>
                    <td className="py-4 px-6 text-center text-secondary-themed">1-2 sites</td>
                    <td className="py-4 px-6 text-center text-primary-600 font-semibold">10+ platforms</td>
                    <td className="py-4 px-6 text-center text-green-600 font-bold">500% increase</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-themed font-medium">Jobs discovered daily</td>
                    <td className="py-4 px-6 text-center text-secondary-themed">20-30 jobs</td>
                    <td className="py-4 px-6 text-center text-primary-600 font-semibold">200+ jobs</td>
                    <td className="py-4 px-6 text-center text-green-600 font-bold">700% increase</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-themed font-medium">Organization efficiency</td>
                    <td className="py-4 px-6 text-center text-secondary-themed">Manual tracking</td>
                    <td className="py-4 px-6 text-center text-primary-600 font-semibold">Automated collections</td>
                    <td className="py-4 px-6 text-center text-green-600 font-bold">95% improvement</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      
      {/* Enhanced Pricing Section */}
      <section id="pricing" className="surface-themed py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-themed mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-secondary-themed">
              Start free, upgrade when you need more power. No hidden fees, cancel anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card-themed border-themed transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-themed mb-2">Free</h3>
                <div className="text-5xl font-black text-themed mb-4">$0<span className="text-lg text-secondary-themed">/month</span></div>
                <p className="text-secondary-themed mb-6">Perfect for casual job seekers</p>
                
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">2 searches per month</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">All ATS platforms access</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Smart keyword filtering</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">CSV/JSON export</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Basic job collections</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-200 theme-transition transform hover:scale-105"
                >
                  Get Started Free
                </button>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div className="card-themed border-2 border-primary-500 relative transform hover:scale-105 transition-all duration-300 shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🔥 Most Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-themed mb-2">Pro</h3>
                <div className="text-5xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-4">$29<span className="text-lg text-secondary-themed">/month</span></div>
                <p className="text-secondary-themed mb-6">For serious job hunters</p>
                
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Unlimited searches</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Priority processing queue</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Advanced analytics & insights</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Email notifications & alerts</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Custom ATS site targeting</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Advanced job organization</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 dark:text-green-400 mr-3">✓</span>
                    <span className="text-themed">Application tracking pipeline</span>
                  </li>
                </ul>
                
                <button className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Contact for Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white dark:bg-slate-800 py-24 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-themed mb-6">
              Loved by Job Seekers Worldwide
            </h2>
            <p className="text-xl text-secondary-themed">
              Join thousands of professionals who've transformed their job search experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-themed text-center">
              <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-secondary-themed mb-4 italic">
                "This platform saved me weeks of manual searching. Found my dream job in tech in just 3 days of using it!"
              </p>
              <div className="font-semibold text-themed">Sarah Chen</div>
              <div className="text-sm text-secondary-themed">Software Engineer at Google</div>
            </div>
            
            <div className="card-themed text-center">
              <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-secondary-themed mb-4 italic">
                "The real-time tracking and smart filtering are game-changers. No more missing opportunities!"
              </p>
              <div className="font-semibold text-themed">Michael Rodriguez</div>
              <div className="text-sm text-secondary-themed">Marketing Director at Meta</div>
            </div>
            
            <div className="card-themed text-center">
              <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-secondary-themed mb-4 italic">
                "Finally, a tool that actually works as advertised. The automation is incredible and saves so much time."
              </p>
              <div className="font-semibold text-themed">Jessica Park</div>
              <div className="text-sm text-secondary-themed">Product Manager at Stripe</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 py-24 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who've already automated their way to better careers.
            Start your free account today and discover your next opportunity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Start Free Account</span>
            </button>
          </div>
          
          <div className="text-sm opacity-75">
            ✓ No credit card required ✓ 2 free searches ✓ Setup in 30 seconds
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🔍</span>
                </div>
                <span className="text-xl font-bold text-white">Job Search Analyzer</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Revolutionizing job search with AI-powered automation. 
                Find your next opportunity faster and smarter.
              </p>
              <div className="text-sm text-gray-500">
                © 2024 Job Search Analyzer. All rights reserved.
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
