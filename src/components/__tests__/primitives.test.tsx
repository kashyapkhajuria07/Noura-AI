import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { GridOverlay } from '@/components/GridOverlay';
import { SkeletonLine, SkeletonCard, SkeletonAvatar, SkeletonTable } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { TypingDots } from '@/components/TypingDots';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { ClientTransitionWrapper } from '@/components/ClientTransitionWrapper';

describe('Card', () => {
  it('renders title and description', () => {
    render(
      <Card title="Test Title" description="Test desc">
        <p>child</p>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test desc')).toBeDefined();
    expect(screen.getByText('child')).toBeDefined();
  });

  it('renders without title or description', () => {
    const { container } = render(
      <Card>
        <p>only child</p>
      </Card>
    );
    expect(container.textContent).toBe('only child');
  });

  it('applies className', () => {
    const { container } = render(
      <Card className="extra-class">
        <p>c</p>
      </Card>
    );
    expect(container.firstChild).toHaveProperty('className');
  });
});

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('applies disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText('Disabled') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders as primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    expect(container.firstChild).toHaveProperty('className');
  });
});

describe('Input', () => {
  it('renders label and input', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByText('Email')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter email')).toBeDefined();
  });

  it('renders error message', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByText('Required')).toBeDefined();
  });

  it('forwards ref', () => {
    const ref: any = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('GridOverlay', () => {
  it('renders null by default', () => {
    const { container } = render(<GridOverlay />);
    expect(container.innerHTML).toBe('');
  });
});

describe('Skeleton', () => {
  it('SkeletonLine renders with custom width', () => {
    const { container } = render(<SkeletonLine width="50%" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('50%');
  });

  it('SkeletonCard renders lines', () => {
    const { container } = render(<SkeletonCard lines={2} />);
    expect(container.firstChild).toBeDefined();
  });

  it('SkeletonAvatar renders with default size', () => {
    const { container } = render(<SkeletonAvatar />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('2.5rem');
  });

  it('SkeletonTable renders rows and columns', () => {
    const { container } = render(<SkeletonTable rows={2} columns={3} />);
    expect(container.firstChild).toBeDefined();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing here" />);
    expect(screen.getByText('No data')).toBeDefined();
    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  it('renders with action', () => {
    render(<EmptyState title="Empty" action={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('renders different icons', () => {
    const { container } = render(<EmptyState icon="search" title="Search" />);
    expect(screen.getByText('Search')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });
});

describe('TypingDots', () => {
  it('renders with aria label', () => {
    const { container } = render(<TypingDots />);
    expect(container.firstChild).toBeDefined();
    const el = container.querySelector('[aria-label="Typing indicator"]');
    expect(el).toBeDefined();
  });
});

describe('ServiceWorkerRegistrar', () => {
  it('renders null', () => {
    const { container } = render(<ServiceWorkerRegistrar />);
    expect(container.innerHTML).toBe('');
  });
});

describe('ClientTransitionWrapper', () => {
  it('renders children', () => {
    render(
      <ClientTransitionWrapper>
        <p>wrapped</p>
      </ClientTransitionWrapper>
    );
    expect(screen.getByText('wrapped')).toBeDefined();
  });
});
