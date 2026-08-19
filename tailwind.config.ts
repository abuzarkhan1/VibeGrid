import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Structural chrome & backgrounds
        background: 'var(--color-bg, #090a0f)',
        sidebar: 'var(--color-sidebar, #0f1117)',
        surface: 'var(--color-surface, #141721)',
        'surface-hover': 'var(--color-surface-hover, #1c202e)',
        'surface-active': 'var(--color-surface-active, #24293b)',
        border: 'var(--color-border, rgba(255, 255, 255, 0.08))',
        'border-subtle': 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
        foreground: 'var(--ink-primary, #F3F4F6)',

        // Functional Glass Densities
        glass: {
          1: 'var(--glass-density-1, rgba(255, 255, 255, 0.03))',
          2: 'var(--glass-density-2, rgba(255, 255, 255, 0.06))',
          3: 'var(--glass-density-3, rgba(255, 255, 255, 0.10))',
          4: 'var(--glass-density-4, rgba(255, 255, 255, 0.15))',
          5: 'var(--glass-density-5, rgba(255, 255, 255, 0.25))',
          'border-light': 'var(--glass-border-light, rgba(255, 255, 255, 0.15))',
          'border-dark': 'var(--glass-border-dark, rgba(0, 0, 0, 0.30))',
        },

        // Solid Text (Ink) Tokens
        ink: {
          DEFAULT: 'var(--ink-primary, #F3F4F6)',
          primary: 'var(--ink-primary, #F3F4F6)',
          secondary: 'var(--ink-secondary, #9CA3AF)',
          muted: 'var(--ink-muted, #6B7280)',
        },
        'text-secondary': 'var(--ink-secondary, #9CA3AF)',
        muted: 'var(--ink-muted, #6B7280)',

        // Luminous Accent Tokens
        accent: {
          DEFAULT: 'var(--accent-primary, #8B5CF6)',
          primary: 'var(--accent-primary, #8B5CF6)',
          secondary: 'var(--color-accent-secondary, #8B5CF6)',
          glow: 'var(--accent-glow, rgba(139, 92, 246, 0.4))',
        },
        'accent-primary': 'var(--accent-primary, #8B5CF6)',
        'accent-secondary': 'var(--color-accent-secondary, #8B5CF6)',
        'accent-glow': 'var(--accent-glow, rgba(139, 92, 246, 0.4))',

        // Semantic Diff Tokens
        diff: {
          add: {
            DEFAULT: 'var(--diff-add-text, #4ADE80)',
            text: 'var(--diff-add-text, #4ADE80)',
            bg: 'var(--diff-add-bg, rgba(34, 197, 94, 0.15))',
          },
          remove: {
            DEFAULT: 'var(--diff-remove-text, #F87171)',
            text: 'var(--diff-remove-text, #F87171)',
            bg: 'var(--diff-remove-bg, rgba(239, 68, 68, 0.15))',
          },
          warning: '#d29922',
        },
        'diff-add': 'var(--diff-add-text, #4ADE80)',
        'diff-add-bg': 'var(--diff-add-bg, rgba(34, 197, 94, 0.15))',
        'diff-remove': 'var(--diff-remove-text, #F87171)',
        'diff-remove-bg': 'var(--diff-remove-bg, rgba(239, 68, 68, 0.15))',
        'diff-warning': '#d29922',

        forest: {
          DEFAULT: 'var(--accent-primary, #8B5CF6)',
          bright: 'var(--accent-primary, #8B5CF6)',
          light: 'var(--accent-primary, #8B5CF6)',
          dark: '#7C3AED',
        },
        pane: {
          bg: 'var(--glass-density-2, rgba(255, 255, 255, 0.06))',
          header: 'var(--glass-density-3, rgba(255, 255, 255, 0.10))',
          border: 'var(--glass-border-light, rgba(255, 255, 255, 0.15))',
          activeBorder: 'var(--accent-primary, #8B5CF6)',
        },
      },
      boxShadow: {
        'glass-edge': 'var(--glass-edge-effect)',
        'glass-panel': 'var(--glass-edge-effect), 0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-panel-dense': 'var(--glass-edge-effect), 0 12px 36px 0 rgba(0, 0, 0, 0.35)',
        'accent-glow': '0 0 20px var(--accent-glow, rgba(139, 92, 246, 0.4))',
      },
      backdropBlur: {
        'glass-sm': '8px',
        'glass': '16px',
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