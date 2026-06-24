import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { generateSupportMessage } from '@/lib/counselor/escalation';
import type { CompositeTier } from '@/lib/risk/composite';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'counselor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { studentId, studentEmail, riskTier, triggeredRules, timeline } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const message = generateSupportMessage({
      riskTier: (riskTier ?? 'amber') as CompositeTier,
      triggeredRules: triggeredRules ?? [],
      timeline: timeline ?? [],
    });

    const { interventionQueries } = await import('@/lib/db/queries');
    const intervention = await interventionQueries.create({
      student: { connect: { id: studentId } },
      type: 'EMAIL',
      status: 'ACTIVE',
      title: `Supportive outreach (${riskTier ?? 'amber'} tier)`,
      note: `Message sent via counselor dashboard.\n\n---\n${message}`,
      assignedTo: session.user.email ?? 'counselor',
    });

    const { recordAuditLog } = await import('@/lib/privacy/audit');
    await recordAuditLog(studentId, 'message_sent', 'Counselor sent support message');

    return NextResponse.json({
      success: true,
      message,
      interventionId: intervention.id,
      sentTo: studentEmail ?? '(no email on file)',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
