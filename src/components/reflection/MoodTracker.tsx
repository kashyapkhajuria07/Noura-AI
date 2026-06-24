'use client';

import { useState, useCallback } from 'react';
import { MOOD_LABELS } from '@/lib/reflection/types';
import type { MoodLevel, MoodEntry } from '@/lib/reflection/types';

interface MoodTrackerProps {
  entries: MoodEntry[];
  onAddMood: (mood: MoodLevel, note: string) => void;
  onDeleteMood: (id: string) => void;
}

export function MoodTracker({ entries, onAddMood, onDeleteMood }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');

  const handleSave = useCallback(() => {
    if (selectedMood === null) return;
    onAddMood(selectedMood, note);
    setSelectedMood(null);
    setNote('');
  }, [selectedMood, note, onAddMood]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-display text-subheading font-semibold">How are you feeling?</h3>
        <div className="flex items-center gap-3">
          {([1, 2, 3, 4, 5] as MoodLevel[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMood(m)}
              className={`flex flex-col items-center gap-1 p-3 rounded-brutal-sm border-brutal-sm transition-all ${
                selectedMood === m
                  ? 'bg-ink-100 border-ink scale-110 shadow-brutal-sm'
                  : 'bg-paper border-ink-200 hover:border-ink hover:bg-ink-50'
              }`}
            >
              <span className="text-2xl">{MOOD_LABELS[m].emoji}</span>
              <span className="font-mono text-caption text-ink-500">{MOOD_LABELS[m].label}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="space-y-3 animate-fade-in">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={3}
              className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm p-3 font-mono text-body-sm text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink resize-none"
            />
            <button
              onClick={handleSave}
              className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-6 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              Log Mood
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-body font-semibold">Recent Moods</h3>
        {entries.length === 0 ? (
          <p className="font-mono text-caption text-ink-400">No moods logged yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-2 border-b border-ink-100">
                <span className="text-lg">{MOOD_LABELS[e.mood].emoji}</span>
                <span className="font-mono text-caption text-ink-400 min-w-[80px]">
                  {new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                {e.note && (
                  <span className="font-mono text-caption text-ink-500 flex-1 truncate">{e.note}</span>
                )}
                <button
                  onClick={() => onDeleteMood(e.id)}
                  className="font-mono text-caption text-ink-300 hover:text-accent transition-colors ml-auto"
                >
                  del
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
