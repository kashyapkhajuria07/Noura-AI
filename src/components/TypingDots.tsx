interface TypingDotsProps {
  className?: string;
}

export function TypingDots({ className = '' }: TypingDotsProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-4 py-3 ${className}`}
      aria-label="Typing indicator"
    >
      <span className="w-2 h-2 bg-ink-400 rounded-full animate-stagger-1" />
      <span className="w-2 h-2 bg-ink-400 rounded-full animate-stagger-2" />
      <span className="w-2 h-2 bg-ink-400 rounded-full animate-stagger-3" />
    </div>
  );
}
