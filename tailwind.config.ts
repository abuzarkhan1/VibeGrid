import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg, #03060a)',
        surface: 'var(--color-surface, #0a0a0b)',
        'surface-hover': 'var(--color-surface-hover, #111315)',
        border: 'var(--color-border, #1c2320)',
        forest: {
          DEFAULT: '#2c7a40',
          bright: '#54a967',
          light: '#6ec782',
          dark: '#1e542c',
        },
        neon: '#7cff3f',
        bgDark: '#03060a',
        surfaceCard: 'rgba(11, 12, 14, 0.95)',
        'accent-primary': '#2c7a40',
        'accent-secondary': '#54a967',
        'accent-glow': 'rgba(44, 122, 64, 0.15)',
        foreground: 'var(--color-fg, #e2e8f0)',
        muted: 'var(--color-muted, #64748b)',
        pane: {
          bg: '#0a0b0d',
          header: '#0d0f12',
          border: 'rgba(255,255,255,0.06)',
          activeBorder: '#54a967',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        newsreader: ['Newsreader', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'sky-gradient':
          'linear-gradient(to bottom, #03060a 0%, #060c12 24%, #101f23 44%, #172a29 57%, #121a1a 71%, #070a0b 86%, #000000 100%)',
      },
      boxShadow: {
        'forest-glow': '0 0 12px rgba(44,122,64,0.35)',
        'forest-glow-lg': '0 0 28px rgba(84,169,103,0.45)',
        'neon-glow': '0 0 20px rgba(124,255,63,0.2), 0 0 40px rgba(124,255,63,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out forwards',
        'face-in-up': 'fadeInUp 0.6s ease-out both',
        'glow-breathe': 'glowBreathe 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-flicker': 'glowBreathe 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glowBreathe: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(44,122,64,0.35), 0 0 24px rgba(44,122,64,0.18)' },
          '50%': { boxShadow: '0 0 16px rgba(84,169,103,0.5), 0 0 32px rgba(84,169,103,0.25)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;