'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    router.push(session ? '/dashboard' : '/auth/login');
  }, [session, status, router]);

  return (
    <main className="brutal-container min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-pulse h-12 w-full rounded-brutal-sm" />
        ))}
      </div>
    </main>
  );
}
