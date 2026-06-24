'use client';

import { useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<'enter' | 'exit'>('enter');
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;

    setStage('exit');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setStage('enter');
      prevPath.current = pathname;
    }, 250);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div
      className={`transition-all duration-250 ease-out ${
        stage === 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{ transitionDuration: '250ms' }}
    >
      {displayChildren}
    </div>
  );
}
