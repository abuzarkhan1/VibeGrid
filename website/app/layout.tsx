import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeGrid — The GPU-Accelerated Multi-Pane Terminal Workspace for Mac & Windows',
  description: 'VibeGrid is a free, open-source GPU-accelerated multi-pane terminal workspace using Tauri 2 + Rust + React + WebGL. Orchestrate AI coding agents, terminal grids (1 to 16 panes), workspaces, and custom keybindings.',
  keywords: [
    'VibeGrid',
    'GPU-accelerated terminal',
    'multi-pane terminal workspace',
    'Tauri 2 terminal',
    'Rust PTY',
    'xterm.js WebGL',
    'terminal grid workspace',
    'BridgeSpace alternative',
    'iTerm2 grid alternative',
    'free open source terminal',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'VibeGrid — Free GPU-Accelerated Multi-Pane Terminal Workspace',
    description: 'Free, open-source, 60 FPS GPU-accelerated terminal workspace for macOS & Windows with dynamic 1 to 16 panes.',
    url: 'https://vibegrid.com',
    siteName: 'VibeGrid',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeGrid — Free GPU-Accelerated Multi-Pane Terminal Workspace',
    description: 'Free, open-source 60 FPS GPU-accelerated terminal workspace for macOS & Windows.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="flex flex-col min-h-screen bg-black font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
