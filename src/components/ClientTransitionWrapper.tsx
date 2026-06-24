'use client';

import { PageTransition } from '@/components/PageTransition';

export function ClientTransitionWrapper({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
