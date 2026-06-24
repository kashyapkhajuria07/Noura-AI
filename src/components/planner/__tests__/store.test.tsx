import { describe, it, expect } from 'vitest';
import { taskReducer, buildStatusMap } from '@/lib/planner/store';
import type { TaskAction } from '@/lib/planner/store';
import type { Task } from '@/lib/planner/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: overrides.id ?? `task-${now}`,
    title: overrides.title ?? 'Test Task',
    description: overrides.description ?? '',
    courseName: overrides.courseName ?? 'Course',
    courseId: overrides.courseId ?? 'c1',
    dueDate: overrides.dueDate ?? new Date(now + 86400000).toISOString(),
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    lmsAssignmentId: overrides.lmsAssignmentId,
    pointsPossible: overrides.pointsPossible,
  };
}

function initState(tasks: Task[]) {
  return { tasks: buildStatusMap(tasks) };
}

function dispatch(state: ReturnType<typeof initState>, action: TaskAction) {
  return taskReducer(state, action);
}

describe('taskReducer', () => {
  it('SET_TASKS builds status map', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'in_progress' }),
      makeTask({ id: 't3', status: 'done' }),
    ];
    const state = dispatch(initState([]), { type: 'SET_TASKS', tasks });
    expect(state.tasks.todo).toHaveLength(1);
    expect(state.tasks.todo[0].id).toBe('t1');
    expect(state.tasks.in_progress).toHaveLength(1);
    expect(state.tasks.in_progress[0].id).toBe('t2');
    expect(state.tasks.done).toHaveLength(1);
    expect(state.tasks.done[0].id).toBe('t3');
  });

  it('ADD_TASK adds to correct column', () => {
    const task = makeTask({ id: 'new1', status: 'in_progress' });
    const state = dispatch(initState([]), { type: 'ADD_TASK', task });
    expect(state.tasks.in_progress).toHaveLength(1);
    expect(state.tasks.todo).toHaveLength(0);
  });

  it('UPDATE_TASK modifies fields across all columns', () => {
    const state0 = initState([makeTask({ id: 't1', status: 'todo', title: 'Old' })]);
    const state = dispatch(state0, {
      type: 'UPDATE_TASK',
      id: 't1',
      updates: { title: 'New', priority: 'high' },
    });
    expect(state.tasks.todo[0].title).toBe('New');
    expect(state.tasks.todo[0].priority).toBe('high');
  });

  it('DELETE_TASK removes from all columns', () => {
    const state0 = initState([makeTask({ id: 't1', status: 'todo' })]);
    const state = dispatch(state0, { type: 'DELETE_TASK', id: 't1' });
    expect(state.tasks.todo).toHaveLength(0);
  });

  it('MOVE_TASK moves between columns', () => {
    const state0 = initState([makeTask({ id: 't1', status: 'todo' })]);
    const state = dispatch(state0, { type: 'MOVE_TASK', id: 't1', status: 'done' });
    expect(state.tasks.todo).toHaveLength(0);
    expect(state.tasks.done).toHaveLength(1);
    expect(state.tasks.done[0].id).toBe('t1');
    expect(state.tasks.done[0].status).toBe('done');
  });

  it('MOVE_TASK with index inserts at position', () => {
    const state0 = initState([
      makeTask({ id: 'a', status: 'todo' }),
      makeTask({ id: 'b', status: 'todo' }),
    ]);
    const state = dispatch(state0, { type: 'MOVE_TASK', id: 'b', status: 'todo', index: 0 });
    expect(state.tasks.todo[0].id).toBe('b');
    expect(state.tasks.todo[1].id).toBe('a');
  });

  it('MOVE_TASK returns state unchanged if task not found', () => {
    const state0 = initState([makeTask({ id: 't1', status: 'todo' })]);
    const state = dispatch(state0, { type: 'MOVE_TASK', id: 'nonexistent', status: 'done' });
    expect(state).toBe(state0);
  });

  it('REORDER reorders items in a column', () => {
    const state0 = initState([
      makeTask({ id: 'a', status: 'todo' }),
      makeTask({ id: 'b', status: 'todo' }),
      makeTask({ id: 'c', status: 'todo' }),
    ]);
    const state = dispatch(state0, { type: 'REORDER', status: 'todo', ids: ['c', 'a'] });
    expect(state.tasks.todo[0].id).toBe('b');
    expect(state.tasks.todo[1].id).toBe('c');
    expect(state.tasks.todo[2].id).toBe('a');
  });

  it('unknown action returns state unchanged', () => {
    const state0 = initState([makeTask({ id: 't1' })]);
    const state = dispatch(state0, { type: 'UNKNOWN' as any });
    expect(state).toBe(state0);
  });
});
