'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Notification } from './types';
import { onNotification, connectSocket, disconnectSocket } from './client';
import { getDismissedIds, markDismissed } from './store';

interface NotificationContextValue {
  current: Notification | null;
  visible: boolean;
  expanded: boolean;
  history: Notification[];
  show: (n: Notification) => void;
  dismiss: () => void;
  expand: () => void;
  collapse: () => void;
  toggleExpand: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children, studentId }: { children: ReactNode; studentId?: string }) {
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<Notification[]>([]);

  useEffect(() => {
    const socket = connectSocket(studentId);
    return () => { disconnectSocket(); };
  }, [studentId]);

  useEffect(() => {
    const unsub = onNotification((notification: Notification) => {
      const dismissed = getDismissedIds();
      if (dismissed.has(notification.id)) return;
      setCurrent(notification);
      setVisible(true);
      setHistory((prev) => [notification, ...prev].slice(0, 50));
    });
    return unsub;
  }, []);

  const show = useCallback((n: Notification) => {
    setCurrent(n);
    setVisible(true);
    setHistory((prev) => [n, ...prev].slice(0, 50));
  }, []);

  const dismiss = useCallback(() => {
    if (current) {
      markDismissed(current.id);
    }
    setVisible(false);
    setExpanded(false);
    setTimeout(() => setCurrent(null), 300);
  }, [current]);

  const expand = useCallback(() => setExpanded(true), []);
  const collapse = useCallback(() => setExpanded(false), []);
  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  return (
    <NotificationContext.Provider value={{ current, visible, expanded, history, show, dismiss, expand, collapse, toggleExpand }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
