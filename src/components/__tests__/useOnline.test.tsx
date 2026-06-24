import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

function mockNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

describe('useOnline', () => {
  beforeEach(() => {
    mockNavigatorOnline(true);
  });

  it('returns online status', async () => {
    const { useOnline } = await import('@/lib/hooks/useOnline');
    const { result } = renderHook(() => useOnline());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('detects offline', async () => {
    mockNavigatorOnline(false);
    const { useOnline } = await import('@/lib/hooks/useOnline');
    const { result } = renderHook(() => useOnline());
    expect(result.current.isOffline).toBe(true);
  });
});

describe('PWA Manifest', () => {
  it('manifest contains required fields', async () => {
    const { GET } = await import('@/app/api/manifest/route');
    const response = await GET();
    const manifest = await response.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('manifest icons have required fields', async () => {
    const { GET } = await import('@/app/api/manifest/route');
    const response = await GET();
    const manifest = await response.json();
    for (const icon of manifest.icons) {
      expect(icon.src).toBeDefined();
      expect(icon.sizes).toBeDefined();
      expect(icon.type).toBeDefined();
    }
  });
});
