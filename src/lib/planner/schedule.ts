import type { LMSActivity } from '@/lib/lms/types';
import type { Task, ActivityWindow, ScheduledBlock } from './types';

export function analyzeActivityWindows(activities: LMSActivity[]): ActivityWindow[] {
  const hours: ActivityWindow[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  for (const act of activities) {
    const h = new Date(act.timestamp).getHours();
    hours[h].count++;
  }
  return hours;
}

export function generateSchedule(tasks: Task[], windows: ActivityWindow[]): ScheduledBlock[] {
  const totalActivity = windows.reduce((s, w) => s + w.count, 0);

  if (totalActivity === 0) {
    const timeBlocks = [{ start: 10, end: 12 }, { start: 14, end: 16 }];
    const todoTasks = tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return todoTasks.map((task, i) => {
      const block = timeBlocks[i % timeBlocks.length];
      const msUntilDue = new Date(task.dueDate).getTime() - Date.now();
      const daysUntilDue = Math.max(1, Math.ceil(msUntilDue / (1000 * 60 * 60 * 24)));
      const dayOffset = Math.min(daysUntilDue - 1, Math.floor(i * 0.5));
      const day = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      return {
        taskId: task.id,
        day: day.toISOString().split('T')[0],
        startHour: block.start,
        endHour: block.end,
        duration: (block.end - block.start) * 60,
      };
    });
  }

  const sorted = [...windows].sort((a, b) => b.count - a.count);
  const peakHours = sorted.slice(0, 4).map((w) => w.hour).sort((a, b) => a - b);

  const expanded = new Set<number>();
  for (const h of peakHours) {
    expanded.add(h);
    if (h > 0) expanded.add(h - 1);
    if (h < 23) expanded.add(h + 1);
  }
  const uniqueHours = [...expanded].sort((a, b) => a - b);

  const timeBlocks: { start: number; end: number }[] = [];
  if (uniqueHours.length > 0) {
    let blockStart = uniqueHours[0];
    for (let i = 1; i <= uniqueHours.length; i++) {
      if (i === uniqueHours.length || uniqueHours[i] !== uniqueHours[i - 1] + 1) {
        timeBlocks.push({ start: blockStart, end: uniqueHours[i - 1] + 1 });
        blockStart = uniqueHours[i];
      }
    }
  }

  if (timeBlocks.length === 0) {
    timeBlocks.push({ start: 10, end: 12 }, { start: 14, end: 16 });
  }

  const todoTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return todoTasks.map((task, i) => {
    const block = timeBlocks[i % timeBlocks.length];
    const msUntilDue = new Date(task.dueDate).getTime() - Date.now();
    const daysUntilDue = Math.max(1, Math.ceil(msUntilDue / (1000 * 60 * 60 * 24)));
    const dayOffset = Math.min(daysUntilDue - 1, Math.floor(i * 0.5));
    const day = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
    return {
      taskId: task.id,
      day: day.toISOString().split('T')[0],
      startHour: block.start,
      endHour: block.end,
      duration: (block.end - block.start) * 60,
    };
  });
}
