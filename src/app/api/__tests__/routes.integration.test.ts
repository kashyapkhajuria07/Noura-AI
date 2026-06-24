import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetServerSession = vi.fn();

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

const mockPrisma = {
  chatMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  student: { findUnique: vi.fn(), create: vi.fn() },
  consentSetting: { findMany: vi.fn(), upsert: vi.fn() },
};

vi.mock('@/lib/db/client', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/chat/llm', () => ({
  chatCompletion: vi.fn().mockResolvedValue({ content: 'Hi', quickReplies: ['A', 'B'] }),
  getQuickReplies: vi.fn().mockReturnValue(['A', 'B']),
}));

vi.mock('@/lib/auth/auth-options', () => ({ authOptions: {} }));

vi.mock('@/lib/env', () => ({
  getEnv: () => ({ MOCK_LMS_ENABLED: true }),
}));

describe('API Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chat API (POST /api/chat)', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { POST } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello', history: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const resp: any = await POST(req);
      expect(resp.status).toBe(401);
    });

    it('returns 400 for empty message', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 's1', email: 't@t.com' } });
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1' });
      const { POST } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: '', history: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const resp: any = await POST(req);
      expect(resp.status).toBe(400);
    });

    it('returns 200 for valid message', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 's1', email: 't@t.com' } });
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.chatMessage.create
        .mockResolvedValueOnce({ id: 'm1', content: 'hello', role: 'user', createdAt: '' })
        .mockResolvedValueOnce({ id: 'm2', content: 'Hi!', role: 'assistant', createdAt: '', metadata: {} });
      const { POST } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello', history: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const resp: any = await POST(req);
      expect(resp.status).toBe(200);
    });

    it('creates student stub when not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'mock-u', email: 'new@t.com', name: 'N' } });
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.student.create.mockResolvedValue({ id: 'new-id' });
      mockPrisma.chatMessage.create
        .mockResolvedValueOnce({ id: 'm3', content: 'hi', role: 'user', createdAt: '' })
        .mockResolvedValueOnce({ id: 'm4', content: 'Hey!', role: 'assistant', createdAt: '', metadata: {} });
      const { POST } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hi', history: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const resp: any = await POST(req);
      expect(resp.status).toBe(200);
      expect(mockPrisma.student.create).toHaveBeenCalled();
    });

    it('looks up student by email when ID not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'mock-u', email: 'existing@t.com' } });
      mockPrisma.student.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'db-id' });
      mockPrisma.chatMessage.create
        .mockResolvedValueOnce({ id: 'm5', content: 'hi', role: 'user', createdAt: '' })
        .mockResolvedValueOnce({ id: 'm6', content: 'Hi!', role: 'assistant', createdAt: '', metadata: {} });
      const { POST } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hi', history: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const resp: any = await POST(req);
      expect(resp.status).toBe(200);
    });
  });

  describe('Chat API (GET /api/chat)', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { GET } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat?limit=10');
      const resp: any = await GET(req);
      expect(resp.status).toBe(401);
    });

    it('returns chat history for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 's1', email: 't@t.com' } });
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.chatMessage.findMany.mockResolvedValue([
        { id: 'm1', content: 'Hi', role: 'user', createdAt: '' },
        { id: 'm2', content: 'Hello!', role: 'assistant', createdAt: '' },
      ]);
      const { GET } = await import('../chat/route');
      const req = new Request('http://localhost:3000/api/chat?limit=10');
      const resp: any = await GET(req);
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('Consent API (GET /api/privacy/consent)', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { GET } = await import('../privacy/consent/route');
      const req = new Request('http://localhost:3000/api/privacy/consent');
      const resp: any = await GET(req);
      expect(resp.status).toBe(401);
    });

    it('returns defaults when student not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'mock-u', email: 't@t.com' } });
      mockPrisma.student.findUnique.mockResolvedValue(null);
      const { GET } = await import('../privacy/consent/route');
      const req = new Request('http://localhost:3000/api/privacy/consent');
      const resp: any = await GET(req);
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.consentCompleted).toBe(false);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
