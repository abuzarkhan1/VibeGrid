import type { Metadata } from 'next';
import AboutContent from './about-content';

export const metadata: Metadata = {
  title: 'About — VibeGrid',
  description:
    'Meet Abuzar Khan, the solo developer behind VibeGrid — built with one simple reason: to make developers\' work easier. Free, open source, agent-agnostic.',
  openGraph: {
    title: 'About — VibeGrid',
    description:
      'Meet Abuzar Khan, the solo developer behind VibeGrid — built to make developers\' work easier. Free, open source, agent-agnostic.',
    url: 'https://vibegrid.vercel.app/about',
    siteName: 'VibeGrid',
    type: 'website',
  },
};

export default function About() {
  return <AboutContent />;
}
