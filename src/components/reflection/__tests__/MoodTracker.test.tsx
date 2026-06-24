import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MoodTracker } from '../MoodTracker';
import { MoodChart } from '../MoodChart';
import type { MoodEntry } from '@/lib/reflection/types';

afterEach(cleanup);

const mockEntries: MoodEntry[] = [
  {
    id: 'm1',
    mood: 5,
    note: 'Great day',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'm2',
    mood: 2,
    note: 'Tired',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

describe('MoodTracker', () => {
  it('renders all five mood options', () => {
    render(<MoodTracker entries={[]} onAddMood={() => {}} onDeleteMood={() => {}} />);
    expect(screen.getByText('Exhausted')).toBeDefined();
    expect(screen.getByText('Drained')).toBeDefined();
    expect(screen.getByText('Neutral')).toBeDefined();
    expect(screen.getByText('Good')).toBeDefined();
    expect(screen.getByText('Energized')).toBeDefined();
  });

  it('shows note input after selecting a mood', () => {
    render(<MoodTracker entries={[]} onAddMood={() => {}} onDeleteMood={() => {}} />);
    fireEvent.click(screen.getByText('Good'));
    expect(screen.getByPlaceholderText('Add a note (optional)...')).toBeDefined();
    expect(screen.getByText('Log Mood')).toBeDefined();
  });

  it('calls onAddMood when logging', () => {
    const onAdd = vi.fn();
    render(<MoodTracker entries={[]} onAddMood={onAdd} onDeleteMood={() => {}} />);
    fireEvent.click(screen.getByText('Good'));
    fireEvent.click(screen.getByText('Log Mood'));
    expect(onAdd).toHaveBeenCalledWith(4, '');
  });

  it('renders recent mood entries', () => {
    render(<MoodTracker entries={mockEntries} onAddMood={() => {}} onDeleteMood={() => {}} />);
    expect(screen.getByText('Great day')).toBeDefined();
    expect(screen.getByText('Tired')).toBeDefined();
  });

  it('calls onDeleteMood when clicking del', () => {
    const onDelete = vi.fn();
    render(<MoodTracker entries={mockEntries} onAddMood={() => {}} onDeleteMood={onDelete} />);
    const delButtons = screen.getAllByText('del');
    fireEvent.click(delButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('m1');
  });
});

describe('MoodChart', () => {
  it('shows empty state when no entries', () => {
    render(<MoodChart entries={[]} />);
    expect(screen.getByText(/Not enough data/)).toBeDefined();
  });

  it('renders chart title with entries', () => {
    render(<MoodChart entries={mockEntries} />);
    expect(screen.getByText(/Mood Trend/)).toBeDefined();
  });

  it('handles single entry', () => {
    render(<MoodChart entries={[mockEntries[0]]} />);
    expect(screen.getByText(/Mood Trend/)).toBeDefined();
  });

  it('renders with many entries', () => {
    const many: MoodEntry[] = Array.from({ length: 60 }, (_, i) => ({
      id: `m${i}`,
      mood: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      note: '',
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    render(<MoodChart entries={many} />);
    expect(screen.getByText(/Mood Trend/)).toBeDefined();
  });
});
