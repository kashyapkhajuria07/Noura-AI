import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/db/client');

  const logs = await prisma.auditLog.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    data: logs.map((l: any) => ({
      id: l.id,
      action: l.action,
      actorRole: l.actorRole,
      details: l.details,
      createdAt: l.createdAt,
    })),
  });
}
