'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';

interface ErrorLogRow {
  id: string;
  level: string;
  message: string;
  stack: string | null;
  route: string | null;
  duration: number | null;
  userId: string | null;
  createdAt: string;
}

export default function AdminMonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<ErrorLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ErrorLogRow | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/logs?limit=100');
      if (res.ok) {
        const d = await res.json();
        setLogs(d.data ?? []);
        setTotal(d.total ?? 0);
      } else {
        setError(`HTTP ${res.status}`);
      }
    } catch {
      setError('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchLogs();
    }
  }, [status, session, fetchLogs]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-6 animate-fade-in">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-12 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-8">
        <header className="flex items-start justify-between animate-fade-in">
          <div className="space-y-2">
            <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
              Admin Monitoring
            </p>
            <h1 className="font-display text-heading font-bold">Error Logs</h1>
            <p className="font-mono text-caption text-ink-400 italic">
              {total} error{total !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="font-mono text-caption text-ink-400 hover:text-ink transition-colors"
          >
            Refresh
          </button>
        </header>

        {error && (
          <div className="bg-accent/10 border-brutal-sm border-accent rounded-brutal-sm p-4">
            <p className="font-mono text-body-sm text-accent">{error}</p>
          </div>
        )}

        <section className="border-brutal border-ink rounded-brutal overflow-hidden animate-fade-in-up">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-body-sm text-ink-400 italic">No errors recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-caption">
                <thead>
                  <tr className="border-b border-ink bg-ink-50">
                    <th className="text-left p-3 font-semibold">Level</th>
                    <th className="text-left p-3 font-semibold">Message</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">Route</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">Duration</th>
                    <th className="text-left p-3 font-semibold hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(selected?.id === log.id ? null : log)}
                      className="border-b border-ink-100 hover:bg-ink-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-brutal-sm font-semibold ${
                            log.level === 'error'
                              ? 'bg-accent/20 text-accent'
                              : log.level === 'warn'
                                ? 'bg-ink-200 text-ink-600'
                                : 'bg-chrome/20 text-chrome'
                          }`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px] sm:max-w-[300px] truncate font-sans">
                        {log.message}
                      </td>
                      <td className="p-3 text-ink-400 hidden sm:table-cell">{log.route ?? '-'}</td>
                      <td className="p-3 text-ink-400 hidden md:table-cell">
                        {log.duration != null ? `${log.duration}ms` : '-'}
                      </td>
                      <td className="p-3 text-ink-400 whitespace-nowrap hidden lg:table-cell">
                        {new Date(log.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="border-brutal-sm border-ink rounded-brutal-sm p-5 space-y-3 animate-fade-in">
            <h2 className="font-display text-subheading font-semibold">Error Details</h2>
            <div className="space-y-2">
              <div>
                <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                  Message
                </p>
                <p className="font-sans text-body-sm mt-0.5">{selected.message}</p>
              </div>
              {selected.route && (
                <div>
                  <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                    Route
                  </p>
                  <p className="font-mono text-body-sm mt-0.5 text-chrome">{selected.route}</p>
                </div>
              )}
              {selected.duration != null && (
                <div>
                  <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                    Duration
                  </p>
                  <p className="font-mono text-body-sm mt-0.5">{selected.duration}ms</p>
                </div>
              )}
              {selected.stack && (
                <div>
                  <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                    Stack Trace
                  </p>
                  <pre className="mt-1 bg-ink-50 border-brutal-sm border-ink rounded-brutal-sm p-3 font-mono text-caption overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selected.stack}
                  </pre>
                </div>
              )}
              <div>
                <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                  Timestamp
                </p>
                <p className="font-mono text-body-sm mt-0.5">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
