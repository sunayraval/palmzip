import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drop Can',
  description: 'Private universal clipboard and drop vault.',
};

export default function DropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
