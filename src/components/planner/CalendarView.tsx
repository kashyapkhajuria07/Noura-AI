'use client';

import { useState, useCallback } from 'react';
import type { Task, ScheduledBlock } from '@/lib/planner/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarViewProps {
  tasks: Task[];
  schedule?: ScheduledBlock[];
  onMonthChange?: (month: number, year: number) => void;
}

export function CalendarView({ tasks, schedule, onMonthChange }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const goToPrev = useCallback(() => {
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    setCurrentMonth(m);
    setCurrentYear(y);
    onMonthChange?.(m, y);
  }, [currentMonth, currentYear, onMonthChange]);

  const goToNext = useCallback(() => {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    setCurrentMonth(m);
    setCurrentYear(y);
    onMonthChange?.(m, y);
  }, [currentMonth, currentYear, onMonthChange]);

  const taskMap = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = new Date(t.dueDate).toISOString().split('T')[0];
    if (!taskMap.has(key)) taskMap.set(key, []);
    taskMap.get(key)!.push(t);
  }

  const scheduleMap = new Map<string, ScheduledBlock[]>();
  if (schedule) {
    for (const s of schedule) {
      if (!scheduleMap.has(s.day)) scheduleMap.set(s.day, []);
      scheduleMap.get(s.day)!.push(s);
    }
  }

  const cells: { day: number | null; dateStr: string; isToday: boolean; isPast: boolean }[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ day: null, dateStr: '', isToday: false, isPast: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const date = new Date(currentYear, currentMonth, d);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cells.push({ day: d, dateStr, isToday, isPast });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          className="font-mono text-body-sm text-ink-400 hover:text-ink transition-colors border-b border-transparent hover:border-ink"
        >
          {'\u2190'} Prev
        </button>
        <h3 className="font-display text-subheading font-semibold">
          {firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={goToNext}
          className="font-mono text-body-sm text-ink-400 hover:text-ink transition-colors border-b border-transparent hover:border-ink"
        >
          Next {'\u2192'}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-ink-200 border-brutal-sm border-ink rounded-brutal-sm overflow-hidden">
        {DAYS.map((d) => (
          <div key={d} className="bg-paper px-2 py-2 text-center">
            <span className="font-mono text-caption text-ink-400 italic">{d}</span>
          </div>
        ))}

        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={`empty-${i}`} className="bg-ink-50 p-2 min-h-[80px]" />;
          }

          const dayTasks = taskMap.get(cell.dateStr) ?? [];
          const daySchedule = scheduleMap.get(cell.dateStr) ?? [];

          return (
            <div
              key={cell.dateStr}
              className={`bg-paper p-2 min-h-[80px] space-y-1 transition-colors ${
                cell.isToday ? 'bg-chrome/5' : ''
              } ${cell.isPast ? 'opacity-50' : ''}`}
            >
              <span
                className={`font-mono text-caption ${
                  cell.isToday ? 'text-chrome font-bold not-italic' : 'text-ink-500 italic'
                }`}
              >
                {cell.day}
              </span>
              {dayTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      t.priority === 'high'
                        ? 'bg-accent'
                        : t.priority === 'medium'
                          ? 'bg-ink-300'
                          : 'bg-ink-200'
                    }`}
                  />
                  <span className="font-mono text-[10px] text-ink-600 truncate">{t.title}</span>
                </div>
              ))}
              {daySchedule.map((s, si) => (
                <div key={`sched-${si}`} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-chrome" />
                  <span className="font-mono text-[10px] text-chrome truncate">
                    {s.startHour}:00-{s.endHour}:00
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
