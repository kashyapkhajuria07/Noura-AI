import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { studentQueries } from '@/lib/db/queries';
import type { RiskTimelineEntry } from '@/lib/risk/composite';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }

  const student: any = await studentQueries.findById(studentId);
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const timeline = (Array.isArray(student.riskTimeline) ? student.riskTimeline : []) as RiskTimelineEntry[];

  return NextResponse.json({
    data: {
      studentId,
      riskTier: student.riskTier ?? 'green',
      compositeScore: student.compositeScore ?? 0,
      timeline,
    },
  });
}
