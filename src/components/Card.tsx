import { type ReactNode } from 'react';

type CardVariant = 'default' | 'accent' | 'elevated';

interface CardProps {
  title?: string;
  description?: string;
  variant?: CardVariant;
  children?: ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-paper shadow-brutal border-brutal border-ink',
  accent: 'bg-accent text-paper shadow-brutal-accent border-brutal border-accent-dark',
  elevated: 'bg-paper shadow-brutal-hover border-brutal border-ink',
};

export function Card({ title, description, variant = 'default', children, className = '' }: CardProps) {
  return (
    <div
      className={`
        rounded-brutal p-6 space-y-3
        transition-all duration-200 ease-out
        hover:translate-x-0.5 hover:translate-y-0.5
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      {title && (
        <h3 className="font-display text-subheading font-semibold">{title}</h3>
      )}
      {description && (
        <p className="text-body-sm text-inherit opacity-80">{description}</p>
      )}
      {children}
    </div>
  );
}
