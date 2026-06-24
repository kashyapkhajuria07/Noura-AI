import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { MoodChart } from '@/components/reflection/MoodChart';
import { MoodTracker } from '@/components/reflection/MoodTracker';
import { JournalForm } from '@/components/reflection/JournalForm';

const mockEntries = [
  { id: '1', mood: 4 as const, note: 'feeling good', timestamp: new Date().toISOString() },
  {
    id: '2',
    mood: 2 as const,
    note: 'tired',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockJournalEntries = [
  {
    id: 'j1',
    promptId: 'p1',
    promptText: 'How was your day?',
    content: 'Good day',
    mood: 4 as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPrompts = [
  { id: 'p1', category: 'gratitude' as const, text: 'How was your day?', icon: '🌟' },
];

describe('MoodChart', () => {
  it('renders chart with data', () => {
    const { container } = render(<MoodChart entries={mockEntries} />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('shows empty state when no data', () => {
    render(<MoodChart entries={[]} />);
    expect(screen.getByText(/Not enough data/)).toBeDefined();
  });
});

describe('MoodTracker', () => {
  it('renders mood buttons', () => {
    render(<MoodTracker entries={[]} onAddMood={vi.fn()} onDeleteMood={vi.fn()} />);
    expect(screen.getByText('Neutral')).toBeDefined();
    expect(screen.getByText('Energized')).toBeDefined();
  });

  it('shows textarea after selecting mood', () => {
    render(<MoodTracker entries={[]} onAddMood={vi.fn()} onDeleteMood={vi.fn()} />);
    fireEvent.click(screen.getByText('Energized'));
    expect(screen.getByPlaceholderText('Add a note (optional)...')).toBeDefined();
    expect(screen.getByText('Log Mood')).toBeDefined();
  });

  it('shows empty message when no entries', () => {
    const { container } = render(
      <MoodTracker entries={[]} onAddMood={vi.fn()} onDeleteMood={vi.fn()} />
    );
    expect(container.textContent).toContain('No moods logged yet.');
  });
});

describe('JournalForm', () => {
  it('renders prompt selector for new entry', () => {
    render(
      <JournalForm
        prompts={mockPrompts}
        entries={mockJournalEntries}
        selectedEntry={null}
        onSelectEntry={vi.fn()}
        onCreateEntry={vi.fn()}
        onUpdateEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );
    expect(screen.getByText('Choose a prompt...')).toBeDefined();
    expect(screen.getByText('Start')).toBeDefined();
  });

  it('shows recent entries', () => {
    const { container } = render(
      <JournalForm
        prompts={mockPrompts}
        entries={mockJournalEntries}
        selectedEntry={null}
        onSelectEntry={vi.fn()}
        onCreateEntry={vi.fn()}
        onUpdateEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );
    expect(container.textContent).toContain('How was your day?');
  });
});
