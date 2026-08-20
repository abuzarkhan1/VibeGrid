import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg, #1a1b26)',
        sidebar: 'var(--color-sidebar, #0f1117)',
        surface: 'var(--color-surface, #1a1b26)',
        'surface-hover': 'var(--color-surface-hover, #1c202e)',
        'surface-active': 'var(--color-surface-active, #24293b)',
        border: 'var(--color-border, rgba(255, 255, 255, 0.08))',
        'border-subtle': 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
        foreground: 'var(--color-fg, #F3F4F6)',

        ink: {
          primary: 'var(--ink-primary, #F3F4F6)',
        },

        accent: {
          DEFAULT: 'var(--color-accent, #ffffff)',
          primary: 'var(--color-accent, #ffffff)',
          secondary: 'var(--color-accent-secondary, #ffffff)',
        },
        'accent-primary': 'var(--color-accent, #ffffff)',
        'accent-secondary': 'var(--color-accent-secondary, #ffffff)',

        forest: {
          light: 'var(--color-accent, #ffffff)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        ui: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.12s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.99)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;