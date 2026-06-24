import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: 'Student Burnout Detection',
    short_name: 'SB Detect',
    description: 'Early detection and support for student burnout',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#fafaf9',
    theme_color: '#0a0a0a',
    categories: ['education', 'health', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    screenshots: [],
    prefer_related_applications: false,
  };

  return NextResponse.json(manifest);
}
