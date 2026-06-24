'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import { Heatmap } from '@/components/admin/Heatmap';
import { TrendChart } from '@/components/admin/TrendChart';
import { MetricsPanel } from '@/components/admin/MetricsPanel';
import type { AnalyticsReport } from '@/lib/admin/types';

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const d = await res.json();
        setReport(d.data);
      } else {
        setError(`Failed (${res.status})`);
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchReport();
    }
  }, [status, session, fetchReport]);

  const handleDownloadCSV = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/analytics/csv');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  }, []);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-24 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-10">
        <header className="flex flex-col xs:flex-row items-start justify-between gap-4 animate-fade-in">
          <div className="space-y-2">
            <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
              Admin Analytics
            </p>
            <h1 className="font-display text-heading font-bold">Institutional Insights</h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={fetchReport}
              className="font-mono text-caption text-ink-400 hover:text-ink transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={downloading || !report}
              className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
            >
              {downloading ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-accent/10 border-brutal-sm border-accent rounded-brutal-sm p-4 animate-fade-in">
            <p className="font-mono text-body-sm text-accent">{error}</p>
          </div>
        )}

        {report && (
          <div className="space-y-10 animate-fade-in-up">
            <section className="border-brutal border-ink rounded-brutal p-6 space-y-6">
              <Heatmap data={report.heatmap} />
            </section>

            <section className="border-brutal border-ink rounded-brutal p-6 space-y-6">
              <TrendChart data={report.trend} />
            </section>

            <section className="border-brutal border-ink rounded-brutal p-6 space-y-6">
              <MetricsPanel data={report.effectiveness} />
            </section>

            <section className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-2">
              <p className="font-mono text-caption text-ink-400">
                Report generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
              <p className="font-mono text-caption text-ink-400">
                {report.heatmap.length} data points &middot; {report.trend.length} trend weeks
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
