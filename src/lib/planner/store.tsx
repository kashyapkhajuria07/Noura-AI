'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Task, TaskStatus } from './types';

export interface TaskState {
  tasks: Record<TaskStatus, Task[]>;
}

export type TaskAction =
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; updates: Partial<Task> }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'MOVE_TASK'; id: string; status: TaskStatus; index?: number }
  | { type: 'REORDER'; status: TaskStatus; ids: string[] };

export function buildStatusMap(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const t of tasks) {
    if (map[t.status]) map[t.status].push(t);
  }
  return map;
}

export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { tasks: buildStatusMap(action.tasks) };
    case 'ADD_TASK':
      return {
        tasks: {
          ...state.tasks,
          [action.task.status]: [...state.tasks[action.task.status], action.task],
        },
      };
    case 'UPDATE_TASK': {
      const updated = { ...state.tasks };
      for (const s of Object.keys(updated) as TaskStatus[]) {
        updated[s] = updated[s].map((t) => (t.id === action.id ? { ...t, ...action.updates } : t));
      }
      return { tasks: updated };
    }
    case 'DELETE_TASK': {
      const updated = { ...state.tasks };
      for (const s of Object.keys(updated) as TaskStatus[]) {
        updated[s] = updated[s].filter((t) => t.id !== action.id);
      }
      return { tasks: updated };
    }
    case 'MOVE_TASK': {
      let moved: Task | undefined;
      const updated = { ...state.tasks };
      for (const s of Object.keys(updated) as TaskStatus[]) {
        const idx = updated[s].findIndex((t) => t.id === action.id);
        if (idx !== -1) {
          moved = { ...updated[s][idx], status: action.status };
          updated[s] = [...updated[s].slice(0, idx), ...updated[s].slice(idx + 1)];
          break;
        }
      }
      if (!moved) return state;
      const target = [...updated[action.status]];
      if (action.index !== undefined) {
        target.splice(action.index, 0, moved);
      } else {
        target.push(moved);
      }
      updated[action.status] = target;
      return { tasks: updated };
    }
    case 'REORDER': {
      const idSet = new Set(action.ids);
      const remaining = state.tasks[action.status].filter((t) => !idSet.has(t.id));
      const reordered = action.ids
        .map((id) => state.tasks[action.status].find((t) => t.id === id))
        .filter(Boolean) as Task[];
      return {
        tasks: { ...state.tasks, [action.status]: [...remaining, ...reordered] },
      };
    }
    default:
      return state;
  }
}

interface TaskContextValue {
  tasks: Record<TaskStatus, Task[]>;
  dispatch: React.Dispatch<TaskAction>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus, index?: number) => void;
  reorder: (status: TaskStatus, ids: string[]) => void;
  syncFromLMS: (
    assignments: {
      id: string;
      title: string;
      courseName: string;
      courseId: string;
      dueDate: string;
      pointsPossible?: number;
      description?: string;
    }[]
  ) => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

let _counter = 0;
function uid() {
  return `task-${Date.now()}-${++_counter}`;
}

export function TaskProvider({
  children,
  initialTasks = [],
}: {
  children: ReactNode;
  initialTasks?: Task[];
}) {
  const [state, dispatch] = useReducer(taskReducer, { tasks: buildStatusMap(initialTasks) });

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    dispatch({
      type: 'ADD_TASK',
      task: { ...task, id: uid(), createdAt: new Date().toISOString() },
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', id, updates });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', id });
  };

  const moveTask = (id: string, status: TaskStatus, index?: number) => {
    dispatch({ type: 'MOVE_TASK', id, status, index });
  };

  const reorder = (status: TaskStatus, ids: string[]) => {
    dispatch({ type: 'REORDER', status, ids });
  };

  const syncFromLMS = (
    assignments: {
      id: string;
      title: string;
      courseName: string;
      courseId: string;
      dueDate: string;
      pointsPossible?: number;
      description?: string;
    }[]
  ) => {
    const existing = new Set<string>();
    for (const list of Object.values(state.tasks)) {
      for (const t of list) {
        if (t.lmsAssignmentId) existing.add(t.lmsAssignmentId);
      }
    }
    const newTasks: Task[] = [];
    for (const a of assignments) {
      if (existing.has(a.id)) continue;
      newTasks.push({
        id: uid(),
        title: a.title,
        description: a.description ?? '',
        courseName: a.courseName,
        courseId: a.courseId,
        dueDate: a.dueDate,
        status: 'todo',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        lmsAssignmentId: a.id,
        pointsPossible: a.pointsPossible,
      });
    }
    if (newTasks.length > 0) {
      dispatch({ type: 'SET_TASKS', tasks: [...Object.values(state.tasks).flat(), ...newTasks] });
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        dispatch,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        reorder,
        syncFromLMS,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
