import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'counselor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { studentId, type, title, note } = body;

    if (!studentId || !type || !title) {
      return NextResponse.json(
        { error: 'studentId, type, and title are required' },
        { status: 400 }
      );
    }

    const { interventionQueries } = await import('@/lib/db/queries');
    const intervention = await interventionQueries.create({
      student: { connect: { id: studentId } },
      type,
      status: 'ACTIVE',
      title,
      note: note ?? null,
      assignedTo: session.user.email ?? 'counselor',
    });

    const { recordAuditLog } = await import('@/lib/privacy/audit');
    await recordAuditLog(
      studentId,
      'intervention_created',
      `Counselor created ${type} intervention: ${title}`
    );

    return NextResponse.json({ data: intervention }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'counselor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    const { interventionQueries } = await import('@/lib/db/queries');

    if (studentId) {
      const interventions = await interventionQueries.findByStudent(studentId);
      return NextResponse.json({ data: interventions });
    }

    const interventions = await interventionQueries.findActive(50);
    return NextResponse.json({ data: interventions });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
