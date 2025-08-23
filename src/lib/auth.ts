import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Create auth instance for server-side usage
export const auth = NextAuth(authOptions).auth;
