import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { assessStudentDb, assessAllStudentsDb } from '@/lib/risk/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const level = searchParams.get('level');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

  if (studentId) {
    const assessment = await assessStudentDb(studentId);
    const history = await prisma.riskScore.findMany({
      where: { studentId },
      orderBy: { computedAt: 'desc' },
      take: 30,
    });
    return NextResponse.json({ assessment, history });
  }

  const where = level ? { level: level as any } : {};
  const latestScores = await prisma.riskScore.findMany({
    where,
    orderBy: { computedAt: 'desc' },
    distinct: ['studentId'],
    take: limit,
    include: { student: true },
  });

  return NextResponse.json({ data: latestScores, total: latestScores.length });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await assessAllStudentsDb(50);
  return NextResponse.json(result);
}
