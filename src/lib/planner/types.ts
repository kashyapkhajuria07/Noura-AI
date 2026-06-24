export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  courseName: string;
  courseId: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lmsAssignmentId?: string;
  pointsPossible?: number;
}

export interface ActivityWindow {
  hour: number;
  count: number;
}

export interface ScheduledBlock {
  taskId: string;
  day: string;
  startHour: number;
  endHour: number;
  duration: number;
}
