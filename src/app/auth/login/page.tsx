'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GridOverlay } from '@/components/GridOverlay';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="space-y-2 text-center">
            <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
              Student Burnout
            </p>
            <h1 className="font-display text-heading font-bold">Sign In</h1>
            <p className="text-body-sm text-ink-500">Connect your LMS account to get started</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => signIn('mock-lms', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-between px-6 py-4 bg-paper border-brutal border-ink rounded-brutal shadow-brutal hover:shadow-brutal-hover transition-all duration-200 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ink rounded-brutal-sm flex items-center justify-center text-paper font-display font-bold text-sm">
                  M
                </div>
                <div className="text-left">
                  <p className="font-display font-semibold text-body">Mock LMS</p>
                  <p className="font-mono text-caption text-ink-400">Development instance</p>
                </div>
              </div>
              <span className="font-mono text-caption text-ink-400">&rarr;</span>
            </button>

            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-between px-6 py-4 bg-paper border-brutal border-ink rounded-brutal shadow-brutal hover:shadow-brutal-hover transition-all duration-200 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-chrome rounded-brutal-sm flex items-center justify-center text-paper font-display font-bold text-sm">
                  G
                </div>
                <div className="text-left">
                  <p className="font-display font-semibold text-body">Google Classroom</p>
                  <p className="font-mono text-caption text-ink-400">Sign in with Google</p>
                </div>
              </div>
              <span className="font-mono text-caption text-ink-400">&rarr;</span>
            </button>

            <p className="font-mono text-caption text-ink-400 text-center pt-4">
              Press Cmd+Shift+G to toggle grid overlay
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
