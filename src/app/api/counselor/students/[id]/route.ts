import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { anonymizeStudentId, getEscalationTier } from '@/lib/counselor/escalation';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'counselor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/lib/db/client');
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        consentSettings: true,
        activities: { orderBy: { timestamp: 'desc' }, take: 20 },
        riskScores: { orderBy: { computedAt: 'desc' }, take: 10 },
        interventions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const hasConsent = (student as any).consentSettings?.some((c: any) => c.granted) ?? false;
    const escalationTier = getEscalationTier(
      ((student as any).riskTier ?? 'green') as any,
      hasConsent
    );

    const response: any = {
      idHash: anonymizeStudentId(student.id),
      riskTier: (student as any).riskTier ?? 'green',
      compositeScore: (student as any).compositeScore ?? 0,
      timeline: Array.isArray((student as any).riskTimeline) ? (student as any).riskTimeline : [],
      triggeredRules: [],
      escalationTier,
      hasConsent,
      recentActivity: (student as any).activities ?? [],
      riskScores: (student as any).riskScores ?? [],
      interventions: (student as any).interventions ?? [],
    };

    if (hasConsent) {
      response.email = student.email;
      response.name = student.name;
    }

    const timeline = response.timeline;
    if (timeline.length > 0) {
      response.triggeredRules = timeline[timeline.length - 1]?.triggered_rules ?? [];
    }

    const { recordAuditLog } = await import('@/lib/privacy/audit');
    await recordAuditLog(params.id, 'detail_view', 'Counselor viewed student risk profile');

    return NextResponse.json({ data: response });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
