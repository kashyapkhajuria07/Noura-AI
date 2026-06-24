/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          50: '#f2f2f2',
          100: '#e6e6e6',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#808080',
          500: '#4d4d4d',
          600: '#333333',
          700: '#1a1a1a',
          800: '#0d0d0d',
          900: '#050505',
        },
        paper: {
          DEFAULT: '#fafaf9',
          50: '#ffffff',
          100: '#fefefe',
          200: '#fdfdfc',
          300: '#fcfcfb',
          400: '#fbfbfa',
          500: '#fafaf9',
          600: '#e8e8e7',
          700: '#d6d6d5',
          800: '#a4a4a3',
          900: '#727271',
        },
        accent: {
          DEFAULT: '#e11d48',
          light: '#fb7185',
          dark: '#be123c',
        },
        chrome: {
          DEFAULT: '#2563eb',
          light: '#60a5fa',
          dark: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-instrument-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-departure-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'heading': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'subheading': ['1.5rem', { lineHeight: '1.2' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        'gutter': '1.5rem',
        'grid': '1rem',
      },
      borderRadius: {
        'brutal': '0',
        'brutal-sm': '2px',
        'brutal-md': '4px',
        'brutal-lg': '6px',
      },
      borderWidth: {
        'brutal': '3px',
        'brutal-sm': '2px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #0a0a0a',
        'brutal-sm': '2px 2px 0px 0px #0a0a0a',
        'brutal-hover': '6px 6px 0px 0px #0a0a0a',
        'brutal-accent': '4px 4px 0px 0px #e11d48',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'skeleton': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
