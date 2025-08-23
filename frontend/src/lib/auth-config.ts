import GoogleProvider from 'next-auth/providers/google';
import { getUserByGoogleId, createUserFromGoogle, updateUserLastLogin } from '@/lib/database/auth-operations';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.sub) {
        try {
          console.log('🔍 Attempting sign in for Google ID:', profile.sub);
          let dbUser = await getUserByGoogleId(profile.sub);
          
          if (!dbUser) {
            console.log('👤 User not found, creating new user');
            // Create new user from Google profile
            dbUser = await createUserFromGoogle({
              googleId: profile.sub,
              email: user.email!,
              name: user.name!,
              avatarUrl: user.image,
            });
            console.log('✅ New user created:', dbUser.id);
          } else {
            console.log('👋 Existing user found:', dbUser.id);
            // Update last login for existing user
            await updateUserLastLogin(dbUser.id);
          }
          
          // Verify dbUser has required properties
          if (!dbUser || !dbUser.id) {
            console.error('❌ Database user is missing required properties:', dbUser);
            return false;
          }
          
          // Attach user info to the user object for session callback
          user.id = dbUser.id;
          user.accountType = dbUser.accountType;
          user.searchesUsed = dbUser.searchesUsedThisMonth;
          user.searchLimit = dbUser.searchLimit;
          
          console.log('✅ Sign in successful for user:', user.id);
          return true;
        } catch (error) {
          console.error('❌ Sign in error:', error);
          return false;
        }
      }
      console.log('❌ Invalid provider or missing profile');
      return false;
    },
    async session({ session, token }) {
      // Add user info to session
      if (token.sub) {
        session.user.id = token.sub;
        session.user.accountType = token.accountType as string;
        session.user.searchesUsed = token.searchesUsed as number;
        session.user.searchLimit = token.searchLimit as number;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Store user info in JWT token
      if (user) {
        token.accountType = user.accountType;
        token.searchesUsed = user.searchesUsed;
        token.searchLimit = user.searchLimit;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
