'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import { Card } from '@/components/Card';
import { useChat } from '@/components/chat/ChatWrapper';
import type { LMSActivity, LMSAssignment } from '@/lib/lms/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<LMSActivity[]>([]);
  const [assignments, setAssignments] = useState<LMSAssignment[]>([]);
  const { openChat } = useChat();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    if (!session?.user?.role) {
      fetch('/api/privacy/consent')
        .then((r) => r.json())
        .then((d) => {
          if (!d.consentCompleted) router.push('/consent');
        })
        .catch(() => {});
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function fetchData() {
      try {
        setLoading(true);
        const [actRes, asgnRes] = await Promise.all([
          fetch('/api/lms/activities?limit=10'),
          fetch('/api/lms/assignments?limit=10'),
        ]);
        if (!actRes.ok || !asgnRes.ok) throw new Error('Failed to fetch data');
        const actData = await actRes.json();
        const asgnData = await asgnRes.json();
        setActivities(actData.data);
        setAssignments(asgnData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-16 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  const submitted = assignments.filter((a) => a.submitted).length;
  const graded = assignments.filter((a) => a.graded).length;
  const avgScore = assignments
    .filter((a) => a.score != null)
    .reduce((s, a) => s + (a.score ?? 0), 0);
  const avgCount = assignments.filter((a) => a.score != null).length;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-12">
        <header className="flex flex-col xs:flex-row items-start justify-between gap-4 animate-fade-in">
          <div className="space-y-2">
            <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
              Dashboard
            </p>
            <h1 className="font-display text-heading font-bold">
              Welcome back, {session!.user!.name!.split(' ')[0]}
            </h1>
            <p className="text-body-sm text-ink-500">{session?.user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => openChat()}
              className="px-4 py-2 bg-ink text-paper font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              Support Chat
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="font-mono text-caption text-ink-400 hover:text-accent transition-colors border-b border-ink hover:border-accent"
            >
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-accent text-paper p-4 rounded-brutal-sm animate-fade-in">
            <p className="font-mono text-body-sm">{error}</p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
          <Card title="Courses" variant="default">
            <p className="font-display text-display font-bold">8</p>
            <p className="font-mono text-caption text-ink-400">Active this semester</p>
          </Card>
          <Card title="Assignments" variant="default">
            <p className="font-display text-display font-bold">{assignments.length}</p>
            <p className="font-mono text-caption text-ink-400">{submitted} submitted</p>
          </Card>
          <Card title="Graded" variant="default">
            <p className="font-display text-display font-bold">{graded}</p>
            <p className="font-mono text-caption text-ink-400">
              {assignments.length - graded} remaining
            </p>
          </Card>
          <Card title="Avg. Score" variant={avgCount > 0 ? 'accent' : 'default'}>
            <p className="font-display text-display font-bold">
              {avgCount > 0 ? Math.round(avgScore / avgCount) : '—'}
            </p>
            <p className="font-mono text-caption text-paper/70">Across {avgCount} graded</p>
          </Card>
        </section>

        <section className="space-y-6 animate-fade-in-up">
          <h2 className="font-display text-subheading font-semibold">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4">
                    Type
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4">
                    Activity
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 hidden sm:table-cell">
                    Course
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 hidden md:table-cell">
                    Score
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-right py-3">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, i) => (
                  <tr
                    key={act.id}
                    className="border-b border-ink-200 hover:bg-ink-100/50 transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="py-3 pr-4">
                      <span
                        className={`font-mono text-caption px-2 py-0.5 rounded-brutal-sm ${
                          act.type === 'assignment_graded'
                            ? 'bg-chrome text-paper'
                            : act.type === 'assignment_submitted'
                              ? 'bg-ink text-paper'
                              : 'bg-ink-200 text-ink'
                        }`}
                      >
                        {act.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-display text-body-sm font-medium max-w-[200px] truncate">
                      {act.title}
                    </td>
                    <td className="py-3 pr-4 text-body-sm text-ink-500 hidden sm:table-cell max-w-[180px] truncate">
                      {act.courseName}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      {act.score != null ? (
                        <span className="font-mono text-body-sm">
                          {act.score}/{act.maxScore ?? 100}
                        </span>
                      ) : (
                        <span className="font-mono text-caption text-ink-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono text-caption text-ink-500">
                      {new Date(act.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6 animate-fade-in-up">
          <h2 className="font-display text-subheading font-semibold">Upcoming Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-body-sm text-ink-400">No assignments loaded.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a, i) => {
                const due = new Date(a.dueDate);
                const isOverdue = due < new Date();
                const statusColor =
                  a.status === 'graded'
                    ? 'bg-chrome'
                    : a.status === 'submitted'
                      ? 'bg-ink-300'
                      : isOverdue
                        ? 'bg-accent'
                        : 'bg-ink';
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 p-4 bg-paper border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all duration-200"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className={`w-2 h-2 rounded-full ${statusColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-body-sm font-semibold truncate">{a.title}</p>
                      <p className="font-mono text-caption text-ink-400 truncate">{a.courseName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-mono text-caption ${
                          isOverdue && a.status !== 'submitted' && a.status !== 'graded'
                            ? 'text-accent'
                            : 'text-ink-500'
                        }`}
                      >
                        {due.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <span
                        className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                          a.status === 'graded'
                            ? 'bg-chrome/20 text-chrome-dark'
                            : a.status === 'submitted'
                              ? 'bg-ink-100 text-ink-600'
                              : a.status === 'missing' || isOverdue
                                ? 'bg-accent/20 text-accent'
                                : 'bg-ink-100 text-ink-600'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="border-t border-ink pt-8 animate-fade-in">
          <p className="font-mono text-caption text-ink-400">
            Connected via {(session!.user as any).lms ?? 'unknown'} · Auto-refreshes every 15min
          </p>
        </footer>
      </main>
    </>
  );
}
