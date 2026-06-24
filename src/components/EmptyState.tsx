import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: 'data' | 'search' | 'message' | 'schedule' | 'privacy';
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const ICONS: Record<string, ReactNode> = {
  data: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-16 h-16 text-ink-300"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="6" y="10" width="36" height="28" rx="2" />
      <line x1="6" y1="20" x2="42" y2="20" />
      <line x1="22" y1="20" x2="22" y2="38" />
      <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  search: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-16 h-16 text-ink-300"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="20" cy="20" r="10" />
      <line x1="27" y1="27" x2="36" y2="36" />
      <line x1="16" y1="20" x2="24" y2="20" strokeDasharray="2 2" />
    </svg>
  ),
  message: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-16 h-16 text-ink-300"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="6" y="10" width="36" height="26" rx="2" />
      <polyline points="6,14 24,28 42,14" />
      <line x1="14" y1="26" x2="10" y2="30" />
      <line x1="34" y1="26" x2="38" y2="30" />
    </svg>
  ),
  schedule: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-16 h-16 text-ink-300"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="6" y="8" width="36" height="34" rx="2" />
      <line x1="6" y1="18" x2="42" y2="18" />
      <line x1="16" y1="8" x2="16" y2="18" />
      <line x1="32" y1="8" x2="32" y2="18" />
      <line x1="12" y1="26" x2="22" y2="26" />
      <line x1="12" y1="32" x2="30" y2="32" />
      <circle cx="34" cy="34" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  privacy: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-16 h-16 text-ink-300"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="10" y="18" width="28" height="24" rx="2" />
      <path d="M14 18V14a10 10 0 0 1 20 0v4" />
      <circle cx="24" cy="30" r="3" />
      <line x1="24" y1="30" x2="24" y2="26" />
    </svg>
  ),
};

export function EmptyState({
  icon = 'data',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 animate-fade-in ${className}`}
    >
      <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 bg-ink-50">
        {ICONS[icon] ?? ICONS.data}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-display text-body font-semibold">{title}</h3>
        {description && (
          <p className="font-mono text-caption text-ink-400 italic leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
