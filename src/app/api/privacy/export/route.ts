import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/db/client');

  const student = await prisma.student.findUnique({
    where: { id: session.user.id },
    include: {
      consentSettings: true,
      activities: { orderBy: { timestamp: 'desc' }, take: 1000 },
      riskScores: { orderBy: { computedAt: 'desc' }, take: 1000 },
      chatMessages: { orderBy: { createdAt: 'desc' }, take: 1000 },
      interventions: { orderBy: { createdAt: 'desc' }, take: 1000 },
      lmsAccounts: true,
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 1000 },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: student.id,
      email: student.email,
      name: student.name,
      createdAt: student.createdAt,
      consentCompleted: student.consentCompleted,
      riskTier: student.riskTier,
      compositeScore: student.compositeScore,
    },
    consentSettings: student.consentSettings.map((s: any) => ({
      scope: s.scope,
      granted: s.granted,
      grantedAt: s.grantedAt,
      revokedAt: s.revokedAt,
    })),
    activities: student.activities.map((a: any) => ({
      type: a.type,
      title: a.title,
      courseName: a.courseName,
      score: a.score,
      maxScore: a.maxScore,
      timestamp: a.timestamp,
    })),
    riskScores: student.riskScores.map((r: any) => ({
      level: r.level,
      score: r.score,
      compositeScore: r.compositeScore,
      tier: r.tier,
      factors: r.factors,
      computedAt: r.computedAt,
    })),
    chatMessages: student.chatMessages.map((m: any) => ({
      role: m.role,
      content: m.encrypted ? '[encrypted]' : m.content,
      createdAt: m.createdAt,
    })),
    interventions: student.interventions.map((i: any) => ({
      type: i.type,
      status: i.status,
      title: i.title,
      note: i.note,
      assignedTo: i.assignedTo,
      createdAt: i.createdAt,
      completedAt: i.completedAt,
    })),
    lmsAccounts: student.lmsAccounts.map((a: any) => ({
      provider: a.provider,
      enabled: a.enabled,
      createdAt: a.createdAt,
    })),
    auditLogs: student.auditLogs.map((l: any) => ({
      action: l.action,
      actorRole: l.actorRole,
      details: l.details,
      createdAt: l.createdAt,
    })),
  };

  return NextResponse.json({ data: exportData });
}
