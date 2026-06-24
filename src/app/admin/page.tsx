'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import type { CompositeTier, RiskTimelineEntry } from '@/lib/risk/composite';

interface StudentRow {
  id: string;
  email: string;
  name: string | null;
  riskTier: CompositeTier;
  compositeScore: number;
  createdAt: string;
}

interface StudentDetail {
  id: string;
  email: string;
  name: string | null;
  riskTier: CompositeTier;
  compositeScore: number;
  timeline: RiskTimelineEntry[];
  riskScores: {
    level: string;
    score: number;
    compositeScore?: number;
    tier?: string;
    computedAt: string;
  }[];
  activities: { type: string; title: string; timestamp: string }[];
  interventions: { type: string; status: string; title: string }[];
  consent: { scope: string; granted: boolean }[];
}

function tierColor(tier: CompositeTier): string {
  switch (tier) {
    case 'red':
      return 'bg-accent text-paper';
    case 'amber':
      return 'bg-ink-300 text-ink';
    default:
      return 'bg-chrome/50 text-ink-600';
  }
}

function tierDot(tier: CompositeTier): string {
  switch (tier) {
    case 'red':
      return 'bg-accent';
    case 'amber':
      return 'bg-ink-300';
    default:
      return 'bg-chrome';
  }
}

function TimelineChart({ timeline, tier }: { timeline: RiskTimelineEntry[]; tier: CompositeTier }) {
  const bgHue = tier === 'red' ? 'accent' : tier === 'amber' ? 'ink-300' : 'chrome';
  const svgWidth = 400;
  const svgHeight = 180;
  const pad = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = svgWidth - pad.left - pad.right;
  const chartH = svgHeight - pad.top - pad.bottom;

  const points = useMemo(() => {
    if (timeline.length === 0) return [];
    const maxScore = Math.max(...timeline.map((e) => e.score), 0.01);
    return timeline.map((e, i) => {
      const x = pad.left + (i / Math.max(timeline.length - 1, 1)) * chartW;
      const y = pad.top + chartH - (e.score / maxScore) * chartH;
      return { x, y, ...e };
    });
  }, [timeline, chartW, chartH]);

  const yTicks = useMemo(() => {
    const max = Math.max(...timeline.map((e) => e.score), 0.01);
    return [0, 0.25, 0.5, 0.75, 1]
      .filter((v) => v <= max)
      .map((v) => ({
        y: pad.top + chartH - (v / max) * chartH,
        label: v.toFixed(2),
      }));
  }, [timeline, chartH]);

  const xTicks = useMemo(() => {
    if (timeline.length <= 1) return [];
    const step = Math.max(1, Math.floor(timeline.length / 5));
    return timeline
      .filter((_, i) => i % step === 0 || i === timeline.length - 1)
      .map((e, i, arr) => {
        const idx = timeline.indexOf(e);
        return {
          x: pad.left + (idx / Math.max(timeline.length - 1, 1)) * chartW,
          label: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        };
      });
  }, [timeline, chartW]);

  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] font-mono text-caption text-ink-400">
        No timeline data yet
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[400px] h-auto">
      {yTicks.map((t) => (
        <g key={t.label}>
          <line
            x1={pad.left}
            y1={t.y}
            x2={svgWidth - pad.right}
            y2={t.y}
            stroke="currentColor"
            className="text-ink-200"
            strokeWidth={1}
          />
          <text
            x={pad.left - 6}
            y={t.y + 4}
            textAnchor="end"
            className="fill-ink-400"
            fontSize={10}
            fontFamily="Departure Mono, monospace"
          >
            {t.label}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text
          key={t.label}
          x={t.x}
          y={svgHeight - 6}
          textAnchor="middle"
          className="fill-ink-400"
          fontSize={9}
          fontFamily="Departure Mono, monospace"
        >
          {t.label}
        </text>
      ))}
      <text
        x={pad.left}
        y={10}
        className="fill-ink-400 italic"
        fontSize={9}
        fontFamily="Departure Mono, monospace"
      >
        Score
      </text>
      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          className="stroke-ink-300"
          strokeWidth={2}
        />
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            className={`fill-${bgHue} stroke-paper`}
            strokeWidth={2}
          />
          <title>{`${p.date.slice(0, 10)}: ${p.score} (${p.tier})`}</title>
        </g>
      ))}
    </svg>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selected, setSelected] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<CompositeTier | 'all'>('all');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((d) => setStudents(d.data))
      .finally(() => setLoading(false));
  }, [status]);

  async function selectStudent(id: string) {
    const res = await fetch(`/api/admin/students/${id}`);
    const d = await res.json();
    setSelected(d.data);
  }

  async function createStudent() {
    if (!newEmail) return;
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, name: newName }),
    });
    if (res.ok) {
      const d = await res.json();
      setStudents((prev) => [{ ...d.data, riskTier: 'green', compositeScore: 0 }, ...prev]);
      setNewEmail('');
      setNewName('');
    }
  }

  async function deleteStudent(id: string) {
    const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  }

  async function assessSelected() {
    if (!selected) return;
    await fetch(`/api/risk/composite?studentId=${selected.id}`);
    const res = await fetch(`/api/admin/students/${selected.id}`);
    const d = await res.json();
    setSelected(d.data);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selected.id
          ? { ...s, riskTier: d.data.riskTier, compositeScore: d.data.compositeScore }
          : s
      )
    );
  }

  const filtered =
    filterTier === 'all' ? students : students.filter((s) => s.riskTier === filterTier);

  const counts = useMemo(() => {
    const c = { green: 0, amber: 0, red: 0 };
    for (const s of students) c[s.riskTier]++;
    return c;
  }, [students]);

  if (status === 'loading' || loading) {
    return (
      <main className="brutal-container min-h-screen py-16">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-pulse h-12 w-full rounded-brutal-sm mb-4" />
        ))}
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-12">
        <header className="animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
                Admin Panel
              </p>
              <h1 className="font-display text-heading font-bold">Student Management</h1>
              <p className="font-mono text-caption text-ink-400 mt-2">
                Composite risk scores: 60% rule engine + 40% ML sentiment analysis
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="/admin/monitoring"
                className="font-mono text-caption text-chrome hover:text-chrome-dark transition-colors border-b border-chrome"
              >
                Monitoring &rarr;
              </a>
              <a
                href="/admin/analytics"
                className="font-mono text-caption text-chrome hover:text-chrome-dark transition-colors border-b border-chrome"
              >
                Analytics &rarr;
              </a>
            </div>
          </div>
        </header>

        <section className="animate-fade-in-up space-y-4">
          <h2 className="font-display text-subheading font-semibold">Create Student</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-mono text-caption text-ink-500 italic mb-1">
                Email *
              </label>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="student@example.edu"
                className="w-full px-3 py-2 border-brutal border-ink rounded-brutal-sm font-sans text-body-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block font-mono text-caption text-ink-500 italic mb-1">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 border-brutal border-ink rounded-brutal-sm font-sans text-body-sm"
              />
            </div>
            <button
              onClick={createStudent}
              className="px-5 py-2 bg-ink text-paper font-display font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              Create
            </button>
          </div>
        </section>

        <section className="animate-fade-in-up space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-subheading font-semibold">
              Students ({students.length})
            </h2>
            <div className="flex gap-2">
              {(['all', 'green', 'amber', 'red'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className={`font-mono text-caption px-3 py-1.5 border-brutal border-ink rounded-brutal-sm transition-all ${
                    filterTier === t
                      ? 'bg-ink text-paper shadow-brutal-sm'
                      : 'bg-paper text-ink hover:shadow-brutal-sm'
                  }`}
                >
                  {t === 'all' ? 'All' : `${t} (${counts[t]})`}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic">
                    Tier
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic">
                    Name
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic">
                    Email
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic">
                    Score
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic hidden sm:table-cell">
                    Created
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-right py-3 italic">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink-200 hover:bg-ink-100/50 transition-colors cursor-pointer"
                    onClick={() => selectStudent(s.id)}
                  >
                    <td className="py-3 pr-4">
                      <div className={`w-3 h-3 rounded-full ${tierDot(s.riskTier)}`} />
                    </td>
                    <td className="py-3 pr-4 font-display text-body-sm font-medium">
                      {s.name ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-body-sm text-ink-500">{s.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${tierColor(s.riskTier)}`}
                      >
                        {s.compositeScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-caption text-ink-400 hidden sm:table-cell">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStudent(s.id);
                        }}
                        className="font-mono text-caption text-accent hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center font-mono text-caption text-ink-400"
                    >
                      No students match this tier
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="animate-fade-in-up space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-subheading font-semibold">
                  {selected.name ?? selected.email}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${tierDot(selected.riskTier)}`} />
                  <span
                    className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${tierColor(selected.riskTier)}`}
                  >
                    {selected.riskTier} · {selected.compositeScore.toFixed(3)}
                  </span>
                </div>
              </div>
              <button
                onClick={assessSelected}
                className="px-4 py-2 bg-ink text-paper font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Re-assess Now
              </button>
            </div>

            <div className="border-brutal border-ink rounded-brutal-sm p-4 space-y-4">
              <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
                Composite Risk Timeline
              </p>
              <TimelineChart timeline={selected.timeline} tier={selected.riskTier} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border-brutal border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
                  Risk History
                </p>
                {selected.riskScores.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No data</p>
                ) : (
                  selected.riskScores.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                          r.level === 'CRITICAL'
                            ? 'bg-accent text-paper'
                            : r.level === 'HIGH'
                              ? 'bg-accent/80 text-paper'
                              : r.level === 'MEDIUM'
                                ? 'bg-ink-300 text-ink'
                                : 'bg-ink-100 text-ink-600'
                        }`}
                      >
                        {r.level}
                      </span>
                      {r.tier && (
                        <span
                          className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${tierColor(r.tier as CompositeTier)}`}
                        >
                          {r.tier}
                        </span>
                      )}
                      <span className="font-mono text-body-sm">{r.score.toFixed(1)}</span>
                      <span className="font-mono text-caption text-ink-400">
                        {new Date(r.computedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-brutal border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
                  Recent Activity
                </p>
                {selected.activities.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No data</p>
                ) : (
                  selected.activities.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-mono text-caption bg-ink-100 px-1.5 py-0.5 rounded-brutal-sm truncate max-w-[120px]">
                        {a.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-body-sm truncate max-w-[160px]">{a.title}</span>
                      <span className="font-mono text-caption text-ink-400">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-brutal border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
                  Interventions
                </p>
                {selected.interventions.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No data</p>
                ) : (
                  selected.interventions.map((iv, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="font-mono text-caption bg-ink-100 px-1.5 py-0.5 rounded-brutal-sm">
                        {iv.type.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                          iv.status === 'COMPLETED'
                            ? 'bg-chrome text-paper'
                            : iv.status === 'ACTIVE'
                              ? 'bg-ink text-paper'
                              : 'bg-ink-200 text-ink'
                        }`}
                      >
                        {iv.status}
                      </span>
                      <span className="text-body-sm truncate max-w-[120px]">{iv.title}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-brutal border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
                  Consent Settings
                </p>
                {selected.consent.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No data</p>
                ) : (
                  selected.consent.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-mono text-caption">{c.scope.replace(/_/g, ' ')}</span>
                      <span
                        className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                          c.granted ? 'bg-chrome text-paper' : 'bg-accent text-paper'
                        }`}
                      >
                        {c.granted ? 'Granted' : 'Revoked'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
