export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  mood: MoodLevel;
  note: string;
  timestamp: string;
}

export interface CBTWorksheetEntry {
  thought: string;
  evidenceAgainst: string;
  reframe: string;
}

export interface JournalEntry {
  id: string;
  promptId: string;
  promptText: string;
  content: string;
  cbtWorksheet?: CBTWorksheetEntry;
  mood?: MoodLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  category: 'energy' | 'gratitude' | 'reflection' | 'cbt' | 'goals';
  text: string;
}

export interface ReflectionData {
  journalEntries: JournalEntry[];
  moodEntries: MoodEntry[];
}

export const MOOD_LABELS: Record<MoodLevel, { label: string; emoji: string }> = {
  1: { label: 'Exhausted', emoji: '\u{1F634}' },
  2: { label: 'Drained', emoji: '\u{1F622}' },
  3: { label: 'Neutral', emoji: '\u{1F610}' },
  4: { label: 'Good', emoji: '\u{1F60A}' },
  5: { label: 'Energized', emoji: '\u{1F680}' },
};
