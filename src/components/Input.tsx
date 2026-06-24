'use client';

import { forwardRef, useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-display text-body-sm font-semibold"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 font-sans text-body bg-paper
            border-brutal border-ink rounded-brutal
            placeholder:text-ink-400
            transition-all duration-200 ease-out
            focus:outline-none focus:shadow-brutal focus:border-ink
            disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-ink-100
            ${error ? 'border-accent shadow-brutal-accent' : ''}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="font-mono text-caption text-accent">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
