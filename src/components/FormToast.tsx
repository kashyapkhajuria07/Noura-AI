'use client';

import { useState, useEffect, useCallback } from 'react';

interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function showFormToast(type: 'success' | 'error', message: string) {
  addToastFn?.({ type, message });
}

export function FormToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...t, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <div
        className="fixed top-4 right-4 z-[80] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border-brutal-sm rounded-brutal-sm px-4 py-3 shadow-brutal-sm flex items-center gap-3 max-w-sm animate-toast-in ${
              toast.type === 'success'
                ? 'bg-paper border-chrome text-ink'
                : 'bg-paper border-accent text-ink'
            }`}
          >
            <div
              className={`w-2 h-full min-h-[1.5rem] flex-shrink-0 rounded-brutal-sm ${
                toast.type === 'success' ? 'bg-chrome' : 'bg-accent'
              }`}
            />
            <p className="font-mono text-body-sm flex-1">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
              className="font-mono text-caption text-ink-300 hover:text-ink transition-colors flex-shrink-0"
            >
              &#10005;
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
