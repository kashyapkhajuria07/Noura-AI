'use client';

import { io, Socket } from 'socket.io-client';
import type { Notification } from './types';

let socket: Socket | null = null;
let listeners: Set<(n: Notification) => void> = new Set();
let connectedListeners: Set<(v: boolean) => void> = new Set();

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function connectSocket(studentId?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    query: studentId ? { studentId } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('notification', (notification: Notification) => {
    listeners.forEach((fn) => fn(notification));
  });

  socket.on('connect', () => {
    connectedListeners.forEach((fn) => fn(true));
  });

  socket.on('disconnect', () => {
    connectedListeners.forEach((fn) => fn(false));
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function onNotification(fn: (n: Notification) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function onConnectionChange(fn: (v: boolean) => void): () => void {
  connectedListeners.add(fn);
  return () => {
    connectedListeners.delete(fn);
  };
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
