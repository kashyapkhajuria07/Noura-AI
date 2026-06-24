'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import type { AnonymizedStudent, CounselorIntervention } from '@/lib/counselor/types';
import type { RiskTimelineEntry } from '@/lib/risk/composite';

interface StudentDetail extends AnonymizedStudent {
  escalationTier: string;
  recentActivity: { type: string; title: string; timestamp: string }[];
  riskScores: { level: string; score: number; computedAt: string }[];
  interventions: CounselorIntervention[];
  name?: string;
  email?: string;
}

function TimelineSparkline({ timeline }: { timeline: RiskTimelineEntry[] }) {
  if (timeline.length === 0)
    return <span className="font-mono text-caption text-ink-400">No data</span>;

  const w = 120;
  const h = 32;
  const maxScore = Math.max(...timeline.map((e) => e.score), 0.01);
  const pts = timeline
    .map((e, i) => {
      const x = (i / Math.max(timeline.length - 1, 1)) * w;
      const y = h - (e.score / maxScore) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={1.5} />
    </svg>
  );
}

function StudentCard({
  student,
  selected,
  onSelect,
}: {
  student: AnonymizedStudent;
  selected: boolean;
  onSelect: () => void;
}) {
  const tierBorder = student.riskTier === 'red' ? 'border-accent' : 'border-ink-300';
  const tierBadge = student.riskTier === 'red' ? 'bg-accent text-paper' : 'bg-ink-300 text-ink';

  const lastAct = student.lastActivity
    ? new Date(student.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'None';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-paper border-brutal-sm ${tierBorder} rounded-brutal-sm p-4 space-y-3 transition-all hover:shadow-brutal-sm ${
        selected ? 'shadow-brutal-sm ring-2 ring-ink' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-caption text-ink-400">{student.idHash}</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${tierBadge}`}>
            {student.riskTier}
          </span>
          {student.hasConsent && (
            <span className="text-[10px]" title="Consent given">
              {'\u2713'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-display text-display-sm font-bold">
            {Math.round(student.compositeScore * 100)}
          </p>
          <p className="font-mono text-caption text-ink-400">Risk score</p>
        </div>
        <TimelineSparkline timeline={student.timeline} />
      </div>

      <div className="flex items-center justify-between text-caption">
        <span className="font-mono text-ink-400">Last activity: {lastAct}</span>
        <span className="font-mono text-ink-400">{student.interventionCount} interventions</span>
      </div>

      {student.triggeredRules.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {student.triggeredRules.map((r) => (
            <span
              key={r}
              className="font-mono text-[10px] bg-ink-100 text-ink-600 px-1.5 py-0.5 rounded-brutal-sm"
            >
              {r.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function SupportMessageModal({
  student,
  onSend,
  onClose,
  sending,
}: {
  student: StudentDetail;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
}) {
  const message = useMemo(() => {
    const { generateSupportMessage } = require('@/lib/counselor/escalation');
    return generateSupportMessage({
      riskTier: student.riskTier,
      triggeredRules: student.triggeredRules,
      timeline: student.timeline,
    });
  }, [student]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-paper border-brutal border-ink rounded-brutal shadow-brutal p-6 w-full max-w-lg mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-subheading font-semibold">Supportive Message</h3>
          <button
            onClick={onClose}
            className="font-mono text-caption text-ink-400 hover:text-accent"
          >
            close
          </button>
        </div>
        <p className="font-mono text-caption text-ink-400">
          To: {student.email ?? '(anonymous)'} &middot; Student {student.idHash}
        </p>
        <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 bg-ink-50 max-h-60 overflow-y-auto">
          <pre className="font-mono text-caption text-ink whitespace-pre-wrap">{message}</pre>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            className="font-mono text-caption text-ink-400 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all disabled:opacity-40"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CounselorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AnonymizedStudent[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<StudentDetail | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<'all' | 'amber' | 'red'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'counselor') {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'counselor') return;
    fetchStudents();
  }, [status, session]);

  async function fetchStudents() {
    try {
      setLoading(true);
      const res = await fetch('/api/counselor/students');
      if (res.ok) {
        const d = await res.json();
        setStudents(d.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function selectStudent(fullId: string) {
    try {
      const res = await fetch(`/api/counselor/students/${fullId}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedDetail(d.data);
      }
    } catch {
      /* ignore */
    }
  }

  async function handleSendMessage() {
    if (!selectedDetail) return;
    setSending(true);
    try {
      const res = await fetch('/api/counselor/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedDetail.fullId,
          studentEmail: selectedDetail.email,
          riskTier: selectedDetail.riskTier,
          triggeredRules: selectedDetail.triggeredRules,
          timeline: selectedDetail.timeline,
        }),
      });
      if (res.ok) {
        setToastMsg('Message sent successfully');
        setShowMessageModal(false);
        selectStudent(selectedDetail.fullId);
      } else {
        setToastMsg('Failed to send message');
      }
    } catch {
      setToastMsg('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  const filtered =
    filterTier === 'all' ? students : students.filter((s) => s.riskTier === filterTier);

  const counts = useMemo(() => {
    const c: Record<string, number> = { amber: 0, red: 0 };
    for (const s of students) c[s.riskTier] = (c[s.riskTier] ?? 0) + 1;
    return c;
  }, [students]);

  if (status === 'loading' || loading) {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-24 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'counselor') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-10">
        <header className="animate-fade-in">
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            Counselor Dashboard
          </p>
          <h1 className="font-display text-heading font-bold">At-Risk Students</h1>
          <p className="font-mono text-caption text-ink-400 mt-2">
            Showing anonymized profiles &middot; PII visible only with consent
          </p>
        </header>

        <div className="flex items-center gap-4 border-b-2 border-ink pb-2 animate-fade-in-up">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'amber' as const, label: `Amber (${counts.amber})` },
            { id: 'red' as const, label: `Red (${counts.red})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTier(t.id)}
              className={`font-display text-body-sm font-semibold pb-1 border-b-2 transition-colors ${
                filterTier === t.id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-400 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={fetchStudents}
            className="ml-auto font-mono text-caption text-ink-400 hover:text-ink transition-colors"
          >
            Refresh
          </button>
        </div>

        {students.length === 0 && !loading && (
          <div className="border-brutal-sm border-dashed border-ink-200 rounded-brutal-sm p-12 text-center animate-fade-in">
            <p className="font-display text-subheading font-semibold text-ink-400">
              No at-risk students
            </p>
            <p className="font-mono text-caption text-ink-300 mt-2">
              All students are currently in the green tier.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard
              key={s.fullId}
              student={s}
              selected={selectedDetail?.fullId === s.fullId}
              onSelect={() => selectStudent(s.fullId)}
            />
          ))}
        </div>

        {selectedDetail && (
          <section className="animate-fade-in-up space-y-6 border-t-2 border-ink pt-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="font-display text-subheading font-semibold">
                  Student {selectedDetail.idHash}
                </h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-caption px-2 py-0.5 rounded-brutal-sm ${
                      selectedDetail.riskTier === 'red'
                        ? 'bg-accent text-paper'
                        : 'bg-ink-300 text-ink'
                    }`}
                  >
                    {selectedDetail.riskTier} · {Math.round(selectedDetail.compositeScore * 100)}
                  </span>
                  {selectedDetail.hasConsent && selectedDetail.email && (
                    <span className="font-mono text-caption text-ink-500">
                      {selectedDetail.email}
                    </span>
                  )}
                  {selectedDetail.hasConsent && selectedDetail.name && (
                    <span className="font-mono text-caption text-ink-500">
                      {selectedDetail.name}
                    </span>
                  )}
                  {!selectedDetail.hasConsent && (
                    <span className="font-mono text-caption text-ink-400 italic">
                      Consent not granted
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowMessageModal(true)}
                className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Send Support Message
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider text-ink-400 italic">
                  Risk Timeline
                </p>
                {selectedDetail.timeline.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No data</p>
                ) : (
                  <div className="space-y-1">
                    {selectedDetail.timeline.slice(-10).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-caption">
                        <span className="font-mono text-ink-400">
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                        <span
                          className={`font-mono px-1 rounded-brutal-sm ${
                            e.tier === 'red'
                              ? 'bg-accent/20 text-accent'
                              : e.tier === 'amber'
                                ? 'bg-ink-200 text-ink'
                                : 'bg-chrome/20 text-chrome'
                          }`}
                        >
                          {e.tier}
                        </span>
                        <span className="font-mono text-ink-600">{e.score.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider text-ink-400 italic">
                  Triggered Rules
                </p>
                {selectedDetail.triggeredRules.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No rules triggered</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDetail.triggeredRules.map((r) => (
                      <div key={r} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="font-mono text-caption text-ink">
                          {r.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider text-ink-400 italic">
                  Recent Activity
                </p>
                {selectedDetail.recentActivity.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No activity</p>
                ) : (
                  <div className="space-y-1">
                    {selectedDetail.recentActivity.slice(0, 5).map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-caption">
                        <span className="font-mono bg-ink-100 px-1 rounded-brutal-sm text-ink-600 truncate max-w-[80px]">
                          {a.type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-ink-500 truncate max-w-[120px]">
                          {a.title}
                        </span>
                        <span className="font-mono text-ink-400">
                          {new Date(a.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-3">
              <p className="font-mono text-caption uppercase tracking-wider text-ink-400 italic">
                Intervention History
              </p>
              {selectedDetail.interventions.length === 0 ? (
                <p className="font-mono text-caption text-ink-400">No interventions logged</p>
              ) : (
                <div className="space-y-2">
                  {selectedDetail.interventions.map((iv: any) => (
                    <div key={iv.id} className="flex items-center justify-between gap-4">
                      <span className="font-mono text-caption bg-ink-100 px-1.5 py-0.5 rounded-brutal-sm">
                        {iv.type?.replace(/_/g, ' ') ?? 'OTHER'}
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
                      <span className="font-mono text-caption text-ink-600 flex-1 truncate">
                        {iv.title}
                      </span>
                      <span className="font-mono text-caption text-ink-400">
                        {new Date(iv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {showMessageModal && selectedDetail && (
        <SupportMessageModal
          student={selectedDetail}
          onSend={handleSendMessage}
          onClose={() => setShowMessageModal(false)}
          sending={sending}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="font-mono text-body-sm">{toastMsg}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="font-mono text-caption text-paper/60 hover:text-paper"
            >
              close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
