import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { emitNotification } from '@/lib/notifications/emitter';

const MESSAGE_MAP: Record<string, { title: string; message: string }> = {
  risk_red: {
    title: 'Concerning activity detected',
    message: 'Your recent activity shows signs of distress. Support resources are available.',
  },
  risk_amber: {
    title: 'Early risk pattern detected',
    message: "You've been working late—need help organizing your schedule?",
  },
  intervention: {
    title: 'New intervention available',
    message: 'A counseling referral has been created. Check your interventions.',
  },
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { type, studentId } = body as { type: string; studentId?: string };

  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 });
  }

  const info = MESSAGE_MAP[type];
  if (!info) {
    return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 });
  }

  await emitNotification({
    studentId: studentId ?? session.user?.id ?? 'anonymous',
    type: type as any,
    title: info.title,
    message: info.message,
    actionable: type === 'risk_red' || type === 'risk_amber',
    metadata: { triggeredBy: session.user?.id },
  });

  return NextResponse.json({ success: true });
}
