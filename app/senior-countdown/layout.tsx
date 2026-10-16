import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Senior Countdown',
  description: 'Senior Year Countdown status dashboard, marking period subclocks, and college deadlines.',
};

export default function SeniorCountdownLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
