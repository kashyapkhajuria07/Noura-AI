'use client';

import { type ReactNode } from 'react';
import { NotificationProvider } from '@/lib/notifications/context';
import { Toast } from './Toast';

export function NotificationWrapper({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      {children}
      <Toast />
    </NotificationProvider>
  );
}
