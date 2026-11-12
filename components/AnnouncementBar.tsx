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
      "NEW [NOV 12, 2026] ▲ KITE IS OFFICIALLY RELEASED — Let your day take flight at kite.sunayraval.com",
      "KITE ▲ Conversational Gemini AI workspace, Notion-style task database & Canvas LMS sync",
      "ANNOUNCEMENT [NOV 12, 2026] ▲ Experience live My Day scheduling & cinema-grade ambient themes at kite.sunayraval.com",
      "SUNAY RAVAL ▲ PORTFOLIO 2026",
      "BLUE & GOLD HEALTHCARE ▲ TiE NJ Finalist",
      "PULSE ROBOTICS ▲ Embodied AI Navigation"
    ];

  // Render individual ticker element with rich market styling
  const renderItem = (item: string, idx: number) => {
    const isUp = item.includes('▲');
    const isDown = item.includes('▼');
    const isKiteLink = item.toLowerCase().includes('kite.sunayraval.com');

    let contentNode: React.ReactNode;

    if (isUp) {
      const [head, ...tail] = item.split('▲');
      contentNode = (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-white/90 font-medium">{formatHead(head)}</span>
          <span className="text-emerald-400 font-semibold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] flex items-center gap-1">
            ▲ {tail.join('▲').trim()}
          </span>
        </span>
      );
    } else if (isDown) {
      const [head, ...tail] = item.split('▼');
      contentNode = (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-white/90 font-medium">{formatHead(head)}</span>
          <span className="text-rose-400 font-semibold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] flex items-center gap-1">
            ▼ {tail.join('▼').trim()}
          </span>
        </span>
      );
    } else {
      contentNode = <span className="text-white/85 font-medium">{formatHead(item)}</span>;
    }

    if (isKiteLink) {
      return (
        <a
          key={idx}
          href="https://kite.sunayraval.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group/item flex items-center gap-3 font-mono text-[11px] sm:text-xs tracking-wider whitespace-nowrap hover:text-white transition-colors py-0.5 cursor-pointer"
        >
          {contentNode}
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-brand-cyan)] bg-cyan-950/50 px-1.5 py-0.5 rounded border border-[var(--color-brand-cyan)]/30 group-hover/item:border-[var(--color-brand-cyan)] group-hover/item:bg-cyan-900/60 transition-all">
            <span>VISIT APP</span>
            <span>↗</span>
          </span>
          <span className="text-white/20 ml-2 select-none">◆</span>
        </a>
      );
    }

    return (
      <div
        key={idx}
        className="flex items-center gap-3 font-mono text-[11px] sm:text-xs tracking-wider whitespace-nowrap py-0.5"
      >
        {contentNode}
        <span className="text-white/20 ml-2 select-none">◆</span>
      </div>
    );
  };

  // Helper to format tags like [NOV 12, 2026] or NEW in the head text
  const formatHead = (text: string) => {
    const trimmed = text.trim();
    return trimmed;
  };

  return (
    <div
      className={`relative w-full h-7 sm:h-8 bg-[#05080a]/95 backdrop-blur-md border-b border-white/10 flex items-center overflow-hidden select-none z-50 ${className}`}
    >
      {/* Ticker Badge with 'NEW' and Date of Announcement */}
      <div className="shrink-0 h-full flex items-center gap-2 px-3 sm:px-4 bg-[#090d12] border-r border-white/10 z-20 shadow-[2px_0_12px_rgba(0,0,0,0.6)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-cyan)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand-cyan)] shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
        </span>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-brand-cyan)] whitespace-nowrap">
            {badgeText}
          </span>
          {badgeDate && (
            <span className="hidden sm:inline-block text-[9px] font-medium text-white/50 tracking-wider border-l border-white/15 pl-1.5 whitespace-nowrap">
              {badgeDate}
            </span>
          )}
        </div>
      </div>

      {/* Edge Fade Gradients */}
      <div className="pointer-events-none absolute inset-y-0 left-[75px] sm:left-[145px] w-6 sm:w-12 bg-gradient-to-r from-[#05080a] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 bg-gradient-to-l from-[#05080a] to-transparent z-10" />

      {/* Marquee Track with Pause on Hover */}
      <div className="flex-1 overflow-hidden h-full flex items-center">
        <div className="animate-marquee flex items-center gap-6 pl-4 hover:[animation-play-state:paused] cursor-default">
          {tickerItems.map((item, idx) => renderItem(item, idx))}
          {tickerItems.map((item, idx) => renderItem(item, idx + tickerItems.length))}
          {tickerItems.map((item, idx) => renderItem(item, idx + tickerItems.length * 2))}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementBar;
