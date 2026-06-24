import { describe, it, expect } from 'vitest';
import { analyzeActivityWindows, generateSchedule } from '../schedule';
import type { LMSActivity } from '@/lib/lms/types';
import type { Task } from '../types';

function makeActivity(hour: number): LMSActivity {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return {
    id: `act-${hour}`,
    type: 'course_access',
    title: 'Activity',
    description: '',
    courseId: 'c1',
    courseName: 'Test',
    timestamp: d.toISOString(),
    metadata: {},
  };
}

function makeTask(id: string, daysUntilDue: number, status: Task['status'] = 'todo'): Task {
  const d = new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000);
  return {
    id,
    title: `Task ${id}`,
    description: '',
    courseName: 'Test Course',
    courseId: 'c1',
    dueDate: d.toISOString(),
    status,
    priority: 'medium',
    createdAt: new Date().toISOString(),
  };
}

describe('analyzeActivityWindows', () => {
  it('returns 24-hour array with counts', () => {
    const activities = [makeActivity(10), makeActivity(10), makeActivity(14)];
    const windows = analyzeActivityWindows(activities);
    expect(windows).toHaveLength(24);
    expect(windows[10].count).toBe(2);
    expect(windows[14].count).toBe(1);
    expect(windows[0].count).toBe(0);
  });

  it('handles empty activities', () => {
    const windows = analyzeActivityWindows([]);
    expect(windows).toHaveLength(24);
    expect(windows.every((w) => w.count === 0)).toBe(true);
  });

  it('handles activities across all hours', () => {
    const activities = Array.from({ length: 24 }, (_, i) => makeActivity(i));
    const windows = analyzeActivityWindows(activities);
    expect(windows.every((w) => w.count === 1)).toBe(true);
  });
});

describe('generateSchedule', () => {
  it('returns scheduled blocks for todo tasks', () => {
    const tasks = [makeTask('t1', 3), makeTask('t2', 5)];
    const windows = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: i === 10 ? 5 : 0 }));
    const schedule = generateSchedule(tasks, windows);
    expect(schedule).toHaveLength(2);
    expect(schedule[0].taskId).toBe('t1');
    expect(schedule[0].duration).toBeGreaterThan(0);
  });

  it('uses default blocks when no activity data', () => {
    const tasks = [makeTask('t1', 3)];
    const windows = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    const schedule = generateSchedule(tasks, windows);
    expect(schedule).toHaveLength(1);
    expect(schedule[0].startHour).toBeGreaterThanOrEqual(10);
  });

  it('assigns earlier tasks to earlier days', () => {
    const tasks = [
      makeTask('early', 1),
      makeTask('late', 10),
    ];
    const windows = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: i === 14 ? 5 : 0 }));
    const schedule = generateSchedule(tasks, windows);
    expect(schedule).toHaveLength(2);
    expect(new Date(schedule[0].day).getTime()).toBeLessThanOrEqual(new Date(schedule[1].day).getTime());
  });

  it('excludes done tasks from schedule', () => {
    const tasks = [
      makeTask('todo1', 3),
      makeTask('done1', 2, 'done'),
    ];
    const windows = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    const schedule = generateSchedule(tasks, windows);
    expect(schedule).toHaveLength(1);
    expect(schedule[0].taskId).toBe('todo1');
  });

  it('returns empty for no tasks', () => {
    const schedule = generateSchedule([], Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })));
    expect(schedule).toHaveLength(0);
  });
});
