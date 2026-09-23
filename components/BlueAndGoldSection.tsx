'use client';

import { motion } from 'framer-motion';

export function BlueAndGoldSection({
  milestone,
  innerRef,
}: {
  milestone: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
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
      <div className="relative p-5 sm:p-8 md:p-12 rounded-3xl border border-white/15 bg-black/75 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-emerald-500/40 transition-all duration-300 flex flex-col gap-6 sm:gap-8 overflow-hidden group">
        {/* 1. Clinical Telemetry Grid & Heart Rate Monitor Spanning Full Box Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Medical grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_96%)]" />

          {/* Ambient center cardiac glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-56 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14)_0%,transparent_75%)] pointer-events-none" />

          {/* Heart Rate Monitor ECG Waveform Spanning Full Width of Box */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 w-full flex items-center">
            <svg className="w-full h-full" viewBox="0 0 1000 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="bag-ecg-pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#34d399" stopOpacity="0.95" />
                  <stop offset="85%" stopColor="#10b981" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                </linearGradient>
                <filter id="bag-ecg-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10b981" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Seamless repeating cardiac P-Q-R-S-T pulse pattern */}
              <path
                d="M 0 40 L 60 40 Q 75 35, 90 40 L 110 40 L 118 46 L 128 6 L 138 72 L 146 40 L 160 40 Q 185 30, 210 40 L 310 40 Q 325 35, 340 40 L 360 40 L 368 46 L 378 6 L 388 72 L 396 40 L 410 40 Q 435 30, 460 40 L 560 40 Q 575 35, 590 40 L 610 40 L 618 46 L 628 6 L 638 72 L 646 40 L 660 40 Q 685 30, 710 40 L 810 40 Q 825 35, 840 40 L 860 40 L 868 46 L 878 6 L 888 72 L 896 40 L 910 40 Q 935 30, 960 40 L 1000 40"
                fill="none"
                stroke="url(#bag-ecg-pulse-gradient)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#bag-ecg-glow-filter)"
              />
            </svg>

            {/* Sweeping laser beam */}
            <motion.div
              animate={{ x: ['-20%', '110%'] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-emerald-400/15 to-emerald-400/40 pointer-events-none"
            />
          </div>
        </div>

        {/* 2. Top Header Row: Chronology, Role, Title & Website Link */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-5 sm:pb-6">
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

          {milestone.link && (
            <a
              href={`https://${milestone.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs tracking-wider uppercase hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <span>Visit {milestone.link}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}
        </div>

        {/* 3. Title */}
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white/95">
            {milestone.title}
          </h2>
        </div>

        {/* 4. Centerpiece: Enlarged Logo floating over the background ECG */}
        {milestone.mediaAsset && (
          <div className="relative z-10 w-full py-6 sm:py-8 md:py-12 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={milestone.mediaAsset}
              alt={milestone.title}
              className="max-h-28 sm:max-h-40 md:max-h-52 w-auto object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* 5. Sub-Milestone: TiE University Achievement */}
        {milestone.subMilestone && (
          <div className="relative z-10 p-4 sm:p-5 md:p-6 rounded-2xl border border-[var(--color-brand-gold)]/30 bg-black/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
                {milestone.subMilestone.eventTag}
              </span>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-white/95">
                {milestone.subMilestone.achievement}
              </p>
            </div>
            <div className="shrink-0 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/25 text-[var(--color-brand-gold)] text-xs font-mono">
              Rising Founder
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
