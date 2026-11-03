import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drop Can | Universal Clipboard & Vault',
  description: 'Private universal clipboard and drop can. Instantly drop files, links, notes, and photos across your devices.',
};

export default function DropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
