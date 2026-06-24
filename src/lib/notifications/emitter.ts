import type { Notification, NotificationType } from './types';

const WS_SERVER = process.env.WS_SERVER_URL || 'http://localhost:3001';

export async function emitNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<void> {
  try {
    const res = await fetch(`${WS_SERVER}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    if (!res.ok) {
      console.warn(`[Emitter] Failed to emit notification: ${res.status}`);
    }
  } catch (e) {
    console.warn('[Emitter] WebSocket server unavailable:', e);
  }
}

export async function emitRiskNotification(
  studentId: string,
  tier: string,
  score: number,
  triggeredRules: string[]
): Promise<void> {
  if (tier !== 'amber' && tier !== 'red') return;

  const type: NotificationType = tier === 'red' ? 'risk_red' : 'risk_amber';

  const ruleSummary = triggeredRules.length > 0
    ? triggeredRules.map((r) => r.replace(/_/g, ' ')).join(', ')
    : 'general risk indicators';

  const messages: Record<string, { title: string; message: string }> = {
    amber: {
      title: 'Early risk pattern detected',
      message: `We've noticed some changes in your study patterns (${ruleSummary}). Need help organizing your schedule?`,
    },
    red: {
      title: 'Concerning activity detected',
      message: `Your recent activity shows signs of distress (${ruleSummary}). Support resources are available.`,
    },
  };

  const info = tier === 'red' ? messages.red : messages.amber;

  await emitNotification({
    studentId,
    type,
    title: info.title,
    message: info.message,
    actionable: true,
    metadata: { score, triggeredRules, tier },
  });
}
