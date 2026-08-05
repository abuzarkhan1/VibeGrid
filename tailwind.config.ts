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
          DEFAULT: 'var(--color-accent, #056fc7)',
          bright: 'var(--color-accent, #3c95f0)',
          light: 'var(--color-accent, #64bcff)',
          dark: 'var(--color-surface, #0051a6)',
        },
        neon: 'var(--color-accent, #5cc2ff)',
        bgDark: 'var(--color-bg, #03060a)',
        surfaceCard: 'var(--color-surface, rgba(15, 18, 22, 0.96))',
        'accent-primary': 'var(--color-accent, #056fc7)',
        'accent-secondary': 'var(--color-accent, #3c95f0)',
        'accent-glow': 'transparent',
        foreground: 'var(--color-fg, #e2e8f0)',
        muted: 'var(--color-muted, #8b93a1)',
        pane: {
          bg: 'var(--color-bg, #0b0d12)',
          header: 'var(--color-surface, #0e1116)',
          border: 'var(--color-border, rgba(255,255,255,0.07))',
          activeBorder: 'var(--color-accent, #3c95f0)',
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