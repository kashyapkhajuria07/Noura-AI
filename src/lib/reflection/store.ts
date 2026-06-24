import type { JournalEntry, MoodEntry, MoodLevel, ReflectionData, CBTWorksheetEntry } from './types';

const STORAGE_KEY = 'burnout_reflection_data';
const AUTOSAVE_DELAY = 2000;

function loadData(): ReflectionData {
  if (typeof window === 'undefined') return { journalEntries: [], moodEntries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReflectionData;
  } catch { /* ignore */ }
  return { journalEntries: [], moodEntries: [] };
}

function saveData(data: ReflectionData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full */ }
}

let _counter = 0;
function uid(): string {
  return `ref-${Date.now()}-${++_counter}`;
}

export function createReflectionStore() {
  let data = loadData();
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveData(data);
      autosaveTimer = null;
    }, AUTOSAVE_DELAY);
  }

  function getJournalEntries(): JournalEntry[] {
    return [...data.journalEntries].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  function getJournalEntry(id: string): JournalEntry | undefined {
    return data.journalEntries.find((e) => e.id === id);
  }

  function createJournalEntry(promptId: string, promptText: string): JournalEntry {
    const entry: JournalEntry = {
      id: uid(),
      promptId,
      promptText,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.journalEntries.push(entry);
    saveData(data);
    return entry;
  }

  function updateJournalEntry(id: string, updates: Partial<Pick<JournalEntry, 'content' | 'mood' | 'cbtWorksheet'>>): JournalEntry | undefined {
    const entry = data.journalEntries.find((e) => e.id === id);
    if (!entry) return undefined;
    if (updates.content !== undefined) entry.content = updates.content;
    if (updates.mood !== undefined) entry.mood = updates.mood;
    if (updates.cbtWorksheet !== undefined) entry.cbtWorksheet = updates.cbtWorksheet;
    entry.updatedAt = new Date().toISOString();
    scheduleAutosave();
    return { ...entry };
  }

  function deleteJournalEntry(id: string): void {
    data.journalEntries = data.journalEntries.filter((e) => e.id !== id);
    saveData(data);
  }

  function getMoodEntries(days?: number): MoodEntry[] {
    let entries = [...data.moodEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (days) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      entries = entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);
    }
    return entries;
  }

  function addMoodEntry(mood: MoodLevel, note: string): MoodEntry {
    const entry: MoodEntry = {
      id: uid(),
      mood,
      note,
      timestamp: new Date().toISOString(),
    };
    data.moodEntries.push(entry);
    saveData(data);
    return entry;
  }

  function deleteMoodEntry(id: string): void {
    data.moodEntries = data.moodEntries.filter((e) => e.id !== id);
    saveData(data);
  }

  function getAllData(): ReflectionData {
    return { ...data, journalEntries: [...data.journalEntries], moodEntries: [...data.moodEntries] };
  }

  function importData(imported: ReflectionData): void {
    data = imported;
    saveData(data);
  }

  return {
    getJournalEntries,
    getJournalEntry,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getMoodEntries,
    addMoodEntry,
    deleteMoodEntry,
    getAllData,
    importData,
  };
}

export type ReflectionStore = ReturnType<typeof createReflectionStore>;
