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
        // VibeGrid brand palette — azure blue (was green). The primary accent
        // is oklch(0.66 0.16 252); the <alpha-value> placeholder keeps
        // Tailwind opacity modifiers (bg-forest/10, border-forest/30) working.
        forest: {
          DEFAULT: 'oklch(0.52 0.15 252 / <alpha-value>)',
          bright: 'oklch(0.66 0.16 252 / <alpha-value>)',
          light: 'oklch(0.78 0.13 252 / <alpha-value>)',
          dark: 'oklch(0.44 0.13 252 / <alpha-value>)',
        },
        bgDark: '#03060a',
        surface: '#0a0a0b',
        surfaceCard: 'rgba(11, 12, 14, 0.95)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        newsreader: ['Newsreader', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'sky-gradient': 'linear-gradient(to bottom, #03060a 0%, #060c12 24%, #101f23 44%, #172a29 57%, #121a1a 71%, #070a0b 86%, #000000 100%)',
        'footer-gradient': 'linear-gradient(to bottom, #000000 0%, #04070c 42%, #080d16 72%, #0b1422 100%)',
      },
    },
  },
  plugins: [],
};
