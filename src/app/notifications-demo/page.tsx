'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import { useNotifications } from '@/lib/notifications/context';
import { getSocket } from '@/lib/notifications/client';
import type { NotificationType } from '@/lib/notifications/types';

const SAMPLE_MESSAGES: Record<string, { title: string; message: string }> = {
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

export default function NotificationsDemoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { current, visible, dismiss, expand, history } = useNotifications();
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('connect', () => setWsStatus('connected'));
      socket.on('disconnect', () => setWsStatus('disconnected'));
      setWsStatus(socket.connected ? 'connected' : 'disconnected');
    }
  }, []);

  if (status === 'loading') {
    return (
      <main className="brutal-container min-h-screen py-16">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-pulse h-24 w-full rounded-brutal-sm mb-4" />
        ))}
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-10">
        <header className="animate-fade-in">
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            Notifications Demo
          </p>
          <h1 className="font-display text-heading font-bold">Ambient Notification System</h1>
        </header>

        <section className="animate-fade-in-up space-y-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-caption text-ink-400">WebSocket:</span>
            <span className={`font-mono text-caption px-2 py-0.5 rounded-brutal-sm ${
              wsStatus === 'connected' ? 'bg-chrome text-paper' :
              wsStatus === 'disconnected' ? 'bg-accent text-paper' :
              'bg-ink-200 text-ink'
            }`}>
              {wsStatus}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(['risk_red', 'risk_amber', 'intervention'] as const).map((type) => {
              const info = SAMPLE_MESSAGES[type];
              return (
                <div key={type} className="p-5 border-brutal border-ink rounded-brutal shadow-brutal-sm space-y-3">
                  <p className="font-mono text-caption uppercase tracking-wider text-ink-400">
                    {type.replace(/_/g, ' ')}
                  </p>
                  <p className="font-display text-body-sm font-semibold">{info.title}</p>
                  <p className="font-mono text-caption text-ink-500">{info.message}</p>
                </div>
              );
            })}
          </div>

          <div className="border-brutal border-ink rounded-brutal-sm p-5 space-y-4">
            <p className="font-display text-body-sm font-semibold">Trigger Notification</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  try {
                    fetch('/api/notifications/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'risk_red',
                        studentId: session?.user?.id ?? 'demo',
                      }),
                    });
                  } catch {}
                }}
                className="px-4 py-2 bg-accent text-paper font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Trigger Red Alert
              </button>
              <button
                onClick={() => {
                  try {
                    fetch('/api/notifications/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'risk_amber',
                        studentId: session?.user?.id ?? 'demo',
                      }),
                    });
                  } catch {}
                }}
                className="px-4 py-2 bg-ink-300 text-ink font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Trigger Amber Alert
              </button>
              <button
                onClick={() => {
                  try {
                    fetch('/api/notifications/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'intervention',
                        studentId: session?.user?.id ?? 'demo',
                      }),
                    });
                  } catch {}
                }}
                className="px-4 py-2 bg-chrome text-paper font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Trigger Intervention
              </button>
              <button
                onClick={expand}
                className="px-4 py-2 bg-paper text-ink font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Expand Current Toast
              </button>
            </div>
          </div>

          <div className="border-brutal border-ink rounded-brutal-sm p-5 space-y-3">
            <p className="font-display text-body-sm font-semibold">
              Notification History ({history.length})
            </p>
            {history.length === 0 ? (
              <p className="font-mono text-caption text-ink-400">No notifications yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((n) => (
                  <div key={n.id} className="flex items-start justify-between p-3 border-b border-ink-200">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-caption uppercase tracking-wider text-ink-400">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      <p className="font-display text-caption font-semibold truncate">{n.title}</p>
                    </div>
                    <span className="font-mono text-caption text-ink-400 flex-shrink-0 ml-2">
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {current && visible && (
          <div className="animate-fade-in border-brutal border-ink rounded-brutal p-5 bg-ink-50 space-y-2">
            <p className="font-mono text-caption uppercase tracking-wider text-ink-400">Current Toast</p>
            <p className="font-display text-body-sm font-semibold">{current.title}</p>
            <p className="font-mono text-caption text-ink-500">{current.message}</p>
            <p className="font-mono text-caption text-ink-400">ID: {current.id}</p>
          </div>
        )}
      </main>
    </>
  );
}
