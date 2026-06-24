'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GridOverlay } from '@/components/GridOverlay';

interface Student {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface StudentDetail {
  id: string;
  email: string;
  name: string | null;
  riskScores: { level: string; score: number; computedAt: string }[];
  activities: { type: string; title: string; timestamp: string }[];
  interventions: { type: string; status: string; title: string }[];
  consent: { scope: string; granted: boolean }[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
      setStudents((prev) => [d.data, ...prev]);
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
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            Admin Panel
          </p>
          <h1 className="font-display text-heading font-bold">Student Management</h1>
        </header>

        <section className="animate-fade-in-up space-y-4">
          <h2 className="font-display text-subheading font-semibold">Create Student</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-mono text-caption text-ink-500 italic mb-1">Email *</label>
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
          <h2 className="font-display text-subheading font-semibold">
            Students ({students.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic">
                    Name
                  </th>
                  <th className="font-mono text-caption uppercase tracking-wider text-left py-3 pr-4 italic">
                    Email
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
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink-200 hover:bg-ink-100/50 transition-colors cursor-pointer"
                    onClick={() => selectStudent(s.id)}
                  >
                    <td className="py-3 pr-4 font-display text-body-sm font-medium">
                      {s.name ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-body-sm text-ink-500">{s.email}</td>
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
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center font-mono text-caption text-ink-400">
                      No students yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="animate-fade-in-up space-y-8">
            <h2 className="font-display text-subheading font-semibold">
              {selected.name ?? selected.email}
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border-brutal border-ink rounded-brutal-sm p-4 space-y-3">
                <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
                  Risk History
                </p>
                {selected.riskScores.length === 0 ? (
                  <p className="font-mono text-caption text-ink-400">No data</p>
                ) : (
                  selected.riskScores.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                        r.level === 'CRITICAL' ? 'bg-accent text-paper' :
                        r.level === 'HIGH' ? 'bg-accent/80 text-paper' :
                        r.level === 'MEDIUM' ? 'bg-ink-300 text-ink' :
                        'bg-ink-100 text-ink-600'
                      }`}>{r.level}</span>
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
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-mono text-caption bg-ink-100 px-1.5 py-0.5 rounded-brutal-sm">
                        {iv.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                        iv.status === 'COMPLETED' ? 'bg-chrome text-paper' :
                        iv.status === 'ACTIVE' ? 'bg-ink text-paper' :
                        'bg-ink-200 text-ink'
                      }`}>{iv.status}</span>
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
                      <span className={`font-mono text-caption px-1.5 py-0.5 rounded-brutal-sm ${
                        c.granted ? 'bg-chrome text-paper' : 'bg-accent text-paper'
                      }`}>{c.granted ? 'Granted' : 'Revoked'}</span>
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
