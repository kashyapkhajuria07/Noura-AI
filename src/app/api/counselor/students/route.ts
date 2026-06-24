import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { anonymizeStudentId, getEscalationActions } from '@/lib/counselor/escalation';
import type { AnonymizedStudent } from '@/lib/counselor/types';
import type { CompositeTier } from '@/lib/risk/composite';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'counselor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/lib/db/client');
    const students = await prisma.student.findMany({
      where: {
        riskTier: { in: ['amber', 'red'] },
      } as any,
      include: {
        consentSettings: true,
        activities: { orderBy: { timestamp: 'desc' }, take: 1 },
        interventions: { take: 1 },
      },
    });

    const anonymized: AnonymizedStudent[] = students.map((s: any) => {
      const hasConsent = s.consentSettings?.some((c: any) => c.granted) ?? false;
      const timeline = Array.isArray(s.riskTimeline) ? s.riskTimeline : [];
      const triggeredRules =
        timeline.length > 0 ? ((timeline[timeline.length - 1] as any)?.triggered_rules ?? []) : [];

      return {
        idHash: anonymizeStudentId(s.id),
        fullId: s.id,
        riskTier: (s.riskTier ?? 'amber') as CompositeTier,
        compositeScore: s.compositeScore ?? 0,
        triggeredRules,
        timeline,
        lastActivity: s.activities?.[0]?.timestamp ?? null,
        hasConsent,
        interventionCount: s.interventions?.length ?? 0,
      };
    });

    return NextResponse.json({ data: anonymized, total: anonymized.length });
  } catch {
    return NextResponse.json({ data: [], total: 0 });
  }
}
