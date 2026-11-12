'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import contentData from '@/data/content.json';

interface AnnouncementBarProps {
  items?: string[];
  badgeText?: string;
  badgeDate?: string;
  holdSeconds?: number;
  className?: string;
}

export function AnnouncementBar({
  items,
  badgeText = "NEW",
  badgeDate = "NOV 12, 2026",
  holdSeconds = 4,
  className = ''
}: AnnouncementBarProps) {
  const tickerItems: string[] =
    items ||
    (contentData as any).announcementTicker || [
      "KITE RELEASE [NOV 12, 2026] ▲ Let your day take flight — kite.sunayraval.com",
      "FEATURE ANNOUNCEMENT ▲ Conversational Gemini AI & Live My Day Scheduler",
      "KITE FEATURES ▲ Notion-Style Tasks • Canvas LMS Sync • Ambient Themes"
    ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (tickerItems.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, holdSeconds * 1000);

    return () => clearInterval(interval);
  }, [tickerItems.length, holdSeconds, isPaused]);

  const renderContent = (item: string) => {
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
          <span className="text-white/85 font-medium">{head.trim()}</span>
          <span className="text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]">
            ▲ {tail.join('▲').trim()}
          </span>
        </span>
      );
    } else if (isDown) {
      const [head, ...tail] = item.split('▼');
      contentNode = (
        <span className="inline-flex items-center gap-2">
          <span className="text-white/85 font-medium">{head.trim()}</span>
          <span className="text-rose-400 font-semibold">
            ▼ {tail.join('▼').trim()}
          </span>
        </span>
      );
    } else {
      contentNode = <span className="text-white/85 font-medium">{item}</span>;
    }

    if (isKiteLink) {
      return (
        <a
          href="https://kite.sunayraval.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 font-mono text-xs sm:text-[13px] tracking-wide text-white/90 hover:text-white transition-colors cursor-pointer py-1"
        >
          {contentNode}
          <span className="text-[11px] text-[var(--color-brand-cyan)] opacity-70 group-hover:opacity-100 transition-opacity">
            ↗
          </span>
        </a>
      );
    }

    return (
      <div className="font-mono text-xs sm:text-[13px] tracking-wide text-white/90 py-1">
        {contentNode}
      </div>
    );
  };

  const currentItem = tickerItems[currentIndex] || tickerItems[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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

      {/* Announcement Content Area: Transitions and holds for 3-5 seconds per item */}
      <div className="flex-1 h-full flex items-center px-4 sm:px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full flex items-center truncate"
          >
            {renderContent(currentItem)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress / Step indicator (visible if > 1 items) */}
      {tickerItems.length > 1 && (
        <div className="shrink-0 hidden md:flex items-center gap-1.5 pr-4 z-20">
          {tickerItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to announcement ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex
                  ? 'bg-[var(--color-brand-cyan)] w-3'
                  : 'bg-white/20 hover:bg-white/40 w-1'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementBar;
