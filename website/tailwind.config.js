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
        forest: {
          DEFAULT: '#2c7a40',
          bright: '#54a967',
          light: '#6ec782',
          dark: '#1e542c',
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
