import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { CalendarView } from '@/components/planner/CalendarView';
import { TaskCard } from '@/components/planner/TaskCard';
import { PomodoroTimer } from '@/components/planner/PomodoroTimer';

const mockTask = {
  id: '1',
  title: 'Math HW',
  courseName: 'Math',
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  priority: 'high' as const,
  status: 'todo' as const,
  createdAt: new Date().toISOString(),
};
const mockTasks = [mockTask];

describe('CalendarView', () => {
  it('renders day headers and month', () => {
    const { container } = render(<CalendarView tasks={mockTasks} />);
    expect(screen.getByText('Sun')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
    expect(container.textContent).toContain(
      new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    );
  });

  it('calls onMonthChange when navigating', () => {
    const onChange = vi.fn();
    render(<CalendarView tasks={mockTasks} onMonthChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons.find((b) => b.textContent?.includes('Prev'));
    expect(prevBtn).toBeDefined();
  });
});

describe('TaskCard', () => {
  it('renders task title and course name', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    expect(container.textContent).toContain('Math HW');
    expect(container.textContent).toContain('Math');
  });

  it('shows days left for future tasks', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    expect(container.textContent).toMatch(/d left/);
  });
});

describe('PomodoroTimer', () => {
  it('renders timer display', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('Focus Session')).toBeDefined();
    expect(screen.getByText('25:00')).toBeDefined();
    expect(screen.getByText('Start')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('renders close button when onClose provided', () => {
    render(<PomodoroTimer onClose={vi.fn()} />);
    expect(screen.getByText('close')).toBeDefined();
  });
});
