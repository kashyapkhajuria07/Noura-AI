import { encrypt, decrypt } from '@/lib/db/encryption';
import type { ReflectionData } from './types';

const BACKUP_STORAGE_KEY = 'burnout_reflection_backup';

export interface BackupStatus {
  lastBackup: string | null;
  encryptedSize: number;
}

export function getBackupStatus(): BackupStatus {
  if (typeof window === 'undefined') return { lastBackup: null, encryptedSize: 0 };
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return { lastBackup: null, encryptedSize: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastBackup: parsed.timestamp ?? null,
      encryptedSize: raw.length,
    };
  } catch {
    return { lastBackup: null, encryptedSize: 0 };
  }
}

export function createEncryptedBackup(data: ReflectionData): {
  encrypted: string;
  timestamp: string;
} {
  const json = JSON.stringify(data);
  const encrypted = encrypt(json);
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ encrypted, timestamp });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, payload);
    } catch {
      /* storage full */
    }
  }

  return { encrypted, timestamp };
}

export function restoreFromBackup(): ReflectionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const json = decrypt(parsed.encrypted);
    return JSON.parse(json) as ReflectionData;
  } catch {
    return null;
  }
}

export async function uploadBackup(encrypted: string): Promise<boolean> {
  try {
    const res = await fetch('/api/reflection/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encrypted }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function downloadBackup(): Promise<string | null> {
  try {
    const res = await fetch('/api/reflection/backup');
    if (!res.ok) return null;
    const data = await res.json();
    return data.encrypted ?? null;
  } catch {
    return null;
  }
}
