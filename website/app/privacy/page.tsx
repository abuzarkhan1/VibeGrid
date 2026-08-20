import type { Metadata } from 'next';
import PrivacyContent from './privacy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy — VibeGrid',
  description:
    'VibeGrid Privacy Policy — Zero telemetry, zero cloud egress, 100% local-first desktop runtime. Your code and terminals never leave your machine.',
  openGraph: {
    title: 'Privacy Policy — VibeGrid',
    description:
      'Zero telemetry, zero cloud egress, 100% local-first desktop runtime. Your code and terminals never leave your machine.',
    url: 'https://vibegrid.vercel.app/privacy',
    siteName: 'VibeGrid',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
