import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReflectionStore } from '../store';

const STORAGE_KEY = 'burnout_reflection_data';
const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => {
    storage.set(key, val);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => storage.clear(),
  get length() {
    return storage.size;
  },
  key: (i: number) => [...storage.keys()][i] ?? null,
});

vi.stubGlobal('window', {});

beforeEach(() => {
  storage.clear();
});

describe('createReflectionStore', () => {
  it('starts with empty entries', () => {
    const store = createReflectionStore();
    expect(store.getJournalEntries()).toHaveLength(0);
    expect(store.getMoodEntries()).toHaveLength(0);
  });

  it('creates a journal entry', () => {
    const store = createReflectionStore();
    const entry = store.createJournalEntry('p01', 'What went well today?');
    expect(entry.id).toBeDefined();
    expect(entry.promptId).toBe('p01');
    expect(entry.promptText).toBe('What went well today?');
    expect(entry.content).toBe('');
    expect(store.getJournalEntries()).toHaveLength(1);
  });

  it('updates a journal entry', () => {
    const store = createReflectionStore();
    const entry = store.createJournalEntry('p01', 'Prompt');
    const updated = store.updateJournalEntry(entry.id, { content: 'My thoughts...', mood: 4 });
    expect(updated).toBeDefined();
    expect(updated!.content).toBe('My thoughts...');
    expect(updated!.mood).toBe(4);

    const loaded = store.getJournalEntry(entry.id);
    expect(loaded).toBeDefined();
    expect(loaded!.content).toBe('My thoughts...');
  });

  it('update returns undefined for missing entry', () => {
    const store = createReflectionStore();
    const result = store.updateJournalEntry('nonexistent', { content: 'test' });
    expect(result).toBeUndefined();
  });

  it('deletes a journal entry', () => {
    const store = createReflectionStore();
    const entry = store.createJournalEntry('p01', 'Prompt');
    expect(store.getJournalEntries()).toHaveLength(1);
    store.deleteJournalEntry(entry.id);
    expect(store.getJournalEntries()).toHaveLength(0);
  });

  it('persists to localStorage', () => {
    const store = createReflectionStore();
    store.createJournalEntry('p01', 'Prompt');
    store.addMoodEntry(3, 'Feeling OK');

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeDefined();
    const data = JSON.parse(raw!);
    expect(data.journalEntries).toHaveLength(1);
    expect(data.moodEntries).toHaveLength(1);
  });

  it('loads from localStorage on creation', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        journalEntries: [
          {
            id: 'restored',
            promptId: 'p01',
            promptText: 'Prompt',
            content: 'From storage',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        moodEntries: [{ id: 'm1', mood: 5, note: 'Great!', timestamp: new Date().toISOString() }],
      })
    );

    const store = createReflectionStore();
    expect(store.getJournalEntries()).toHaveLength(1);
    expect(store.getJournalEntries()[0].content).toBe('From storage');
    expect(store.getMoodEntries()).toHaveLength(1);
  });

  it('adds mood entry', () => {
    const store = createReflectionStore();
    const entry = store.addMoodEntry(4, 'Good day');
    expect(entry.mood).toBe(4);
    expect(entry.note).toBe('Good day');
    expect(store.getMoodEntries()).toHaveLength(1);
  });

  it('deletes mood entry', () => {
    const store = createReflectionStore();
    const entry = store.addMoodEntry(2, 'Tired');
    store.deleteMoodEntry(entry.id);
    expect(store.getMoodEntries()).toHaveLength(0);
  });

  it('filters mood entries by days', () => {
    const store = createReflectionStore();
    const e1 = store.addMoodEntry(3, 'Recent');
    const oldTs = new Date(Date.now() - 60 * 86400000).toISOString();
    // Add second entry with old timestamp via direct storage mutation
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    raw.moodEntries.push({ id: 'old', mood: 2, note: 'Old', timestamp: oldTs });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    const store2 = createReflectionStore();
    const recent = store2.getMoodEntries(30);
    expect(recent.length).toBe(1);
    expect(recent[0].id).toBe(e1.id);
  });

  it('imports data', () => {
    const store = createReflectionStore();
    store.importData({
      journalEntries: [
        {
          id: 'imp',
          promptId: 'p01',
          promptText: 'Prompt',
          content: 'Imported',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      moodEntries: [],
    });
    expect(store.getJournalEntries()).toHaveLength(1);
    expect(store.getJournalEntries()[0].content).toBe('Imported');
  });

  it('returns all data via getAllData', () => {
    const store = createReflectionStore();
    store.createJournalEntry('p01', 'Prompt');
    store.addMoodEntry(5, 'Awesome');
    const all = store.getAllData();
    expect(all.journalEntries).toHaveLength(1);
    expect(all.moodEntries).toHaveLength(1);
  });
});
