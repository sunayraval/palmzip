'use client';

import contentData from '@/data/content.json';

interface AnnouncementBarProps {
  items?: string[];
  badgeText?: string;
  badgeDate?: string;
  className?: string;
}

export function AnnouncementBar({
  items,
  badgeText = "NEW",
  badgeDate = "NOV 12, 2026",
  className = ''
}: AnnouncementBarProps) {
  const tickerItems: string[] =
    items ||
    (contentData as any).announcementTicker || [
      "KITE RELEASE [NOV 12, 2026] ▲ Let your day take flight — kite.sunayraval.com",
      "FEATURE ANNOUNCEMENT ▲ Integration with Conversational AI Models for Adaptive Day Planning",
      "KITE FEATURES ▲ Easy-to-Use Tasklist • Canvas LMS Sync • Ambient Themes"
    ];

  const renderItem = (item: string, idx: number) => {
    const isUp = item.includes('▲');
    const isDown = item.includes('▼');
    const isKiteLink =
      item.toLowerCase().includes('kite') ||
      item.toLowerCase().includes('feature');

    let contentNode: React.ReactNode;

    if (isUp) {
      const [head, ...tail] = item.split('▲');
      contentNode = (
        <span className="inline-flex items-center gap-2">
          <span className="text-white/90 font-medium">{head.trim()}</span>
          <span className="text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]">
            ▲ {tail.join('▲').trim()}
          </span>
        </span>
      );
    } else if (isDown) {
      const [head, ...tail] = item.split('▼');
      contentNode = (
        <span className="inline-flex items-center gap-2">
          <span className="text-white/90 font-medium">{head.trim()}</span>
          <span className="text-rose-400 font-semibold">
            ▼ {tail.join('▼').trim()}
          </span>
        </span>
      );
    } else {
      contentNode = <span className="text-white/90 font-medium">{item}</span>;
    }

    if (isKiteLink) {
      return (
        <a
          key={idx}
          href="https://kite.sunayraval.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 font-mono text-xs sm:text-[13px] tracking-wide whitespace-nowrap hover:text-white transition-colors cursor-pointer py-1"
        >
          {contentNode}
          <span className="text-[11px] text-[var(--color-brand-cyan)] opacity-70 group-hover:opacity-100 transition-opacity">
            ↗
          </span>
          <span className="text-white/20 ml-6 sm:ml-8 select-none">•</span>
        </a>
      );
    }

    return (
      <div
        key={idx}
        className="flex items-center gap-2 font-mono text-xs sm:text-[13px] tracking-wide whitespace-nowrap py-1"
      >
        {contentNode}
        <span className="text-white/20 ml-6 sm:ml-8 select-none">•</span>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full h-8 sm:h-9 bg-black/95 backdrop-blur-md border-b border-white/10 flex items-center overflow-hidden select-none z-50 ${className}`}
    >
      {/* Minimalist Badge: NEW with Date */}
      <div className="shrink-0 h-full flex items-center gap-2 px-3 sm:px-4 bg-black border-r border-white/10 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-cyan)] animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <span className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[var(--color-brand-cyan)]">
          {badgeText}
        </span>
        {badgeDate && (
          <span className="hidden sm:inline text-[10px] font-mono text-white/45 tracking-wider border-l border-white/10 pl-2">
            {badgeDate}
          </span>
        )}
      </div>

      {/* Gentle Edge Fades */}
      <div className="pointer-events-none absolute inset-y-0 left-[68px] sm:left-[145px] w-8 sm:w-16 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-black to-transparent z-10" />

      {/* Horizontal Scrolling Marquee Track (Smooth, comfortable reading speed, pauses on hover) */}
      <div className="flex-1 overflow-hidden h-full flex items-center">
        <div
          className="animate-marquee flex items-center pl-6 hover:[animation-play-state:paused] cursor-default"
          style={{ animationDuration: '45s' }}
        >
          {tickerItems.map((item, idx) => renderItem(item, idx))}
          {tickerItems.map((item, idx) => renderItem(item, idx + tickerItems.length))}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementBar;
