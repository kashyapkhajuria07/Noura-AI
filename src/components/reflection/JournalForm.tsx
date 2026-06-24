'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JournalEntry, Prompt, CBTWorksheetEntry, MoodLevel } from '@/lib/reflection/types';
import { MOOD_LABELS } from '@/lib/reflection/types';

interface JournalFormProps {
  prompts: Prompt[];
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  onCreateEntry: (promptId: string, promptText: string) => JournalEntry;
  onUpdateEntry: (id: string, updates: Partial<Pick<JournalEntry, 'content' | 'mood' | 'cbtWorksheet'>>) => JournalEntry | undefined;
  onDeleteEntry: (id: string) => void;
}

export function JournalForm({
  prompts,
  entries,
  selectedEntry,
  onSelectEntry,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}: JournalFormProps) {
  const [content, setContent] = useState('');
  const [showCBT, setShowCBT] = useState(false);
  const [cbtThought, setCbtThought] = useState('');
  const [cbtEvidence, setCbtEvidence] = useState('');
  const [cbtReframe, setCbtReframe] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedEntry) {
      setContent(selectedEntry.content);
      setSelectedMood(selectedEntry.mood ?? null);
      setSelectedPromptId(selectedEntry.promptId);
      if (selectedEntry.cbtWorksheet) {
        setShowCBT(true);
        setCbtThought(selectedEntry.cbtWorksheet.thought);
        setCbtEvidence(selectedEntry.cbtWorksheet.evidenceAgainst);
        setCbtReframe(selectedEntry.cbtWorksheet.reframe);
      } else {
        setShowCBT(false);
        setCbtThought('');
        setCbtEvidence('');
        setCbtReframe('');
      }
    } else {
      setContent('');
      setSelectedMood(null);
      setSelectedPromptId('');
      setShowCBT(false);
      setCbtThought('');
      setCbtEvidence('');
      setCbtReframe('');
    }
  }, [selectedEntry]);

  const scheduleAutosave = useCallback((id: string, updates: Partial<Pick<JournalEntry, 'content' | 'mood' | 'cbtWorksheet'>>) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      onUpdateEntry(id, updates);
    }, 1500);
  }, [onUpdateEntry]);

  const handleContentChange = useCallback((val: string) => {
    setContent(val);
    if (selectedEntry) {
      scheduleAutosave(selectedEntry.id, { content: val, mood: selectedMood ?? undefined, cbtWorksheet: showCBT ? { thought: cbtThought, evidenceAgainst: cbtEvidence, reframe: cbtReframe } : undefined });
    }
  }, [selectedEntry, scheduleAutosave, selectedMood, showCBT, cbtThought, cbtEvidence, cbtReframe]);

  const handleCreate = useCallback(() => {
    if (!selectedPromptId) return;
    const prompt = prompts.find((p) => p.id === selectedPromptId);
    if (!prompt) return;
    const entry = onCreateEntry(prompt.id, prompt.text);
    onSelectEntry(entry);
  }, [selectedPromptId, prompts, onCreateEntry, onSelectEntry]);

  const handleSaveCBT = useCallback(() => {
    if (!selectedEntry) return;
    const ws: CBTWorksheetEntry = { thought: cbtThought, evidenceAgainst: cbtEvidence, reframe: cbtReframe };
    onUpdateEntry(selectedEntry.id, { cbtWorksheet: ws });
  }, [selectedEntry, cbtThought, cbtEvidence, cbtReframe, onUpdateEntry]);

  const handleSaveMood = useCallback(() => {
    if (!selectedEntry || selectedMood === null) return;
    onUpdateEntry(selectedEntry.id, { mood: selectedMood });
  }, [selectedEntry, selectedMood, onUpdateEntry]);

  const isNewEntry = !selectedEntry;

  return (
    <div className="space-y-6">
      {entries.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-caption text-ink-400">Recent:</span>
          {entries.slice(0, 5).map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectEntry(e)}
              className={`font-mono text-caption px-2 py-1 rounded-brutal-sm border-brutal-sm transition-colors ${
                selectedEntry?.id === e.id
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-paper text-ink-400 border-ink-200 hover:border-ink'
              }`}
            >
              {e.promptText.slice(0, 24)}...
            </button>
          ))}
        </div>
      )}

      {isNewEntry && (
        <div className="flex items-center gap-3">
          <select
            value={selectedPromptId}
            onChange={(e) => setSelectedPromptId(e.target.value)}
            className="flex-1 bg-paper border-brutal-sm border-ink rounded-brutal-sm p-2 font-mono text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink"
          >
            <option value="">Choose a prompt...</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.category}] {p.text}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={!selectedPromptId}
            className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
          >
            Start
          </button>
        </div>
      )}

      {(selectedEntry || isNewEntry) && (
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Write your thoughts here..."
          rows={8}
          className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm p-4 font-mono text-body-sm text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink resize-y"
        />
      )}

      {content && (
        <>
          <div className="flex items-center gap-3">
            <span className="font-mono text-caption text-ink-400">Mood:</span>
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSelectedMood(m);
                  if (selectedEntry) onUpdateEntry(selectedEntry.id, { mood: m });
                }}
                className={`text-xl p-1 rounded-brutal-sm transition-all ${
                  selectedMood === m
                    ? 'bg-ink-100 ring-2 ring-ink scale-110'
                    : 'hover:bg-ink-50'
                }`}
                title={MOOD_LABELS[m].label}
              >
                {MOOD_LABELS[m].emoji}
              </button>
            ))}
          </div>

          <div className="border-t border-ink-200 pt-4 space-y-3">
            <button
              onClick={() => setShowCBT(!showCBT)}
              className="font-mono text-caption text-chrome hover:text-chrome-dark transition-colors border-b border-transparent hover:border-chrome"
            >
              {showCBT ? 'Hide CBT Worksheet' : 'Open CBT Worksheet'}
            </button>

            {showCBT && (
              <div className="grid grid-cols-3 gap-4 border-brutal-sm border-ink rounded-brutal-sm p-4 bg-ink-50">
                <div className="space-y-2">
                  <p className="font-mono text-caption uppercase tracking-wider text-ink-400">Thought</p>
                  <textarea
                    value={cbtThought}
                    onChange={(e) => setCbtThought(e.target.value)}
                    placeholder="What is the negative thought?"
                    rows={4}
                    className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm p-2 font-mono text-caption text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-caption uppercase tracking-wider text-ink-400">Evidence Against</p>
                  <textarea
                    value={cbtEvidence}
                    onChange={(e) => setCbtEvidence(e.target.value)}
                    placeholder="What contradicts this thought?"
                    rows={4}
                    className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm p-2 font-mono text-caption text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-caption uppercase tracking-wider text-chrome">Reframe</p>
                  <textarea
                    value={cbtReframe}
                    onChange={(e) => setCbtReframe(e.target.value)}
                    placeholder="What is a balanced thought?"
                    rows={4}
                    className="w-full bg-paper border-brutal-sm border-chrome rounded-brutal-sm p-2 font-mono text-caption text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-chrome resize-none"
                  />
                </div>
                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={handleSaveCBT}
                    disabled={!selectedEntry}
                    className="font-mono text-caption text-chrome hover:text-chrome-dark transition-colors border-b border-chrome"
                  >
                    Save Worksheet
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedEntry && (
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => onDeleteEntry(selectedEntry.id)}
                className="font-mono text-caption text-accent hover:text-accent-dark transition-colors border-b border-accent"
              >
                Delete entry
              </button>
              <button
                onClick={() => onSelectEntry(null)}
                className="font-mono text-caption text-ink-400 hover:text-ink transition-colors border-b border-ink-200 hover:border-ink"
              >
                New entry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
