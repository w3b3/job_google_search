import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow access to auth pages and health check
    if (req.nextUrl.pathname.startsWith('/auth/') || 
        req.nextUrl.pathname === '/api/health' ||
        req.nextUrl.pathname === '/api/auth/') {
      return NextResponse.next();
    }
    
    // Redirect unauthenticated users to sign in
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/api/auth/signin', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth/') || 
            req.nextUrl.pathname === '/api/health' ||
            req.nextUrl.pathname === '/api/auth/') {
          return true;
        }
        
        // Require token for all other protected pages
        return !!token;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js)
     * - api/health (health check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
