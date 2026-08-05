import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg, #03060a)',
        surface: 'rgb(var(--color-surface-rgb, 10 12 16) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover-rgb, 17 21 26) / <alpha-value>)',
        border: 'var(--color-border, rgba(255,255,255,0.07))',
        // IMPORTANT: colors use the `rgb(var(--channel) / <alpha-value>)`
        // pattern so Tailwind can generate opacity modifiers (bg-forest/10,
        // border-forest/30…). Plain `var(--color-accent)` CANNOT take /opacity
        // — Tailwind silently drops those classes (found during the invisible-
        // pane-boundary bug hunt; the website config already used this pattern).
        forest: {
          DEFAULT: 'rgb(var(--color-accent-rgb, 60 149 240) / <alpha-value>)',
          bright: 'rgb(var(--color-accent-rgb, 60 149 240) / <alpha-value>)',
          light: 'rgb(var(--color-accent-rgb, 60 149 240) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-rgb, 28 80 140) / <alpha-value>)',
        },
        surfaceCard: 'rgb(var(--color-surface-rgb, 15 18 22) / <alpha-value>)',
        neon: 'var(--color-accent, #5cc2ff)',
        bgDark: 'var(--color-bg, #03060a)',
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