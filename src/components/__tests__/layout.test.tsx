import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageTransition } from '@/components/PageTransition';
import { FormToastProvider, showFormToast } from '@/components/FormToast';
import { NotificationWrapper } from '@/components/notifications/NotificationWrapper';

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
}));

vi.mock('@/lib/notifications/context', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/notifications/Toast', () => ({
  Toast: () => <div data-testid="toast">Toast</div>,
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('renders fallback when provided', () => {
    const Fallback = () => <p>Custom fallback</p>;
    const Throw = () => {
      throw new Error('boom');
    };
    render(
      <ErrorBoundary fallback={<Fallback />}>
        <Throw />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeDefined();
  });

  it('renders error UI when child throws', () => {
    const Throw = () => {
      throw new Error('Test error');
    };
    render(
      <ErrorBoundary>
        <Throw />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Go to Dashboard')).toBeDefined();
    expect(screen.getByText('Reload Page')).toBeDefined();
  });
});

describe('PageTransition', () => {
  it('renders children', () => {
    render(
      <PageTransition>
        <p>Transition content</p>
      </PageTransition>
    );
    expect(screen.getByText('Transition content')).toBeDefined();
  });
});

describe('FormToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders children', () => {
    render(
      <FormToastProvider>
        <p>Form content</p>
      </FormToastProvider>
    );
    expect(screen.getByText('Form content')).toBeDefined();
  });

  it('shows toast when showFormToast is called', () => {
    render(
      <FormToastProvider>
        <p>Content</p>
      </FormToastProvider>
    );
    act(() => {
      showFormToast('success', 'Saved!');
    });
    expect(screen.getByText('Saved!')).toBeDefined();
  });

  it('auto-dismisses toast after 4 seconds', () => {
    render(
      <FormToastProvider>
        <p>Content</p>
      </FormToastProvider>
    );
    act(() => {
      showFormToast('error', 'Failed!');
    });
    expect(screen.getByText('Failed!')).toBeDefined();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Failed!')).toBeNull();
  });
});

describe('NotificationWrapper', () => {
  it('renders children and toast', () => {
    render(
      <NotificationWrapper>
        <p>Notified</p>
      </NotificationWrapper>
    );
    expect(screen.getByText('Notified')).toBeDefined();
    expect(screen.getByTestId('toast')).toBeDefined();
  });
});
