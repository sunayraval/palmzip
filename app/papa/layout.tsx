import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Papa & Sunay | Private Channel',
  description: 'Private live family portal for Papa and Sunay to instantly exchange messages, photos, and documents.',
};

export default function PapaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
