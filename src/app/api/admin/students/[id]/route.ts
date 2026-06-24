import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { studentQueries, riskScoreQueries, activityQueries, interventionQueries, consentQueries } from '@/lib/db/queries';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const student = await studentQueries.findWithAccounts(params.id);
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const studentRaw: any = await studentQueries.findById(params.id);
  const [riskScores, activities, interventions, consent] = await Promise.all([
    riskScoreQueries.history(params.id, 10),
    activityQueries.findRecent(params.id, 14),
    interventionQueries.findByStudent(params.id),
    consentQueries.findByStudent(params.id),
  ]);

  const timeline = Array.isArray(studentRaw?.riskTimeline) ? studentRaw.riskTimeline : [];

  return NextResponse.json({
    data: {
      ...student,
      riskTier: studentRaw?.riskTier ?? 'green',
      compositeScore: studentRaw?.compositeScore ?? 0,
      timeline,
      riskScores,
      activities,
      interventions,
      consent,
    },
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const student = await studentQueries.update(params.id, body);
  return NextResponse.json({ data: student });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await studentQueries.delete(params.id);
  return NextResponse.json({ success: true });
}
