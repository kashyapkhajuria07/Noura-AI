import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getErrorLogs } from '@/lib/logging/logger';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    (session.user.role !== 'admin' && session.user.role !== 'counselor')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  try {
    const { logs, total } = await getErrorLogs(limit, offset);
    return NextResponse.json({ data: logs, total });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { level, message, stack, context, route } = body;

  try {
    const { prisma } = await import('@/lib/db/client');
    const { Prisma } = await import('@/generated/prisma/client');
    await prisma.errorLog.create({
      data: {
        level: level ?? 'error',
        message: message ?? 'Unknown error',
        stack: stack ?? null,
        context: (context as any) ?? Prisma.DbNull,
        route: route ?? null,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
