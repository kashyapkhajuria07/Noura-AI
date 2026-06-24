import type { Metadata } from 'next';
import { inter, instrumentSans, departureMono } from '@/lib/fonts';
import { AuthProvider } from '@/lib/auth/provider';
import { NotificationWrapper } from '@/components/notifications/NotificationWrapper';
import { ChatProvider } from '@/components/chat/ChatWrapper';
import { FormToastProvider } from '@/components/FormToast';
import { AppShell } from '@/components/AppShell';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Burnout Detection',
  description: 'Early detection and support for student burnout',
  manifest: '/api/manifest', // JSON manifest served by API route
  themeColor: '#0a0a0a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SB Detect',
  },
  icons: {
    icon: '/icons/icon-512.svg',
    apple: '/icons/icon-512.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSans.variable} ${departureMono.variable}`}
    >
      <body>
        <ServiceWorkerRegistrar />
        <AuthProvider>
          <ChatProvider>
            <NotificationWrapper>
              <FormToastProvider>
                <ErrorBoundary>
                  <AppShell>{children}</AppShell>
                </ErrorBoundary>
              </FormToastProvider>
            </NotificationWrapper>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
