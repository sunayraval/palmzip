'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface OtherDropdownProps {
  variant?: 'default' | 'story' | 'gold';
  className?: string;
}

export function OtherDropdown({ variant = 'default', className = '' }: OtherDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isSeniorActive = pathname === '/senior-countdown' || variant === 'gold';

  // Automatically close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle click outside and Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Support mouse hover on desktop devices without interfering with mobile touch
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsOpen(false);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  let buttonStyle = 'text-xs sm:text-sm font-medium text-white/90 hover:text-[var(--color-brand-cyan)] transition-colors px-2 py-1 rounded flex items-center gap-1 cursor-pointer touch-manipulation select-none';
  if (isSeniorActive) {
    buttonStyle = 'text-xs sm:text-sm font-medium text-[var(--color-brand-gold)] px-3 py-1 rounded-full bg-amber-950/30 border border-[var(--color-brand-gold)]/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(195,154,63,0.15)] cursor-pointer touch-manipulation select-none';
  } else if (variant === 'story') {
    buttonStyle = 'text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors px-2 py-1 flex items-center gap-1 cursor-pointer touch-manipulation select-none';
  }

  return (
    <div
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Other pages menu"
        className={buttonStyle}
      >
        {isSeniorActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-gold)] animate-pulse" />
        )}
        <span>Other</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            isSeniorActive
              ? 'text-[var(--color-brand-gold)]'
              : variant === 'story'
              ? 'text-white/50'
              : 'text-white/60'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`absolute right-0 top-full pt-2 z-50 min-w-[260px] max-w-[calc(100vw-2rem)] transition-all duration-200 ${
          isOpen
            ? 'opacity-100 pointer-events-auto visible translate-y-0'
            : 'opacity-0 pointer-events-none invisible -translate-y-1'
        }`}
      >
        <div className="bg-[#0c1015]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1">
          <Link
            href="/senior-countdown"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isSeniorActive
                ? 'bg-amber-950/40 border border-[var(--color-brand-gold)]/30 text-[var(--color-brand-gold)] shadow-sm'
                : 'text-white/85 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-gold)]" />
              <span>Senior Countdown</span>
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isSeniorActive
                  ? 'text-[var(--color-brand-gold)]'
                  : 'text-[var(--color-brand-gold)] bg-amber-950/40 border border-[var(--color-brand-gold)]/30'
              }`}
            >
              {isSeniorActive ? 'Active ●' : "'27"}
            </span>
          </Link>
          <a
            href="https://kite.sunayraval.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-cyan)]" />
              <span>kite-- let your day take flight</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--color-brand-cyan)] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-[var(--color-brand-cyan)]/30">
              ↗
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
