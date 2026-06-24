'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GridOverlay } from '@/components/GridOverlay';

const CONSENT_OPTIONS = [
  {
    scope: 'LMS_DATA',
    label: 'Activity Patterns',
    description:
      'Track your LMS login frequency, assignment submission times, and course engagement patterns to detect burnout indicators.',
  },
  {
    scope: 'CHAT_LOGS',
    label: 'Text Analysis',
    description:
      'Analyze your chat responses for sentiment and emotional cues to personalize support and early intervention.',
  },
  {
    scope: 'ACADEMIC_RECORDS',
    label: 'Academic Records',
    description:
      'Access your grades, course enrollments, and academic history to correlate performance with wellbeing metrics.',
  },
  {
    scope: 'ANALYTICS',
    label: 'Predictive Analytics',
    description:
      'Use your data in machine learning models that predict burnout risk and recommend timely support resources.',
  },
];

export default function ConsentPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, boolean>>({
    LMS_DATA: false,
    CHAT_LOGS: false,
    ACADEMIC_RECORDS: false,
    ANALYTICS: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/privacy/consent')
        .then((res) => res.json())
        .then((d) => {
          if (d.consentCompleted) {
            router.push('/dashboard');
            return;
          }
          if (d.data) {
            const prefs: Record<string, boolean> = {};
            d.data.forEach((s: any) => {
              prefs[s.scope] = s.granted;
            });
            setSettings((prev) => ({ ...prev, ...prefs }));
          }
        })
        .catch(() => {});
    }
  }, [status, session, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(settings).map(([scope, granted]) => ({ scope, granted }));
      const res = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      if (res.ok) {
        setSaved(true);
        update();
        setTimeout(() => router.push('/dashboard'), 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  const allGranted = Object.values(settings).every(Boolean);

  if (status === 'loading') {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-24 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 flex items-center justify-center">
        <div className="w-full max-w-2xl animate-fade-in-up space-y-10">
          <header className="space-y-4 text-center">
            <div className="mx-auto w-14 h-14 border-brutal border-ink rounded-brutal-sm flex items-center justify-center bg-chrome/10">
              <span className="font-mono text-display-sm font-bold text-chrome">!</span>
            </div>
            <h1 className="font-display text-heading font-bold">Your Privacy Matters</h1>
            <p className="font-mono text-body-sm text-ink-400 italic max-w-lg mx-auto">
              To help us detect burnout early and provide personalized support, we track certain
              aspects of your academic activity. Please review each category and choose what you are
              comfortable sharing.
            </p>
          </header>

          <div className="space-y-4">
            {CONSENT_OPTIONS.map((opt) => (
              <label
                key={opt.scope}
                className="block border-brutal-sm border-ink rounded-brutal-sm p-5 cursor-pointer hover:bg-ink/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[opt.scope]}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, [opt.scope]: e.target.checked }))
                      }
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-brutal-sm border-ink rounded-brutal-xs bg-paper peer-checked:bg-chrome peer-checked:border-chrome transition-colors flex items-center justify-center">
                      {settings[opt.scope] && (
                        <span className="text-paper font-mono text-caption font-bold">
                          &#10003;
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-body font-semibold">{opt.label}</p>
                    <p className="font-mono text-caption text-ink-400 italic mt-1">
                      {opt.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-4">
            <p className="font-mono text-caption text-ink-400 italic text-center">
              You can change these preferences anytime in your Privacy Settings.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="font-mono text-body-sm text-ink-400 hover:text-ink transition-colors px-6 py-3"
              >
                Skip for now
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-6 py-3 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
              >
                {saving
                  ? 'Saving...'
                  : saved
                    ? 'Saved!'
                    : allGranted
                      ? 'Accept All & Continue'
                      : 'Save Preferences & Continue'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
