'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink-700 active:bg-ink-800 shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-sm',
  secondary:
    'bg-paper text-ink hover:bg-ink-100 active:bg-ink-200 shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-sm',
  accent:
    'bg-accent text-paper hover:bg-accent-dark active:bg-accent-dark shadow-brutal-accent hover:shadow-brutal-hover active:shadow-brutal-sm',
  ghost:
    'bg-transparent text-ink hover:bg-ink-100 active:bg-ink-200 shadow-none hover:shadow-none',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-body-sm',
  md: 'px-5 py-2.5 text-body',
  lg: 'px-7 py-3.5 text-body-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center font-display font-semibold
          border-brutal border-ink rounded-brutal
          transition-all duration-200 ease-out
          disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:shadow-brutal disabled:active:shadow-brutal
          active:translate-x-0.5 active:translate-y-0.5
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
