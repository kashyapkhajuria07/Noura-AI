import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/db/client');

  const student = await prisma.student.findUnique({ where: { id: session.user.id } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  if (student.deletedAt) {
    return NextResponse.json({ error: 'Account already deleted' }, { status: 400 });
  }

  const anonymizedEmail = `deleted-${student.id}@burnout.app`;

  const { Prisma } = await import('@/generated/prisma/client');

  await prisma.student.update({
    where: { id: session.user.id },
    data: {
      email: anonymizedEmail,
      name: '[Deleted Account]',
      encryptedData: null,
      riskTier: null,
      compositeScore: null,
      riskTimeline: Prisma.DbNull,
      consentCompleted: false,
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Account has been anonymized and deactivated.',
  });
}
