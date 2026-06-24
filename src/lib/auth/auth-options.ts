import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getEnv } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  secret: getEnv().NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/auth/login' },
  providers: [
    ...(getEnv().GOOGLE_CLIENT_ID && getEnv().GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: getEnv().GOOGLE_CLIENT_ID!,
            clientSecret: getEnv().GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(getEnv().MOCK_LMS_ENABLED
      ? [
          CredentialsProvider({
            id: 'mock-lms',
            name: 'Mock LMS',
            credentials: {
              email: { label: 'Email', type: 'email', placeholder: 'student@example.edu' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) return null;
              if (credentials.password.length < 3) return null;
              return {
                id: `mock-${Buffer.from(credentials.email).toString('base64')}`,
                email: credentials.email,
                name: credentials.email
                  .split('@')[0]
                  .replace(/[^a-zA-Z0-9]/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
                image: null,
                lms: 'mock' as const,
              };
            },
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'counselor',
      name: 'Counselor',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'counselor@example.edu' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const env = getEnv();
        if (!credentials?.email || !credentials?.password) return null;
        if (
          credentials.email === env.COUNSELOR_EMAIL &&
          credentials.password === env.COUNSELOR_PASSWORD
        ) {
          return {
            id: 'counselor-1',
            email: credentials.email,
            name: 'Counselor',
            image: null,
            role: 'counselor' as const,
          };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: 'admin',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@example.edu' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const env = getEnv();
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.email === env.ADMIN_EMAIL && credentials.password === env.ADMIN_PASSWORD) {
          return {
            id: 'admin-1',
            email: credentials.email,
            name: 'Admin',
            image: null,
            role: 'admin' as const,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) token.accessToken = account.access_token;
      if (user) {
        token.id = user.id;
        token.lms = (user as any).lms ?? null;
        token.role = (user as any).role ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      (session.user as any).lms = token.lms;
      (session.user as any).role = token.role;
      return session;
    },
  },
};
