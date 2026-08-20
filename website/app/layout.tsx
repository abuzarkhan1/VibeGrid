import type { Metadata } from 'next';
import './globals.css';

const spaceGrotesk = { variable: 'font-space' };
const instrumentSerif = { variable: 'font-serif' };
const jetbrainsMono = { variable: 'font-mono' };

export const metadata: Metadata = {
  title: 'VibeGrid — The Agnostic Vibe Coder & Multi-Agent Terminal Grid',
  description: 'VibeGrid is a free, open-source GPU-accelerated workspace for orchestrating your choice of AI agents with native Rust PTY, WebGL 60 FPS rendering, and dynamic 1-16 pane layouts.',
  keywords: [
    'VibeGrid',
    'Vibe Coding',
    'AI Agent Orchestrator',
    'GPU-accelerated terminal',
    'multi-pane terminal workspace',
    'Tauri 2 terminal',
    'Rust PTY',
    'xterm.js WebGL',
    'Huly design terminal',
    'Claude Code grid',
    'Aider pair programmer',
    'free open source terminal',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'VibeGrid — The Agnostic Vibe Coder',
    description: 'Free, local-first workspace for orchestrating your choice of AI agents with 60 FPS WebGL GPU acceleration.',
    url: 'https://vibegrid.vercel.app/',
    siteName: 'VibeGrid',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeGrid — The Agnostic Vibe Coder',
    description: 'Free, local-first workspace for orchestrating your choice of AI agents.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark overscroll-y-none"
      style={{ colorScheme: 'dark' }}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="flex flex-col min-h-screen bg-[#090a0c] font-sans text-white antialiased selection:bg-[#5683da]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
