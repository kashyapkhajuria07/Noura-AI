import { describe, it, expect, vi, beforeAll } from 'vitest';

// Set env vars before importing auth-options by directly setting process.env
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    MOCK_LMS_ENABLED: true,
    COUNSELOR_EMAIL: 'counselor@burnout.app',
    COUNSELOR_PASSWORD: 'counselor-dev',
    ADMIN_EMAIL: 'admin@burnout.app',
    ADMIN_PASSWORD: 'admin-dev',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    REDIS_URL: '',
    REDIS_TTL_SECONDS: 900,
  }),
}));

async function getProviders() {
  const { authOptions } = await import('../auth-options');
  return authOptions.providers;
}

describe('Auth Providers', () => {
  describe('Mock LMS Provider', () => {
    it('accepts valid credentials (email + password >= 3 chars)', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'mock-lms');
      expect(p).toBeDefined();
      const user = await (p as any).authorize!({ email: 'student@test.edu', password: 'validpass' });
      expect(user).not.toBeNull();
      expect(user!.email).toBe('student@test.edu');
      expect(user!.id).toContain('mock-');
      expect((user as any).lms).toBe('mock');
    });

    it('rejects missing email', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'mock-lms');
      expect(p).toBeDefined();
      const user = await (p as any).authorize({ email: '', password: 'validpass' });
      expect(user).toBeNull();
    });

    it('rejects short password (< 3 chars)', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'mock-lms');
      const user = await (p as any).authorize({ email: 'student@test.edu', password: 'ab' });
      expect(user).toBeNull();
    });

    it('rejects missing password', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'mock-lms');
      const user = await (p as any).authorize({ email: 'student@test.edu', password: '' });
      expect(user).toBeNull();
    });

    it('generates consistent user id for same email', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'mock-lms');
      const user1 = await (p as any).authorize({ email: 'repeat@test.edu', password: 'test123' });
      const user2 = await (p as any).authorize({ email: 'repeat@test.edu', password: 'test123' });
      expect(user1!.id).toBe(user2!.id);
    });

    it('generates different ids for different emails', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'mock-lms');
      const user1 = await (p as any).authorize({ email: 'alice@test.edu', password: 'test123' });
      const user2 = await (p as any).authorize({ email: 'bob@test.edu', password: 'test123' });
      expect(user1!.id).not.toBe(user2!.id);
    });
  });

  describe('Counselor Provider', () => {
    it('accepts correct counselor credentials', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'counselor');
      expect(p).toBeDefined();
      const user = await (p as any).authorize({ email: 'counselor@burnout.app', password: 'counselor-dev' });
      expect(user).not.toBeNull();
      expect(user!.email).toBe('counselor@burnout.app');
      expect(user!.id).toBe('counselor-1');
      expect((user as any).role).toBe('counselor');
    });

    it('rejects wrong counselor password', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'counselor');
      const user = await (p as any).authorize({ email: 'counselor@burnout.app', password: 'wrong' });
      expect(user).toBeNull();
    });

    it('rejects wrong counselor email', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'counselor');
      const user = await (p as any).authorize({ email: 'hacker@burnout.app', password: 'counselor-dev' });
      expect(user).toBeNull();
    });
  });

  describe('Admin Provider', () => {
    it('accepts correct admin credentials', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'admin');
      expect(p).toBeDefined();
      const user = await (p as any).authorize({ email: 'admin@burnout.app', password: 'admin-dev' });
      expect(user).not.toBeNull();
      expect(user!.email).toBe('admin@burnout.app');
      expect(user!.id).toBe('admin-1');
      expect((user as any).role).toBe('admin');
    });

    it('rejects wrong admin password', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'admin');
      const user = await (p as any).authorize({ email: 'admin@burnout.app', password: 'wrong' });
      expect(user).toBeNull();
    });

    it('rejects wrong admin email', async () => {
      const providers = await getProviders();
      const p = providers.find((p: any) => p.id === 'admin');
      const user = await (p as any).authorize({ email: 'imposter@burnout.app', password: 'admin-dev' });
      expect(user).toBeNull();
    });
  });

  describe('JWT and Session Callbacks', () => {
    it('jwt callback stores user fields in token', async () => {
      const { authOptions } = await import('../auth-options');
      const jwt = authOptions.callbacks!.jwt!;
      const token = await jwt(
        {} as any,
        {} as any,
        { user: { id: 'mock-user', email: 'test@test.edu', name: 'Test', lms: 'mock', role: null } } as any,
      );
      expect(token).toBeDefined();
      expect((token as any).lms).toBe('mock');
    });

    it('session callback copies token fields to session', async () => {
      const { authOptions } = await import('../auth-options');
      const sessionCb = authOptions.callbacks!.session!;
      const session = await sessionCb(
        { user: {} } as any,
        { id: 'test-id', lms: 'mock', role: null } as any,
      );
      expect(session.user.id).toBe('test-id');
      expect((session.user as any).lms).toBe('mock');
    });
  });
});
