/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
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
        'display-xl': ['clamp(3rem, 8vw, 5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': [
          'clamp(2.5rem, 6vw, 4rem)',
          { lineHeight: '1.05', letterSpacing: '-0.02em' },
        ],
        display: ['clamp(2rem, 5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        heading: ['clamp(1.5rem, 4vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        subheading: ['clamp(1.25rem, 3vw, 1.5rem)', { lineHeight: '1.2' }],
        'body-lg': ['clamp(1rem, 2vw, 1.125rem)', { lineHeight: '1.6' }],
        body: ['clamp(0.9375rem, 1.5vw, 1rem)', { lineHeight: '1.6' }],
        'body-sm': ['clamp(0.8125rem, 1.5vw, 0.875rem)', { lineHeight: '1.5' }],
        caption: ['clamp(0.6875rem, 1.5vw, 0.75rem)', { lineHeight: '1.4' }],
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      spacing: {
        gutter: '1.5rem',
        grid: '1rem',
      },
      borderRadius: {
        brutal: '0',
        'brutal-sm': '2px',
        'brutal-md': '4px',
        'brutal-lg': '6px',
      },
      borderWidth: {
        brutal: '3px',
        'brutal-sm': '2px',
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #0a0a0a',
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
        skeleton: {
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
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-12px) scale(0.96)' },
        },
        'stagger-1': {
          '0%, 60%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'stagger-2': {
          '0%, 70%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'stagger-3': {
          '0%, 80%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'toast-in': 'toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out': 'toast-out 0.25s ease-in forwards',
        'stagger-1': 'stagger-1 1.2s ease-out infinite',
        'stagger-2': 'stagger-2 1.2s ease-out infinite',
        'stagger-3': 'stagger-3 1.2s ease-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
