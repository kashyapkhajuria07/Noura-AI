'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTasks } from '@/lib/planner/store';
import type { Task, TaskStatus } from '@/lib/planner/types';
import { TaskCard } from './TaskCard';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

interface TaskBoardProps {
  onAddTask?: () => void;
  onEditTask?: (id: string) => void;
}

export function TaskBoard({ onAddTask, onEditTask }: TaskBoardProps) {
  const { tasks, moveTask, deleteTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = allTasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [allTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;
      const activeId = active.id as string;
      const overId = over.id as string;

      const activeTask = allTasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      let targetStatus: TaskStatus;
      let targetIndex: number | undefined;

      const overTask = allTasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        const colTasks = tasks[targetStatus];
        const overIdx = colTasks.findIndex((t) => t.id === overId);
        targetIndex = overIdx >= 0 ? overIdx : undefined;
      } else {
        targetStatus = overId as TaskStatus;
        targetIndex = undefined;
      }

      if (activeTask.status !== targetStatus || targetIndex !== undefined) {
        moveTask(activeId, targetStatus, targetIndex);
      }
    },
    [allTasks, tasks, moveTask]
  );

  return (
    <div className="space-y-4">
      {onAddTask && (
        <div className="flex justify-end">
          <button
            onClick={onAddTask}
            className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            + New Task
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                <h3 className="font-display text-body font-semibold">{col.label}</h3>
                <span className="font-mono text-caption text-ink-400 bg-ink-100 px-2 py-0.5 rounded-brutal-sm">
                  {tasks[col.id].length}
                </span>
              </div>
              <div className="space-y-3 min-h-[120px]">
                {tasks[col.id].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask ? () => onEditTask(task.id) : undefined}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
                {tasks[col.id].length === 0 && (
                  <div className="border-brutal-sm border-dashed border-ink-200 rounded-brutal-sm p-6 text-center">
                    <p className="font-mono text-caption text-ink-300">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
