import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logging/logger';

export async function GET() {
  const session = await getServerSession(authOptions);

  const checks: Record<string, { status: string; error?: string }> = {};

  const dbStart = Date.now();
  try {
    const { prisma } = await import('@/lib/db/client');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (e: any) {
    checks.database = { status: 'error', error: e.message };
    logger.error('Health check failed: database', { error: e.message });
  }
  const dbDuration = Date.now() - dbStart;
  if (dbDuration > 100) {
    logger.warn('Health check: slow database query', { durationMs: dbDuration });
  }

  const mlStart = Date.now();
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const mlRes = await fetch(`${mlUrl}/health`, { signal: AbortSignal.timeout(3000) });
    checks.mlService = { status: mlRes.ok ? 'ok' : 'error' };
  } catch {
    checks.mlService = { status: 'unavailable' };
  }
  const mlDuration = Date.now() - mlStart;

  const wsStart = Date.now();
  try {
    const wsUrl = process.env.WS_SERVER_URL || 'http://localhost:3001';
    const wsRes = await fetch(`${wsUrl}/health`, { signal: AbortSignal.timeout(3000) });
    checks.websocket = { status: wsRes.ok ? 'ok' : 'error' };
  } catch {
    checks.websocket = { status: 'unavailable' };
  }
  const wsDuration = Date.now() - wsStart;

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const degraded = Object.values(checks).some((c) => c.status === 'unavailable');

  logger.info('Health check completed', {
    database: checks.database.status,
    mlService: checks.mlService.status,
    websocket: checks.websocket.status,
    durations: { db: dbDuration, ml: mlDuration, ws: wsDuration },
  });

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : degraded ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      durations: { database: dbDuration, mlService: mlDuration, websocket: wsDuration },
    },
    { status: allOk ? 200 : degraded ? 200 : 503 }
  );
}
