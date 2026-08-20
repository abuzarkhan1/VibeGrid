import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg, #090a0c)',
        surface: 'var(--color-surface, #111111)',
        'surface-hover': 'var(--color-surface-hover, #303236)',
        border: 'var(--color-border, #4a4b50)',
        'border-subtle': 'var(--color-border-subtle, rgba(74, 75, 80, 0.4))',
        foreground: 'var(--color-fg, #ffffff)',

        void: '#090a0c',
        obsidian: '#303236',
        charcoal: '#111111',
        'slate-edge': '#4a4b50',
        'iron-veil': '#6b6c6d',
        smoke: '#95979e',
        ash: '#a9a9aa',
        frost: '#d1d1d1',
        linen: '#e5e5e7',
        'electric-iris': '#5683da',
        'ember-pulse': '#ff8964',

        ink: {
          primary: 'var(--ink-primary, #ffffff)',
          secondary: 'var(--ink-secondary, #a9a9aa)',
          muted: 'var(--ink-muted, #6b6c6d)',
        },

        accent: {
          DEFAULT: 'var(--color-accent, #5683da)',
          secondary: 'var(--color-accent-secondary, #ff8964)',
        },

        forest: {
          light: 'var(--color-accent, #5683da)',
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