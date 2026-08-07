import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg, #08080a)',
        surface: 'rgb(var(--color-surface-rgb, 15 17 21) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover-rgb, 24 26 32) / <alpha-value>)',
        border: 'var(--color-border, rgba(255, 255, 255, 0.08))',
        // IMPORTANT: colors use the `rgb(var(--channel) / <alpha-value>)`
        // pattern so Tailwind can generate opacity modifiers (bg-forest/10,
        // border-forest/30…). Plain `var(--color-accent)` CANNOT take /opacity
        // — Tailwind silently drops those classes (found during the invisible-
        // pane-boundary bug hunt; the website config already used this pattern).
        forest: {
          DEFAULT: 'rgb(var(--color-accent-rgb, 255 255 255) / <alpha-value>)',
          bright: 'rgb(var(--color-accent-rgb, 255 255 255) / <alpha-value>)',
          light: 'rgb(var(--color-accent-rgb, 255 255 255) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-rgb, 200 200 200) / <alpha-value>)',
        },
        surfaceCard: 'rgb(var(--color-surface-rgb, 15 17 21) / <alpha-value>)',
        neon: 'var(--color-accent, #ffffff)',
        bgDark: 'var(--color-bg, #08080a)',
        'accent-primary': 'var(--color-accent, #ffffff)',
        'accent-secondary': 'var(--color-accent, #ffffff)',
        'accent-glow': 'transparent',
        foreground: 'var(--color-fg, #f4f4f5)',
        muted: 'var(--color-muted, #8b93a1)',
        pane: {
          bg: 'var(--color-bg, #08080a)',
          header: 'var(--color-surface, #0f1115)',
          border: 'var(--color-border, rgba(255, 255, 255, 0.08))',
          activeBorder: 'var(--color-accent, #ffffff)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        newsreader: ['Newsreader', 'Georgia', 'serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
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