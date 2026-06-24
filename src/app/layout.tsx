import type { Metadata } from 'next';
import { inter, instrumentSans, departureMono } from '@/lib/fonts';
import { AuthProvider } from '@/lib/auth/provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Burnout',
  description: 'A duotone brutalist design system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSans.variable} ${departureMono.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
