'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const WORK = 25 * 60;
const BREAK = 5 * 60;

interface PomodoroTimerProps {
  onClose?: () => void;
}

export function PomodoroTimer({ onClose }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = phase === 'work' ? WORK : BREAK;
  const progress = 1 - secondsLeft / total;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setRunning(false);
            if (phase === 'work') {
              setPhase('break');
              setSecondsLeft(BREAK);
            } else {
              setPhase('work');
              setSecondsLeft(WORK);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, phase, clearTimer]);

  const toggle = () => setRunning((r) => !r);

  const reset = () => {
    clearTimer();
    setRunning(false);
    setPhase('work');
    setSecondsLeft(WORK);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-paper border-brutal border-ink rounded-brutal shadow-brutal p-8 w-full max-w-sm mx-4 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            {phase === 'work' ? 'Focus Session' : 'Break Time'}
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="font-mono text-caption text-ink-400 hover:text-accent transition-colors"
            >
              close
            </button>
          )}
        </div>

        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
              <circle cx="64" cy="64" r="54" fill="none" stroke="#e6e6e6" strokeWidth="6" />
              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="#2563eb"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-display font-bold text-ink">
                {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggle}
            className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-6 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 min-w-[100px]"
          >
            {running ? 'Pause' : secondsLeft === 0 ? 'Next' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="font-mono text-caption text-ink-400 hover:text-accent transition-colors border-b border-transparent hover:border-accent"
          >
            Reset
          </button>
        </div>

        <p className="font-mono text-caption text-ink-400 text-center">
          {phase === 'work' ? '25 min focus' : '5 min break'}
        </p>
      </div>
    </div>
  );
}
