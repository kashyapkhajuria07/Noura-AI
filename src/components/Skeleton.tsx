interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLine({
  width = '100%',
  height = '1rem',
  className = '',
}: SkeletonLineProps) {
  return <div className={`skeleton-pulse ${className}`} style={{ width, height }} />;
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`border-brutal border-ink rounded-brutal p-6 space-y-4 bg-paper ${className}`}>
      <SkeletonLine width="60%" height="1.5rem" />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={`${70 + (i % 3) * 10}%`} height="0.875rem" />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = '2.5rem',
  className = '',
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={`skeleton-pulse rounded-brutal flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-4 pb-2">
        {Array.from({ length: columns }, (_, i) => (
          <SkeletonLine key={i} width={`${100 / columns}%`} height="1rem" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }, (_, j) => (
            <SkeletonLine key={j} width={`${100 / columns}%`} height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
