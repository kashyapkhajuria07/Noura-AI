import { describe, it, expect, vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    connected: false,
    disconnect: vi.fn(),
  })),
}));

describe('notifications client', () => {
  it('exports expected functions', async () => {
    const mod = await import('../client');
    expect(typeof mod.connectSocket).toBe('function');
    expect(typeof mod.getSocket).toBe('function');
    expect(typeof mod.disconnectSocket).toBe('function');
    expect(typeof mod.onNotification).toBe('function');
    expect(typeof mod.onConnectionChange).toBe('function');
    expect(typeof mod.isConnected).toBe('function');
  });

  it('isConnected returns false initially', async () => {
    const { isConnected } = await import('../client');
    expect(isConnected()).toBe(false);
  });

  it('getSocket returns null initially', async () => {
    const { getSocket } = await import('../client');
    expect(getSocket()).toBeNull();
  });

  it('disconnectSocket does not throw when not connected', async () => {
    const { disconnectSocket } = await import('../client');
    expect(() => disconnectSocket()).not.toThrow();
  });
});
