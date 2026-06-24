import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const CONSENT_SCOPES = ['LMS_DATA', 'CHAT_LOGS', 'ACADEMIC_RECORDS', 'ANALYTICS'] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/db/client');
  const student = await prisma.student.findUnique({
    where: { id: session.user.id },
    include: { consentSettings: true },
  });
  if (!student) {
    const defaults = CONSENT_SCOPES.map((scope) => ({
      scope,
      granted: false,
      grantedAt: null,
    }));
    return NextResponse.json({ data: defaults, consentCompleted: false });
  }

  const settings = CONSENT_SCOPES.map((scope) => {
    const existing = student.consentSettings.find((s: any) => s.scope === scope);
    return {
      scope,
      granted: existing?.granted ?? false,
      grantedAt: existing?.grantedAt ?? null,
    };
  });

  return NextResponse.json({
    data: settings,
    consentCompleted: student.consentCompleted,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Invalid payload: settings must be an array' },
        { status: 400 }
      );
    }

    const { prisma } = await import('@/lib/db/client');

    const existing = await prisma.student.findUnique({
      where: { id: session.user.id },
    });
    if (!existing) {
      await prisma.student.create({
        data: {
          id: session.user.id,
          email: session.user.email ?? `${session.user.id}@mock.edu`,
          name: session.user.name ?? 'Student',
        },
      });
    }

    for (const s of settings) {
      if (!CONSENT_SCOPES.includes(s.scope)) continue;
      await prisma.consentSetting.upsert({
        where: {
          studentId_scope: { studentId: session.user.id, scope: s.scope },
        },
        update: {
          granted: Boolean(s.granted),
          grantedAt: s.granted ? new Date() : undefined,
          revokedAt: s.granted ? undefined : new Date(),
        },
        create: {
          studentId: session.user.id,
          scope: s.scope,
          granted: Boolean(s.granted),
          grantedAt: s.granted ? new Date() : undefined,
        },
      });
    }

    await prisma.student.update({
      where: { id: session.user.id },
      data: { consentCompleted: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
