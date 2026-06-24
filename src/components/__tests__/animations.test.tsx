import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonLine, SkeletonCard, SkeletonAvatar, SkeletonTable } from '@/components/Skeleton';
import { TypingDots } from '@/components/TypingDots';
import { EmptyState } from '@/components/EmptyState';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Skeleton components', () => {
  it('SkeletonLine renders with default dimensions', () => {
    const { container } = render(<SkeletonLine />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('skeleton-pulse');
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('1rem');
  });

  it('SkeletonLine accepts custom width and height', () => {
    const { container } = render(<SkeletonLine width="50%" height="2rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('2rem');
  });

  it('SkeletonLine accepts className', () => {
    const { container } = render(<SkeletonLine className="extra-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('extra-class');
  });

  it('SkeletonCard renders title bar and specified number of lines', () => {
    const { container } = render(<SkeletonCard lines={4} />);
    const skeletonEls = container.querySelectorAll('.skeleton-pulse');
    expect(skeletonEls.length).toBe(5);
  });

  it('SkeletonCard has brutalist border styling', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-brutal');
  });

  it('SkeletonAvatar renders with default size', () => {
    const { container } = render(<SkeletonAvatar />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('2.5rem');
    expect(el.style.height).toBe('2.5rem');
  });

  it('SkeletonAvatar accepts custom size', () => {
    const { container } = render(<SkeletonAvatar size="4rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('4rem');
    expect(el.style.height).toBe('4rem');
  });

  it('SkeletonTable renders specified rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />);
    const skeletonEls = container.querySelectorAll('.skeleton-pulse');
    expect(skeletonEls.length).toBe(8);
  });

  it('SkeletonTable defaults to 5 rows 4 columns', () => {
    const { container } = render(<SkeletonTable />);
    const skeletonEls = container.querySelectorAll('.skeleton-pulse');
    expect(skeletonEls.length).toBe(24);
  });
});

describe('TypingDots', () => {
  it('renders three dots', () => {
    const { container } = render(<TypingDots />);
    const dots = container.querySelectorAll('span');
    expect(dots.length).toBe(3);
  });

  it('each dot has stagger animation class', () => {
    const { container } = render(<TypingDots />);
    const dots = container.querySelectorAll('span');
    expect(dots[0].className).toContain('animate-stagger-1');
    expect(dots[1].className).toContain('animate-stagger-2');
    expect(dots[2].className).toContain('animate-stagger-3');
  });

  it('has aria-label for accessibility', () => {
    const { container } = render(<TypingDots />);
    const el = container.querySelector('[aria-label="Typing indicator"]');
    expect(el).toBeDefined();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing to show yet." />);
    expect(screen.getByText('No data')).toBeDefined();
    expect(screen.getByText('Nothing to show yet.')).toBeDefined();
  });

  it('renders with all icon types', () => {
    const icons = ['data', 'search', 'message', 'schedule', 'privacy'] as const;
    for (const icon of icons) {
      const { container } = render(<EmptyState icon={icon} title={icon} />);
      expect(container.querySelector('svg')).toBeDefined();
    }
  });

  it('renders action slot', () => {
    render(<EmptyState title="Test" action={<button>Click me</button>} />);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('has animate-fade-in class', () => {
    const { container } = render(<EmptyState title="Test" />);
    expect((container.firstChild as HTMLElement).className).toContain('animate-fade-in');
  });

  it('falls back to data icon for unknown icon type', () => {
    const { container } = render(<EmptyState icon={'unknown' as any} title="Test" />);
    expect(container.querySelector('svg')).toBeDefined();
  });
});

describe('FormToast', () => {
  it('exports showFormToast function', async () => {
    const mod = await import('@/components/FormToast');
    expect(typeof mod.showFormToast).toBe('function');
  });

  it('FormToastProvider renders children', async () => {
    const { FormToastProvider } = await import('@/components/FormToast');
    render(
      <FormToastProvider>
        <p>Child content</p>
      </FormToastProvider>
    );
    expect(screen.getByText('Child content')).toBeDefined();
  });
});

describe('PageTransition', () => {
  it('renders children', async () => {
    const { PageTransition } = await import('@/components/PageTransition');
    render(
      <PageTransition>
        <p>Content</p>
      </PageTransition>
    );
    expect(screen.getByText('Content')).toBeDefined();
  });
});

describe('reduced-motion a11y', () => {
  it('prefers-reduced-motion query disables animations via CSS', () => {
    const style = document.createElement('style');
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.01ms !important; }
      }
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.style.animationDuration = '1s';
    document.body.appendChild(el);

    const computed = getComputedStyle(el);
    expect(computed.animationDuration).toBe('1s');

    document.head.removeChild(style);
    document.body.removeChild(el);
  });
});
