'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function ConsistentWaveLine({
  cycles,
  className = 'w-full',
  strokeColor = 'currentColor',
  strokeWidth = 2,
}: {
  cycles: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
}) {
  const halfPeriod = 10; // Consistent 20px period per full cycle
  const amplitude = 3.5; // Consistent 3.5px amplitude
  const width = cycles * (halfPeriod * 2) + 4;

  let d = `M 2 6 q ${halfPeriod / 2} -${amplitude}, ${halfPeriod} 0`;
  for (let i = 1; i < cycles * 2; i++) {
    d += ` t ${halfPeriod} 0`;
  }

  return (
    <svg
      className={`${className} h-3.5`}
      viewBox={`0 0 ${width} 12`}
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d={d}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotewaySection({
  milestone,
  innerRef,
}: {
  milestone: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  const fullText =
    milestone.description ||
    'Built Noteway, an AI-powered note-taking application for college students engineered to enhance lecture comprehension and synthesis.';

  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      setTypedLength(idx);
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [isInView, fullText]);



  return (
    <motion.section
      id={milestone.id}
      ref={innerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full scroll-mt-28"
    >
      <div
        ref={containerRef}
        className="relative p-8 md:p-12 rounded-3xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.85)] hover:border-white/25 transition-all duration-300 flex flex-col gap-7 overflow-hidden group"
      >
        {/* Subtle ambient cyan glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* 1. Header Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
          <div className="flex flex-col gap-1.5">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
              // {milestone.dateTag} {milestone.category ? `• ${milestone.category}` : ''}
            </p>
            {milestone.role && (
              <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
                {milestone.role}
              </span>
            )}
          </div>

          {milestone.accolades?.[0] && (
            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-1.5 rounded-full bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/30 text-[var(--color-brand-gold)] text-xs font-mono shadow-[0_0_15px_rgba(255,215,0,0.08)]">
              <span>🏆</span>
              <span className="font-semibold">{milestone.accolades[0]}</span>
            </div>
          )}
        </div>

        {/* 2. Title */}
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/95">
            {milestone.title}
          </h2>
        </div>

        {/* 3. Lecture Screen Canvas (Reading Source - Abstract Scribbles) */}
        <div className="relative rounded-2xl bg-[#090b12] border border-cyan-500/20 p-5 md:p-6 overflow-hidden z-10 shadow-inner flex flex-col gap-4">
          {/* Sweeping optical reading scanbeam */}
          <motion.div
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-7 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent pointer-events-none z-20 border-b border-cyan-400/40"
          />

          {/* Screen Top Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/10 pb-2.5 text-white/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-cyan-300 font-semibold tracking-wide uppercase text-[10px]">
                LIVE LECTURE SCREEN
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>FEED ACTIVE</span>
            </div>
          </div>

          {/* Consistent Harmonic Waves with Uniform Amplitude and Period */}
          <div className="flex flex-col gap-3.5 py-1">
            {/* Header Wave (Shorter title line) */}
            <div className="w-48 text-cyan-400/60">
              <ConsistentWaveLine cycles={10} strokeWidth={2.2} />
            </div>

            {/* Wave Line 1 */}
            <div className="flex items-center gap-3 text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
              <div className="w-full">
                <ConsistentWaveLine cycles={26} strokeWidth={1.8} />
              </div>
            </div>

            {/* Wave Line 2 (Highlighted with active scan glow) */}
            <div className="flex items-center gap-3 text-cyan-400/80 bg-cyan-500/[0.08] py-1.5 px-2.5 rounded-lg border-l-2 border-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_#06b6d4]" />
              <div className="w-full">
                <ConsistentWaveLine cycles={27} strokeColor="#06b6d4" strokeWidth={2} />
              </div>
            </div>

            {/* Wave Line 3 */}
            <div className="flex items-center gap-3 text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
              <div className="w-3/4">
                <ConsistentWaveLine cycles={20} strokeWidth={1.8} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Real-time Transcribing on the Noteway Text Itself */}
        <div className="relative z-10 flex flex-col gap-2.5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pb-2 border-b border-white/5">
            <span className="text-emerald-400 font-semibold tracking-wider uppercase text-[10px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Speech-to-Text Transcription
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              Noteway Engine
            </span>
          </div>

          <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed min-h-[64px]">
            {fullText.slice(0, typedLength)}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-5 ml-1.5 bg-cyan-400 align-middle shadow-[0_0_10px_#06b6d4]"
            />
          </p>
        </div>
      </div>
    </motion.section>
  );
}
