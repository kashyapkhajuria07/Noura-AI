'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import { RuleEngine } from '@/lib/risk/engine';
import type { RiskAssessment, RuleResult } from '@/lib/risk/types';

interface StudentDemo {
  id: string;
  name: string;
  email: string;
  assessment: RiskAssessment;
}

function generateDemoData(): StudentDemo[] {
  const engine = new RuleEngine();
  const names = [
    'Alex Chen', 'Maya Rodriguez', 'Jordan Smith', 'Taylor Wu',
    'Sam Patel', 'Riley Johnson', 'Casey Kim', 'Jessica Lee',
  ];
  return names.map((name, idx) => {
    const seed = idx * 7;
    const hoursAgo = (n: number) => n * 24 + seed;

    const base = Array.from({ length: 25 }, (_, i) => {
      const d = new Date(Date.now() - hoursAgo(i + 5) * 60 * 60 * 1000);
      d.setHours(14, 0, 0, 0);
      return {
        id: `demo-${idx}-${i}`,
        studentId: `s${idx}`,
        type: 'course_access',
        title: 'Activity',
        description: null,
        courseId: 'c1',
        courseName: 'CS 301',
        score: null,
        maxScore: null,
        url: null,
        metadata: null,
        timestamp: d,
        createdAt: d,
        externalId: null,
      } as any;
    });

    if (idx >= 2 && idx < 5) {
      for (let i = 0; i < 4; i++) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        d.setHours(2, 30, 0, 0);
        base.unshift({
          id: `demo-late-${idx}-${i}`,
          studentId: `s${idx}`,
          type: 'course_access',
          title: 'Late Session',
          description: null,
          courseId: 'c1',
          courseName: 'CS 301',
          score: null,
          maxScore: null,
          url: null,
          metadata: null,
          timestamp: d,
          createdAt: d,
          externalId: null,
        });
      }
    }

    if (idx >= 5) {
      for (let i = 0; i < 6; i++) {
        base.unshift({
          id: `demo-churn-${idx}-${i}`,
          studentId: `s${idx}`,
          type: 'assignment_submitted',
          title: 'Resubmission',
          description: null,
          courseId: 'c2',
          courseName: 'MATH 201',
          score: null,
          maxScore: null,
          url: null,
          metadata: null,
          timestamp: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
          createdAt: new Date(),
          externalId: null,
        });
      }
    }

    if (idx === 7) {
      base.length = 0;
      base.push({
        id: 'demo-old',
        studentId: 's7',
        type: 'course_access',
        title: 'Old Activity',
        description: null,
        courseId: 'c1',
        courseName: 'CS 301',
        score: null,
        maxScore: null,
        url: null,
        metadata: null,
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        externalId: null,
      });
    }

    const assessment = { studentId: `s${idx}`, ...engine.assess(base) };

    return {
      id: `s${idx}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@student.edu`,
      assessment,
    };
  });
}

function levelColor(level: string): string {
  switch (level) {
    case 'CRITICAL': return 'bg-accent text-paper';
    case 'HIGH': return 'bg-accent/80 text-paper';
    case 'MEDIUM': return 'bg-ink-300 text-ink';
    default: return 'bg-ink-100 text-ink-600';
  }
}

function levelDot(level: string): string {
  switch (level) {
    case 'CRITICAL': return 'bg-accent';
    case 'HIGH': return 'bg-accent';
    case 'MEDIUM': return 'bg-ink-300';
    default: return 'bg-ink-200';
  }
}

function RuleModal({
  student,
  onClose,
}: {
  student: StudentDemo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 animate-fade-in">
      <div
        className="w-full max-w-lg bg-paper border-brutal border-ink rounded-brutal shadow-brutal-hover p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-caption text-ink-400">Risk Assessment</p>
            <h2 className="font-display text-heading font-bold">{student.name}</h2>
            <p className="font-mono text-caption text-ink-400">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-caption text-ink-400 hover:text-accent border-b border-ink hover:border-accent"
          >
            Close
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 border-brutal border-ink rounded-brutal-sm">
          <div className={`w-3 h-3 rounded-full ${levelDot(student.assessment.level)}`} />
          <span className={`font-mono text-caption px-2 py-0.5 rounded-brutal-sm ${levelColor(student.assessment.level)}`}>
            {student.assessment.level}
          </span>
          <span className="font-mono text-body-sm text-ink-500">
            Score: {student.assessment.overallScore}/100
          </span>
        </div>

        <div className="space-y-3">
          <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
            Triggered Rules
          </p>
          {student.assessment.rules
            .filter((r) => r.triggered)
            .map((r) => (
              <div
                key={r.rule}
                className="p-3 border-b border-ink-200 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-body-sm font-semibold">
                    {r.rule.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-caption text-ink-400">
                    Score: {r.score} · Sev: {r.severity}
                  </span>
                </div>
                <p className="font-mono text-caption text-ink-500">{r.details}</p>
              </div>
            ))}
          {student.assessment.rules.filter((r) => r.triggered).length === 0 && (
            <p className="font-mono text-caption text-ink-400">No rules triggered</p>
          )}
        </div>

        <div className="space-y-3">
          <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
            All Rules
          </p>
          {student.assessment.rules.map((r) => (
            <div key={r.rule} className="flex items-center justify-between text-body-sm">
              <span>{r.rule.replace(/_/g, ' ')}</span>
              <span className={`font-mono text-caption ${r.triggered ? 'text-accent' : 'text-ink-400'}`}>
                {r.triggered ? `Triggered (${r.score})` : 'OK'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RiskDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<StudentDemo | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const students = useMemo(() => generateDemoData(), []);

  const filtered = useMemo(() => {
    if (filter === 'all') return students;
    return students.filter((s) => s.assessment.level === filter);
  }, [filter, students]);

  const counts = useMemo(() => {
    const c = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const s of students) c[s.assessment.level as keyof typeof c]++;
    return c;
  }, [students]);

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
      <main className="brutal-container min-h-screen py-16 space-y-12">
        <header className="animate-fade-in">
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            Risk Detection Dashboard
          </p>
          <h1 className="font-display text-heading font-bold">Student Risk Overview</h1>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(filter === level ? 'all' : level)}
              className={`p-4 border-brutal border-ink rounded-brutal-sm shadow-brutal-sm text-left transition-all hover:shadow-brutal ${
                filter === level ? 'ring-2 ring-ink' : ''
              }`}
            >
              <p className="font-mono text-caption text-ink-400">{level}</p>
              <p className="font-display text-display font-bold">{counts[level]}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in-up">
          {filtered.map((student, i) => (
            <button
              key={student.id}
              onClick={() => setSelected(student)}
              className="text-left bg-paper border-brutal border-ink rounded-brutal shadow-brutal-sm hover:shadow-brutal transition-all p-5 space-y-4 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-body-sm font-semibold truncate">
                    {student.name}
                  </p>
                  <p className="font-mono text-caption text-ink-400 truncate">
                    {student.email}
                  </p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2 ${levelDot(student.assessment.level)}`} />
              </div>

              <div className="flex items-center gap-2">
                <span className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${levelColor(student.assessment.level)}`}>
                  {student.assessment.level}
                </span>
                <span className="font-mono text-caption text-ink-400">
                  {student.assessment.overallScore}
                </span>
              </div>

              <div className="space-y-1">
                {student.assessment.rules
                  .filter((r) => r.triggered)
                  .slice(0, 2)
                  .map((r) => (
                    <div key={r.rule} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      <span className="font-mono text-caption text-ink-500 truncate">
                        {r.rule.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                {student.assessment.rules.filter((r) => r.triggered).length === 0 && (
                  <span className="font-mono text-caption text-ink-400">No flags</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {selected && <RuleModal student={selected} onClose={() => setSelected(null)} />}
      </main>
    </>
  );
}
