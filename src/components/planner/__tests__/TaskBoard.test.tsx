import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { TaskProvider, useTasks } from '@/lib/planner/store';
import { TaskBoard } from '../TaskBoard';
import { PomodoroTimer } from '../PomodoroTimer';
import { CalendarView } from '../CalendarView';
import type { Task } from '@/lib/planner/types';

afterEach(cleanup);

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 't1',
    title: overrides.title ?? 'Test Task',
    description: overrides.description ?? '',
    courseName: overrides.courseName ?? 'CS 101',
    courseId: overrides.courseId ?? 'c1',
    dueDate: overrides.dueDate ?? new Date(Date.now() + 86400000).toISOString(),
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    createdAt: new Date().toISOString(),
  };
}

function renderWithProvider(ui: React.ReactElement, initialTasks?: Task[]) {
  return render(
    <TaskProvider initialTasks={initialTasks}>
      {ui}
    </TaskProvider>
  );
}

describe('TaskBoard', () => {
  it('renders three columns', () => {
    renderWithProvider(<TaskBoard />);
    expect(screen.getByText('To Do')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getByText('Done')).toBeDefined();
  });

  it('shows task count per column', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'todo' }),
      makeTask({ id: 't3', status: 'in_progress' }),
    ];
    renderWithProvider(<TaskBoard />, tasks);
    const counts = screen.getAllByText(/^\d+$/).filter((el) => el.tagName === 'SPAN');
    expect(counts).toHaveLength(3);
    expect(counts.map((c) => c.textContent).sort()).toEqual(['0', '1', '2']);
  });

  it('renders task titles', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Homework 4', status: 'todo' }),
      makeTask({ id: 't2', title: 'Final Project', status: 'in_progress' }),
    ];
    renderWithProvider(<TaskBoard />, tasks);
    expect(screen.getByText('Homework 4')).toBeDefined();
    expect(screen.getByText('Final Project')).toBeDefined();
  });

  it('shows drop zones when columns are empty', () => {
    renderWithProvider(<TaskBoard />);
    const dropZones = screen.getAllByText('Drop tasks here');
    expect(dropZones).toHaveLength(3);
  });

  it('renders new task button when onAddTask is provided', () => {
    renderWithProvider(<TaskBoard onAddTask={() => {}} />);
    expect(screen.getByText('+ New Task')).toBeDefined();
  });

  it('shows course name and due date on cards', () => {
    const dueDate = new Date(Date.now() + 2 * 86400000);
    const tasks = [makeTask({ id: 't1', title: 'Essay', courseName: 'ENG 110', dueDate: dueDate.toISOString(), status: 'todo' })];
    renderWithProvider(<TaskBoard />, tasks);
    expect(screen.getByText('ENG 110')).toBeDefined();
    expect(screen.getByText('2d left')).toBeDefined();
  });
});

describe('PomodoroTimer', () => {
  it('renders timer overlay', () => {
    render(<PomodoroTimer onClose={() => {}} />);
    expect(screen.getByText('Focus Session')).toBeDefined();
    expect(screen.getByText('Start')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('shows phase text', () => {
    render(<PomodoroTimer onClose={() => {}} />);
    expect(screen.getByText(/25 min focus|5 min break/)).toBeDefined();
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<PomodoroTimer onClose={onClose} />);
    const backdrop = container.firstElementChild;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});

describe('CalendarView', () => {
  it('renders month header and day labels', () => {
    render(<CalendarView tasks={[]} />);
    expect(screen.getByText('Sun')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Sat')).toBeDefined();
  });

  it('shows navigation buttons', () => {
    render(<CalendarView tasks={[]} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const prevButton = buttons.find((b) => b.textContent?.includes('Prev'));
    const nextButton = buttons.find((b) => b.textContent?.includes('Next'));
    expect(prevButton).toBeDefined();
    expect(nextButton).toBeDefined();
  });

  it('renders tasks on correct dates', () => {
    const dueDate = new Date();
    dueDate.setHours(12, 0, 0, 0);
    const tasks = [makeTask({ id: 't1', title: 'Quiz', dueDate: dueDate.toISOString() })];
    render(<CalendarView tasks={tasks} />);
    expect(screen.getByText('Quiz')).toBeDefined();
  });

  it('renders schedule blocks', () => {
    const tasks = [makeTask({ id: 't1', title: 'Study', dueDate: new Date().toISOString() })];
    const schedule = [{ taskId: 't1', day: new Date().toISOString().split('T')[0], startHour: 10, endHour: 12, duration: 120 }];
    render(<CalendarView tasks={tasks} schedule={schedule} />);
    expect(screen.getByText('10:00-12:00')).toBeDefined();
  });
});
