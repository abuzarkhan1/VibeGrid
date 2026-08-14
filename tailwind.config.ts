import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-bg-rgb, 8 8 10) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb, 15 17 21) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover-rgb, 24 26 32) / <alpha-value>)',
        surfaceCard: 'rgb(var(--color-surface-card-rgb, 15 17 21) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb, 255 255 255) / <alpha-value>)',
        forest: {
          DEFAULT: 'rgb(var(--color-accent-rgb, 255 255 255) / <alpha-value>)',
          bright: 'rgb(var(--color-accent-rgb, 255 255 255) / <alpha-value>)',
          light: 'rgb(var(--color-accent-rgb, 255 255 255) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-rgb, 200 200 200) / <alpha-value>)',
        },
        neon: 'var(--color-accent, #ffffff)',
        bgDark: 'rgb(var(--color-bg-rgb, 8 8 10) / <alpha-value>)',
        'accent-primary': 'var(--color-accent, #ffffff)',
        'accent-secondary': 'var(--color-accent, #ffffff)',
        'accent-glow': 'transparent',
        foreground: 'rgb(var(--color-fg-rgb, 244 244 245) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb, 139 147 161) / <alpha-value>)',
        pane: {
          bg: 'rgb(var(--color-bg-rgb, 8 8 10) / <alpha-value>)',
          header: 'rgb(var(--color-surface-rgb, 15 17 21) / <alpha-value>)',
          border: 'rgb(var(--color-border-rgb, 255 255 255) / <alpha-value>)',
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