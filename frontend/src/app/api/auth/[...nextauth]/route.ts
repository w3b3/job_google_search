import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByGoogleId, createUserFromGoogle, updateUserLastLogin } from '@/lib/database/auth-operations';

const handler = NextAuth({
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
          let dbUser = await getUserByGoogleId(profile.sub);
          
          if (!dbUser) {
            // Create new user from Google profile
            dbUser = await createUserFromGoogle({
              googleId: profile.sub,
              email: user.email!,
              name: user.name!,
              avatarUrl: user.image,
            });
          } else {
            // Update last login for existing user
            await updateUserLastLogin(dbUser.id);
          }
          
          // Attach user info to the user object for session callback
          user.id = dbUser.id;
          user.accountType = dbUser.accountType;
          user.searchesUsed = dbUser.searchesUsedThisMonth;
          user.searchLimit = dbUser.searchLimit;
          
          return true;
        } catch (error) {
          console.error('Sign in error:', error);
          return false;
        }
      }
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
});

export { handler as GET, handler as POST };
