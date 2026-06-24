import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'test', name: 'Test', email: 'test@test.com' } }, status: 'authenticated' }),
  SessionProvider: ({ children }: any) => children,
  signOut: vi.fn(),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
import { Toast } from '../Toast';
import { NotificationProvider, useNotifications } from '@/lib/notifications/context';
import { ChatProvider } from '@/components/chat/ChatWrapper';
import type { Notification } from '@/lib/notifications/types';

beforeEach(() => cleanup());

function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'test-1',
    studentId: 's1',
    type: 'risk_amber',
    title: 'Early risk pattern detected',
    message: "You've been working late—need help?",
    timestamp: new Date().toISOString(),
    actionable: true,
    ...overrides,
  };
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ChatProvider>
  );
}

function renderWithNotification(notification: Notification) {
  function TestHarness() {
    const { show } = useNotifications();
    return (
      <div>
        <button data-testid="show-btn" onClick={() => show(notification)}>
          Show
        </button>
        <Toast />
      </div>
    );
  }

  return render(
    <Wrapper>
      <TestHarness />
    </Wrapper>
  );
}

async function showNotification() {
  fireEvent.click(screen.getByTestId('show-btn'));
  await screen.findByText('Early risk pattern detected');
}

describe('Toast', () => {
  it('renders nothing when no notification', () => {
    const { container } = render(
      <Wrapper>
        <Toast />
      </Wrapper>
    );
    expect(container.innerHTML.replace(/<[^>]+>/g, '').trim()).toBe('');
  });

  it('renders notification title after show', async () => {
    renderWithNotification(createMockNotification());
    await showNotification();
    expect(screen.getByText('Early risk pattern detected')).toBeDefined();
  });

  it('renders notification message', async () => {
    renderWithNotification(createMockNotification());
    await showNotification();
    expect(screen.getByText("You've been working late—need help?")).toBeDefined();
  });

  it('shows dismiss button', async () => {
    renderWithNotification(createMockNotification());
    await showNotification();
    expect(screen.getByText('Dismiss (7d)')).toBeDefined();
  });

  it('shows respond button for actionable notifications', async () => {
    renderWithNotification(createMockNotification());
    await showNotification();
    expect(screen.getByText('Respond')).toBeDefined();
  });

  it('hides respond button for non-actionable', async () => {
    renderWithNotification(createMockNotification({ actionable: false }));
    await showNotification();
    expect(screen.queryByText('Respond')).toBeNull();
  });

  it('opens chat modal after clicking respond', async () => {
    renderWithNotification(createMockNotification());
    await showNotification();
    fireEvent.click(screen.getByText('Respond'));
    expect(await screen.findByText('How can I help?')).toBeDefined();
    expect(screen.getByPlaceholderText('Type your message...')).toBeDefined();
  });

  it('dismisses when clicking dismiss button', async () => {
    renderWithNotification(createMockNotification());
    await showNotification();
    fireEvent.click(screen.getByText('Dismiss (7d)'));
    await new Promise((r) => setTimeout(r, 350));
    expect(screen.queryByText('Early risk pattern detected')).toBeNull();
  });

  it('renders the type label', async () => {
    renderWithNotification(createMockNotification({ type: 'risk_red' }));
    await showNotification();
    expect(screen.getByText('red')).toBeDefined();
  });
});
