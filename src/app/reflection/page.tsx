'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import { PROMPTS } from '@/lib/reflection/prompts';
import { createReflectionStore } from '@/lib/reflection/store';
import { JournalForm } from '@/components/reflection/JournalForm';
import { MoodTracker } from '@/components/reflection/MoodTracker';
import { MoodChart } from '@/components/reflection/MoodChart';
import {
  createEncryptedBackup,
  getBackupStatus,
  restoreFromBackup,
  uploadBackup,
  downloadBackup,
  type BackupStatus,
} from '@/lib/reflection/backup';
import type { JournalEntry } from '@/lib/reflection/types';

type Tab = 'journal' | 'mood' | 'progress';

export default function ReflectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const store = useMemo(() => createReflectionStore(), []);

  const [tab, setTab] = useState<Tab>('journal');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    store.getJournalEntries()
  );
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [moodEntries, setMoodEntries] = useState(() => store.getMoodEntries());
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(() => getBackupStatus());
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const refreshMoods = useCallback(() => {
    setMoodEntries([...store.getMoodEntries()]);
  }, [store]);

  const refreshJournal = useCallback(() => {
    setJournalEntries([...store.getJournalEntries()]);
  }, [store]);

  const handleCreateEntry = useCallback(
    (promptId: string, promptText: string): JournalEntry => {
      const entry = store.createJournalEntry(promptId, promptText);
      refreshJournal();
      return entry;
    },
    [store, refreshJournal]
  );

  const handleUpdateEntry = useCallback(
    (
      id: string,
      updates: Partial<Pick<JournalEntry, 'content' | 'mood' | 'cbtWorksheet'>>
    ): JournalEntry | undefined => {
      const entry = store.updateJournalEntry(id, updates);
      if (entry) refreshJournal();
      return entry;
    },
    [store, refreshJournal]
  );

  const handleDeleteEntry = useCallback(
    (id: string) => {
      store.deleteJournalEntry(id);
      setSelectedEntry(null);
      refreshJournal();
    },
    [store, refreshJournal]
  );

  const handleAddMood = useCallback(
    (mood: Parameters<typeof store.addMoodEntry>[0], note: string) => {
      store.addMoodEntry(mood, note);
      refreshMoods();
    },
    [store, refreshMoods]
  );

  const handleDeleteMood = useCallback(
    (id: string) => {
      store.deleteMoodEntry(id);
      refreshMoods();
    },
    [store, refreshMoods]
  );

  const handleBackup = useCallback(async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const data = store.getAllData();
      const { encrypted } = createEncryptedBackup(data);
      const ok = await uploadBackup(encrypted);
      setBackupStatus(getBackupStatus());
      setBackupMsg(ok ? 'Backup uploaded successfully' : 'Saved locally (server unavailable)');
    } catch {
      setBackupMsg('Backup failed');
    } finally {
      setBackupLoading(false);
    }
  }, [store]);

  const handleRestore = useCallback(async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const data = restoreFromBackup();
      if (data) {
        store.importData(data);
        refreshJournal();
        refreshMoods();
        setBackupMsg('Restored from local backup');
      } else {
        const encrypted = await downloadBackup();
        if (encrypted) {
          const { decrypt } = await import('@/lib/db/encryption');
          const json = decrypt(encrypted);
          const data = JSON.parse(json);
          store.importData(data);
          refreshJournal();
          refreshMoods();
          setBackupMsg('Restored from cloud backup');
        } else {
          setBackupMsg('No backup found');
        }
      }
    } catch {
      setBackupMsg('Restore failed');
    } finally {
      setBackupLoading(false);
    }
  }, [store, refreshJournal, refreshMoods]);

  if (status === 'loading') {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 4 }, (_, i) => (
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
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            Reflection &amp; Mood
          </p>
          <h1 className="font-display text-heading font-bold">Journal &amp; Mood Tracking</h1>
        </header>

        <div className="flex items-center gap-4 border-b-2 border-ink pb-2 animate-fade-in-up">
          {[
            { id: 'journal' as const, label: 'Journal' },
            { id: 'mood' as const, label: 'Mood Tracker' },
            { id: 'progress' as const, label: 'Progress' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-display text-body-sm font-semibold pb-1 border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-400 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-caption text-ink-400">
              {backupStatus.lastBackup
                ? `Backup: ${new Date(backupStatus.lastBackup).toLocaleDateString()}`
                : 'No backup'}
            </span>
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="font-mono text-caption text-chrome hover:text-chrome-dark transition-colors disabled:opacity-40"
            >
              Backup
            </button>
            <button
              onClick={handleRestore}
              disabled={backupLoading}
              className="font-mono text-caption text-ink-400 hover:text-ink transition-colors disabled:opacity-40"
            >
              Restore
            </button>
          </div>
        </div>

        {backupMsg && (
          <div className="bg-chrome/5 border-brutal-sm border-chrome rounded-brutal-sm p-3 animate-fade-in">
            <p className="font-mono text-caption text-chrome">{backupMsg}</p>
          </div>
        )}

        {tab === 'journal' && (
          <div className="animate-fade-in max-w-2xl">
            <JournalForm
              prompts={PROMPTS}
              entries={journalEntries}
              selectedEntry={selectedEntry}
              onSelectEntry={setSelectedEntry}
              onCreateEntry={handleCreateEntry}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          </div>
        )}

        {tab === 'mood' && (
          <div className="animate-fade-in max-w-xl">
            <MoodTracker
              entries={moodEntries}
              onAddMood={handleAddMood}
              onDeleteMood={handleDeleteMood}
            />
          </div>
        )}

        {tab === 'progress' && (
          <div className="animate-fade-in max-w-3xl">
            <MoodChart entries={moodEntries} days={30} />
          </div>
        )}
      </main>
    </>
  );
}
