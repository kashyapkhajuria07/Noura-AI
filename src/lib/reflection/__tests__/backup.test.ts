import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEncryptedBackup, getBackupStatus, restoreFromBackup } from '../backup';
import { decrypt } from '@/lib/db/encryption';
import type { ReflectionData } from '../types';

const BACKUP_KEY = 'burnout_reflection_backup';
const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => { storage.set(key, val); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => storage.clear(),
  get length() { return storage.size; },
  key: (i: number) => [...storage.keys()][i] ?? null,
});

vi.stubGlobal('window', {});

beforeEach(() => {
  storage.clear();
});

const mockData: ReflectionData = {
  journalEntries: [
    { id: 'j1', promptId: 'p01', promptText: 'Prompt', content: 'My journal entry', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), mood: 4 },
  ],
  moodEntries: [
    { id: 'm1', mood: 3, note: 'Neutral', timestamp: new Date().toISOString() },
  ],
};

describe('backup', () => {
  it('creates encrypted backup', () => {
    const result = createEncryptedBackup(mockData);
    expect(result.encrypted).toBeDefined();
    expect(result.encrypted.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it('encrypted data can be decrypted back to original', () => {
    const { encrypted } = createEncryptedBackup(mockData);
    const decrypted = decrypt(encrypted);
    const parsed = JSON.parse(decrypted);
    expect(parsed.journalEntries).toHaveLength(1);
    expect(parsed.journalEntries[0].content).toBe('My journal entry');
    expect(parsed.moodEntries).toHaveLength(1);
    expect(parsed.moodEntries[0].mood).toBe(3);
  });

  it('persists backup to localStorage', () => {
    createEncryptedBackup(mockData);
    const raw = localStorage.getItem(BACKUP_KEY);
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!);
    expect(parsed.encrypted).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
  });

  it('getBackupStatus returns null when no backup', () => {
    const status = getBackupStatus();
    expect(status.lastBackup).toBeNull();
    expect(status.encryptedSize).toBe(0);
  });

  it('getBackupStatus returns info after backup', () => {
    createEncryptedBackup(mockData);
    const status = getBackupStatus();
    expect(status.lastBackup).toBeDefined();
    expect(status.encryptedSize).toBeGreaterThan(0);
  });

  it('restoreFromBackup returns original data', () => {
    createEncryptedBackup(mockData);
    const restored = restoreFromBackup();
    expect(restored).toBeDefined();
    expect(restored!.journalEntries).toHaveLength(1);
    expect(restored!.journalEntries[0].content).toBe('My journal entry');
    expect(restored!.moodEntries).toHaveLength(1);
    expect(restored!.moodEntries[0].mood).toBe(3);
  });

  it('restoreFromBackup returns null when no backup', () => {
    const restored = restoreFromBackup();
    expect(restored).toBeNull();
  });

  it('handles corrupted backup gracefully', () => {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ encrypted: 'invalid:bad:data', timestamp: new Date().toISOString() }));
    const restored = restoreFromBackup();
    expect(restored).toBeNull();
  });
});
