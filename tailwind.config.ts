import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg, #03060a)',
        surface: 'var(--color-surface, #0a0c10)',
        'surface-hover': 'var(--color-surface-hover, #11151a)',
        border: 'var(--color-border, rgba(255,255,255,0.07))',
        forest: {
          DEFAULT: '#2c7a40',
          bright: '#54a967',
          light: '#6ec782',
          dark: '#1e542c',
        },
        neon: '#7cff3f',
        bgDark: '#03060a',
        surfaceCard: 'rgba(15, 18, 22, 0.96)',
        'accent-primary': '#2c7a40',
        'accent-secondary': '#54a967',
        'accent-glow': 'rgba(44, 122, 64, 0.15)',
        foreground: 'var(--color-fg, #e2e8f0)',
        muted: 'var(--color-muted, #8b93a1)',
        pane: {
          bg: '#0b0d12',
          header: '#0e1116',
          border: 'rgba(255,255,255,0.07)',
          activeBorder: '#54a967',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        newsreader: ['Newsreader', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;