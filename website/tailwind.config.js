/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core Solid Design Tokens
        'obsidian-canvas': '#303236',
        'void': '#090a0c',
        'charcoal-card': '#111111',
        'slate-edge': '#4a4b50',
        'iron-veil': '#6b6c6d',
        'smoke': '#95979e',
        'ash': '#a9a9aa',
        'frost': '#d1d1d1',
        'linen': '#e5e5e7',
        'linen-warm': '#f6f6f6',
        'snow': '#ffffff',
        'electric-iris': '#5683da',
        'ember-pulse': '#ff8964',
        'molasses': '#5a250a',

        // Backward compatibility mappings
        obsidian: {
          DEFAULT: '#090a0c',
          light: '#303236',
          dark: '#090a0c',
          card: '#111111',
          border: '#4a4b50',
        },
        bgDark: '#090a0c',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', 'var(--font-space)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Esbuild', 'Sora', 'var(--font-esbuild)', 'Space Grotesk', 'ui-sans-serif', 'sans-serif'],
        serif: ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'var(--font-mono)', 'ui-monospace', 'monospace'],
        space: ['var(--font-space)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        caption: ['11px', { lineHeight: '1.38', letterSpacing: '-0.1px' }],
        body: ['14px', { lineHeight: '1.5', letterSpacing: '-0.14px' }],
        'body-lg': ['16px', { lineHeight: '1.5', letterSpacing: '-0.16px' }],
        subheading: ['18px', { lineHeight: '1.5', letterSpacing: '-0.36px' }],
        'heading-sm': ['22px', { lineHeight: '1.25', letterSpacing: '0px' }],
        heading: ['24px', { lineHeight: '1.25', letterSpacing: '-0.48px' }],
        'display-sm': ['32px', { lineHeight: '1.0', letterSpacing: '-1.6px' }],
        display: ['80px', { lineHeight: '0.9', letterSpacing: '-4.0px' }],
        'display-hero': ['84px', { lineHeight: '0.85', letterSpacing: '-4.2px' }],
      },
      borderRadius: {
        input: '4px',
        card: '12px',
        panel: '30px',
        pill: '9999px',
      },
      boxShadow: {
        sm: '0px 4px 6px 0px rgba(0, 0, 0, 0.15)',
        md: '0px 4px 16px 0px rgba(0, 0, 0, 0.35)',
        xl: '0px 6px 25px 0px rgba(0, 0, 0, 0.50)',
        subtle: '0px 0px 0px 6px rgba(255, 255, 255, 0.40)',
      },
      spacing: {
        '24': '96px', // Standard 96px section gap
      },
      maxWidth: {
        site: '1200px',
      },
    },
  },
  plugins: [],
};
