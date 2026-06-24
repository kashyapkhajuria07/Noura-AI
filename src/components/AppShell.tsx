'use client';

import { useState, useCallback, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/components/chat/ChatWrapper';
import { useOnline, useInstallPrompt } from '@/lib/hooks/useOnline';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/study-planner', label: 'Study Planner' },
  { href: '/reflection', label: 'Reflection' },
  { href: '/risk-dashboard', label: 'Risk' },
  { href: '/privacy', label: 'Privacy' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { openChat } = useChat();
  const { isOffline } = useOnline();
  const { canInstall, promptInstall } = useInstallPrompt();

  const [menuOpen, setMenuOpen] = useState(false);
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleNav = useCallback(
    (href: string) => {
      closeMenu();
      router.push(href);
    },
    [router, closeMenu]
  );

  const isAuthPage = pathname === '/auth/login';

  return (
    <div className="min-h-screen bg-paper">
      {isOffline && (
        <div className="sticky top-0 z-[90] bg-accent text-paper border-b-brutal border-accent-dark px-4 py-2 text-center">
          <p className="font-mono text-caption font-semibold">
            &#9888; You are offline. Some features may be unavailable.
          </p>
        </div>
      )}

      {!isAuthPage && session && (
        <nav className="sticky top-0 z-40 bg-paper border-b-brutal border-ink">
          <div className="brutal-container flex items-center justify-between h-14">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-1 p-2 border-brutal-sm border-ink rounded-brutal-sm hover:bg-ink-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-5 h-0.5 bg-ink transition-transform ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}
              />
              <span
                className={`block w-5 h-0.5 bg-ink transition-opacity ${menuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block w-5 h-0.5 bg-ink transition-transform ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}
              />
            </button>

            <a href="/dashboard" className="font-display text-body font-bold tracking-tight">
              SB Detect
            </a>

            <div className="flex items-center gap-2">
              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="font-mono text-caption text-chrome border border-chrome rounded-brutal-sm px-2 py-1 hover:bg-chrome hover:text-paper transition-colors hidden md:inline-block"
                >
                  Install
                </button>
              )}
              <button
                onClick={() => {
                  openChat();
                  closeMenu();
                }}
                className="font-mono text-caption text-ink-400 hover:text-ink transition-colors border border-ink-200 rounded-brutal-sm px-2 py-1"
              >
                Chat
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="font-mono text-caption text-accent hover:text-accent-dark transition-colors ml-1"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
      )}

      {menuOpen && session && !isAuthPage && (
        <div className="fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeMenu} />
          <aside className="relative w-72 max-w-[80vw] bg-paper border-r-brutal border-ink animate-slide-in-left flex flex-col">
            <div className="p-6 border-b border-ink-200">
              <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                Navigation
              </p>
              <p className="font-display text-body font-semibold mt-1 truncate">
                {session?.user?.name ?? 'Student'}
              </p>
            </div>
            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="w-full text-left font-display text-body-sm font-semibold px-4 py-3 border-brutal-sm border-transparent hover:border-ink rounded-brutal-sm hover:bg-ink-100 transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-ink-200">
              <p className="font-mono text-caption text-ink-400">
                v1.0 &middot; {isOffline ? 'Offline' : 'Online'}
              </p>
            </div>
          </aside>
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}
