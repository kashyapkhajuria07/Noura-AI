'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/lib/planner/types';

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskCard({ task, isDragOverlay, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      };

  const due = new Date(task.dueDate);
  const isOverdue = due < new Date() && task.status !== 'done';
  const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const priorityColor =
    task.priority === 'high'
      ? 'bg-accent'
      : task.priority === 'medium'
        ? 'bg-ink-300'
        : 'bg-ink-200';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-paper border-brutal-sm border-ink rounded-brutal-sm p-3 space-y-2 cursor-grab active:cursor-grabbing transition-colors hover:bg-ink-50 ${isDragOverlay ? 'shadow-brutal-sm rotate-2' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor}`} />
          <p className="font-display text-body-sm font-semibold truncate">{task.title}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task.id);
              }}
              className="font-mono text-caption text-ink-400 hover:text-chrome transition-colors px-1"
              aria-label="Edit task"
            >
              edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="font-mono text-caption text-ink-400 hover:text-accent transition-colors px-1"
              aria-label="Delete task"
            >
              del
            </button>
          )}
        </div>
      </div>

      <p className="font-mono text-caption text-ink-400 truncate">{task.courseName}</p>

      <div className="flex items-center justify-between">
        <span className={`font-mono text-caption ${isOverdue ? 'text-accent' : 'text-ink-500'}`}>
          {isOverdue ? 'Overdue' : `${daysLeft}d left`}
        </span>
        <span className="font-mono text-caption text-ink-400">
          {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
