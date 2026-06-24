import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
  });
});

describe('notification store', () => {
  async function loadModule() {
    return import('../store');
  }

  it('returns empty set when no dismissed notifications', async () => {
    const { getDismissedIds } = await loadModule();
    expect(getDismissedIds().size).toBe(0);
  });

  it('marks a notification as dismissed', async () => {
    const { getDismissedIds, markDismissed } = await loadModule();
    markDismissed('test-1');
    expect(getDismissedIds().has('test-1')).toBe(true);
  });

  it('checks if a specific id is dismissed', async () => {
    const { isDismissed, markDismissed } = await loadModule();
    expect(isDismissed('test-2')).toBe(false);
    markDismissed('test-2');
    expect(isDismissed('test-2')).toBe(true);
  });

  it('handles multiple dismissed ids', async () => {
    const { getDismissedIds, markDismissed } = await loadModule();
    markDismissed('a');
    markDismissed('b');
    markDismissed('c');
    expect(getDismissedIds().size).toBe(3);
  });

  it('handles localStorage being unavailable', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { getDismissedIds, markDismissed } = await loadModule();
    expect(() => markDismissed('x')).not.toThrow();
    expect(getDismissedIds().size).toBe(0);
  });
});
