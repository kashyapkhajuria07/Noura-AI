'use client';

import { useEffect, useState } from 'react';

export function GridOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'g' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        setVisible((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="grid-overlay"
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent calc(1rem - 1px), rgba(10,10,10,0.08) calc(1rem - 1px), rgba(10,10,10,0.08) 1rem),
          repeating-linear-gradient(90deg, transparent, transparent calc(1rem - 1px), rgba(10,10,10,0.08) calc(1rem - 1px), rgba(10,10,10,0.08) 1rem)
        `,
      }}
      aria-hidden="true"
    />
  );
}
