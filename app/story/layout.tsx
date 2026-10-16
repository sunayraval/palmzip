import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Story',
  description: 'The journey, entrepreneurship, and research of Sunay Raval.',
};

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
