import type { Metadata } from 'next';
import PrivacyGuaranteeContent from './privacy-guarantee-content';

export const metadata: Metadata = {
  title: 'Privacy Guarantee — VibeGrid',
  description:
    'Our 5 Immutable Privacy Guarantees — Hardcoded into VibeGrid from the kernel up. Zero telemetry, zero accounts, 100% local-first air-gapped terminal matrix.',
  openGraph: {
    title: 'Privacy Guarantee — VibeGrid',
    description:
      '5 Immutable Privacy Guarantees hardcoded into VibeGrid. Zero telemetry, zero accounts, 100% local-first air-gapped terminal matrix.',
    url: 'https://vibegrid.vercel.app/privacy-guarantee',
    siteName: 'VibeGrid',
    type: 'website',
  },
};

export default function PrivacyGuaranteePage() {
  return <PrivacyGuaranteeContent />;
}
