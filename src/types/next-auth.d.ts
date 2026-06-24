import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      lms?: string;
      role?: string | null;
    };
  }

  interface User {
    lms?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    lms?: string;
    accessToken?: string;
    role?: string | null;
  }
}
