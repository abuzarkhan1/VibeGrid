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
        obsidian: {
          DEFAULT: '#08080a',
          light: '#121215',
          dark: '#050507',
          card: '#111115',
          border: 'rgba(255, 255, 255, 0.08)',
        },

        bgDark: '#08080a',
        surface: '#08080a',
        surfaceCard: 'rgba(24, 24, 27, 0.5)',
      },
      fontFamily: {
        sans: ['var(--font-space)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'monospace'],
        space: ['var(--font-space)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sky-gradient': 'linear-gradient(to bottom, #08080a 0%, #0c0c10 24%, #111115 44%, #121218 57%, #0f0f14 71%, #08080a 86%, #08080a 100%)',
        'footer-gradient': 'linear-gradient(to bottom, #08080a 0%, #08080a 100%)',
      },
    },
  },
  plugins: [],
};

