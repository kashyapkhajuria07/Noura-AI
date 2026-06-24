'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';

interface ConsentEntry {
  scope: string;
  granted: boolean;
  grantedAt: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  actorRole: string;
  details: string | null;
  createdAt: string;
}

const SCOPE_LABELS: Record<string, string> = {
  LMS_DATA: 'Activity Patterns',
  CHAT_LOGS: 'Text Analysis',
  ACADEMIC_RECORDS: 'Academic Records',
  ANALYTICS: 'Predictive Analytics',
};

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  LMS_DATA: 'LMS login frequency, assignment submission times, course engagement',
  CHAT_LOGS: 'Sentiment analysis on chat responses for emotional cues',
  ACADEMIC_RECORDS: 'Grades, course enrollments, and academic history',
  ANALYTICS: 'Machine learning models for burnout prediction',
};

export default function PrivacyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [consentSettings, setConsentSettings] = useState<ConsentEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'student' && !session?.user?.role) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [consentRes, auditRes] = await Promise.all([
        fetch('/api/privacy/consent'),
        fetch('/api/privacy/audit-log'),
      ]);
      if (consentRes.ok) {
        const d = await consentRes.json();
        setConsentSettings(d.data ?? []);
      }
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.data ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, fetchData]);

  const toggleConsent = async (scope: string, granted: boolean) => {
    setConsentSettings((prev) => prev.map((s) => (s.scope === scope ? { ...s, granted } : s)));
    setSaveStatus('saving');
    try {
      const payload = consentSettings.map((s) =>
        s.scope === scope ? { scope, granted } : { scope: s.scope, granted: s.granted }
      );
      const res = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      if (res.ok) setSaveStatus('saved');
      else setSaveStatus('idle');
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/privacy/export');
      if (res.ok) {
        const d = await res.json();
        const blob = new Blob([JSON.stringify(d.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/privacy/delete', { method: 'POST' });
      if (res.ok) {
        router.push('/auth/login?deleted=true');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-16 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-10">
        <header className="animate-fade-in">
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">Settings</p>
          <h1 className="font-display text-heading font-bold">Privacy & Data</h1>
          <p className="font-mono text-caption text-ink-400 mt-2 italic">
            Manage what data you share, export your information, or delete your account.
          </p>
        </header>

        <section className="border-brutal border-ink rounded-brutal p-6 space-y-6 animate-fade-in-up">
          <h2 className="font-display text-subheading font-semibold">
            Data Collection Preferences
          </h2>
          <p className="font-mono text-caption text-ink-400 italic">
            Toggle each category to control what data we track. Changes save immediately.
          </p>

          <div className="space-y-4">
            {consentSettings.map((entry) => (
              <div
                key={entry.scope}
                className="flex items-start justify-between gap-4 border-brutal-sm border-ink rounded-brutal-sm p-4"
              >
                <div className="flex-1">
                  <p className="font-display text-body font-semibold">
                    {SCOPE_LABELS[entry.scope] ?? entry.scope}
                  </p>
                  <p className="font-mono text-caption text-ink-400 italic">
                    {SCOPE_DESCRIPTIONS[entry.scope]}
                  </p>
                  {entry.grantedAt && (
                    <p className="font-mono text-caption text-ink-300 mt-1">
                      Granted {new Date(entry.grantedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleConsent(entry.scope, !entry.granted)}
                  className={`relative w-12 h-7 rounded-brutal-xs border-brutal-sm transition-colors ${
                    entry.granted ? 'bg-chrome border-chrome' : 'bg-ink-100 border-ink'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-paper rounded-brutal-xs shadow-brutal-xs transition-transform ${
                      entry.granted ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {saveStatus === 'saved' && (
            <p className="font-mono text-caption text-chrome italic">Preferences saved.</p>
          )}
        </section>

        <section className="border-brutal border-ink rounded-brutal p-6 space-y-4 animate-fade-in-up">
          <h2 className="font-display text-subheading font-semibold">Your Data</h2>
          <p className="font-mono text-caption text-ink-400 italic">
            Download all data stored about you in JSON format for personal records or transfer.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-5 py-2.5 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
          >
            {exporting ? 'Exporting...' : 'Export My Data'}
          </button>
        </section>

        <section className="border-brutal border-ink rounded-brutal p-6 space-y-4 animate-fade-in-up">
          <h2 className="font-display text-subheading font-semibold">Access History</h2>
          <p className="font-mono text-caption text-ink-400 italic">
            See when staff members have accessed your data.
          </p>

          {auditLogs.length === 0 ? (
            <p className="font-mono text-body-sm text-ink-300 italic">No access records yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border-brutal-sm border-ink rounded-brutal-sm p-3 flex items-start justify-between"
                >
                  <div>
                    <p className="font-mono text-body-sm">
                      {log.actorRole === 'counselor'
                        ? 'Counselor'
                        : log.actorRole === 'admin'
                          ? 'Admin'
                          : log.actorRole}{' '}
                      <span className="text-ink-400">{log.details ?? log.action}</span>
                    </p>
                    {log.details && (
                      <p className="font-mono text-caption text-ink-300 mt-0.5">{log.action}</p>
                    )}
                  </div>
                  <p className="font-mono text-caption text-ink-400 whitespace-nowrap ml-4">
                    {new Date(log.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border-brutal border-accent rounded-brutal p-6 space-y-4 animate-fade-in-up bg-accent/5">
          <h2 className="font-display text-subheading font-semibold text-accent">Danger Zone</h2>
          <p className="font-mono text-caption text-accent/70 italic">
            Permanently anonymize your account. This cannot be undone — your data will be scrubbed
            and your email will be replaced.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="font-display text-body-sm font-semibold bg-accent text-paper border-brutal-sm border-accent rounded-brutal-sm shadow-brutal-sm px-5 py-2.5 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-body-sm text-accent font-semibold">
                Are you sure? Your profile, activity, risk scores, chat history, and interventions
                will be anonymized. This action is irreversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="font-mono text-body-sm text-ink-400 hover:text-ink transition-colors px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="font-display text-body-sm font-semibold bg-accent text-paper border-brutal-sm border-accent rounded-brutal-sm shadow-brutal-sm px-5 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
