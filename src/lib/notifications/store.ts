'use client';

const DISMISSED_KEYS = 'sb_dismissed_notifications';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface DismissedEntry {
  id: string;
  dismissedAt: number;
}

export function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEYS);
    if (!raw) return new Set();
    const entries: DismissedEntry[] = JSON.parse(raw);
    const now = Date.now();
    const valid = entries.filter((e) => now - e.dismissedAt < DISMISS_TTL_MS);
    if (valid.length !== entries.length) {
      localStorage.setItem(DISMISSED_KEYS, JSON.stringify(valid));
    }
    return new Set(valid.map((e) => e.id));
  } catch {
    return new Set();
  }
}

export function markDismissed(id: string): void {
  try {
    const raw = localStorage.getItem(DISMISSED_KEYS);
    const entries: DismissedEntry[] = raw ? JSON.parse(raw) : [];
    entries.push({ id, dismissedAt: Date.now() });
    localStorage.setItem(DISMISSED_KEYS, JSON.stringify(entries));
  } catch {
    // localStorage unavailable
  }
}

export function isDismissed(id: string): boolean {
  return getDismissedIds().has(id);
}
