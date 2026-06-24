import { Inter, Instrument_Sans } from 'next/font/google';
import localFont from 'next/font/local';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const departureMono = localFont({
  src: [
    {
      path: '../../public/fonts/DepartureMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-departure-mono',
  display: 'swap',
  preload: true,
  fallback: ['monospace'],
});
