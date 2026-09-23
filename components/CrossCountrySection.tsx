'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

export function CrossCountrySection({
  milestone,
  innerRef,
}: {
  milestone: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [manualStage, setManualStage] = useState<number | null>(null);

  // Track scroll within the 175vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth spring for scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  const [scrollProgressVal, setScrollProgressVal] = useState(0);

  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      setScrollProgressVal(latest);
    });
  }, [smoothProgress]);

  // Determine active stage: scroll-driven unless manually clicked
  // Stage 1: 0% to 45% scroll. Stage 2: 45% to 100% scroll.
  const activeStage = manualStage !== null ? manualStage : scrollProgressVal >= 0.45 ? 2 : 1;

  // Effective progress for dot position
  let effectiveProgress = scrollProgressVal;
  if (manualStage !== null) {
    effectiveProgress = manualStage === 1 ? 0.5 : 1.0;
  }

  // Calculate coordinates (x, y) along the parabolic flight path:
  // Arc 1 (MD -> Anaheim): (80, 60) -> control (240, 15) -> (400, 60)
  // Arc 2 (Anaheim -> Berkeley): (400, 60) -> control (560, 15) -> (720, 60)
  const calculateDotCoords = (p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    if (clamped <= 0.5) {
      const t = clamped / 0.5;
      const x = Math.pow(1 - t, 2) * 80 + 2 * (1 - t) * t * 240 + Math.pow(t, 2) * 400;
      const y = Math.pow(1 - t, 2) * 60 + 2 * (1 - t) * t * 15 + Math.pow(t, 2) * 60;
      return { x, y };
    } else {
      const t = (clamped - 0.5) / 0.5;
      const x = Math.pow(1 - t, 2) * 400 + 2 * (1 - t) * t * 560 + Math.pow(t, 2) * 720;
      const y = Math.pow(1 - t, 2) * 60 + 2 * (1 - t) * t * 15 + Math.pow(t, 2) * 60;
      return { x, y };
    }
  };

  const dotCoords = calculateDotCoords(effectiveProgress);

  const stage1 = milestone.stages?.[0] || {
    title: 'Stage 1 — FBLA Nationals',
    location: 'Anaheim, California',
    context: 'Competed in Business Plan at the National Leadership Conference following a 4th place finish at the State level; engaged in nationwide founder/student networking.'
  };

  const stage2 = milestone.stages?.[1] || {
    title: 'Stage 2 — BBAY High School (Bay Area)',
    location: 'Berkeley / SF Bay Area, California',
    projectPitched: 'Cofindr — a dedicated networking platform built for founders and operators to discover collaborators and assemble core teams.',
    accolades: [
      'Golden Bear Award for Leadership (2x Recipient)',
      '2nd Place in the Final Pitch Competition (Team Cofindr)'
    ]
  };

  return (
    <div
      id={milestone.id}
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto h-auto md:h-[130vh] scroll-mt-28"
    >
      {/* Sticky on desktop for scrubbing; normal flow on phone so user can freely read */}
      <div className="relative md:sticky md:top-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative p-4 sm:p-7 md:p-12 rounded-2xl sm:rounded-3xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-cyan-500/40 transition-all duration-300 flex flex-col gap-4 sm:gap-6 md:gap-7 overflow-hidden group"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* 1. Top Header Row: Chronology & Stage Selector */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-4 sm:pb-5">
            <div className="flex flex-col gap-1">
              <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
                // {milestone.dateTag} • National Founder Circuit
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white/95">
                {milestone.title}
              </h2>
            </div>

            {/* Stage Selector Pills (Reflects scroll and allows direct clicking) */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full bg-white/[0.04] border border-white/10 self-start sm:self-auto font-mono text-[10px] sm:text-xs">
              <button
                type="button"
                onClick={() => setManualStage(1)}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                  activeStage === 1
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Stage 1: Anaheim</span>
              </button>
              <button
                type="button"
                onClick={() => setManualStage(2)}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                  activeStage === 2
                    ? 'bg-[var(--color-brand-gold)]/20 text-[var(--color-brand-gold)] border border-[var(--color-brand-gold)]/40 shadow-[0_0_12px_rgba(255,215,0,0.25)]'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-gold)]" />
                <span>Stage 2: Berkeley</span>
              </button>
            </div>
          </div>

          {/* 2. Top Center: MD ➔ Anaheim ➔ Berkeley Flight Trajectory Radar Arc */}
          <div className="relative z-10 w-full rounded-2xl bg-[#090b12] border border-white/10 p-3.5 sm:p-5 md:p-6 overflow-hidden shadow-inner flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono border-b border-white/10 pb-2 text-white/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-white/90 font-semibold tracking-wide uppercase text-[9px] sm:text-[10px]">
                  Flight Trajectory Radar Arc
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-white/40 font-mono">
                {activeStage === 1 ? 'LEG 1: MD ➔ ANAHEIM (STOP 1)' : 'LEG 2: ANAHEIM ➔ BERKELEY (FINAL)'}
              </span>
            </div>

            {/* SVG Flight Arc Container */}
            <div className="relative w-full h-20 sm:h-28 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.8" />
                  </filter>
                  <linearGradient id="flight-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#c39a3f" />
                  </linearGradient>
                </defs>

                {/* Base Trajectory Curves (Background Guides) */}
                <path
                  d="M 80 60 Q 240 15, 400 60"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 400 60 Q 560 15, 720 60"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Active Completed Trajectory Trails */}
                <path
                  d="M 80 60 Q 240 15, 400 60"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  opacity={effectiveProgress >= 0.45 ? 1 : 0.4}
                />
                {effectiveProgress >= 0.45 && (
                  <path
                    d="M 400 60 Q 560 15, 720 60"
                    fill="none"
                    stroke="#c39a3f"
                    strokeWidth="2.5"
                    opacity={activeStage === 2 ? 1 : 0.3}
                  />
                )}

                {/* Waypoint 1: MD (Origin) */}
                <g className="cursor-pointer" onClick={() => setManualStage(1)}>
                  <circle cx="80" cy="60" r="14" fill="#000000" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                  <circle cx="80" cy="60" r="4" fill="#ffffff" />
                  <text x="80" y="92" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    MD
                  </text>
                  <text x="80" y="105" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    Origin
                  </text>
                </g>

                {/* Waypoint 2: Anaheim, CA (FBLA) */}
                <g className="cursor-pointer" onClick={() => setManualStage(1)}>
                  <circle
                    cx="400"
                    cy="60"
                    r="16"
                    fill="#000000"
                    stroke={activeStage === 1 ? '#06b6d4' : 'rgba(6,182,212,0.4)'}
                    strokeWidth={activeStage === 1 ? 2.5 : 1.5}
                    filter={activeStage === 1 ? 'url(#radar-glow)' : undefined}
                  />
                  <circle cx="400" cy="60" r="5" fill="#06b6d4" />
                  <text
                    x="400"
                    y="92"
                    fill={activeStage === 1 ? '#06b6d4' : 'rgba(255,255,255,0.8)'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Anaheim, CA
                  </text>
                  <text x="400" y="105" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    FBLA Nationals
                  </text>
                </g>

                {/* Waypoint 3: Berkeley, CA (BBAY) */}
                <g className="cursor-pointer" onClick={() => setManualStage(2)}>
                  <circle
                    cx="720"
                    cy="60"
                    r="16"
                    fill="#000000"
                    stroke={activeStage === 2 ? 'var(--color-brand-gold)' : 'rgba(255,215,0,0.3)'}
                    strokeWidth={activeStage === 2 ? 2.5 : 1.5}
                    filter={activeStage === 2 ? 'url(#radar-glow)' : undefined}
                  />
                  <circle cx="720" cy="60" r="5" fill="var(--color-brand-gold)" />
                  <text
                    x="720"
                    y="92"
                    fill={activeStage === 2 ? 'var(--color-brand-gold)' : 'rgba(255,255,255,0.7)'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Berkeley, CA
                  </text>
                  <text x="720" y="105" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    BBAY Cohort
                  </text>
                </g>

                {/* The Traveling Flight Dot (Calculated along curved arc) */}
                <g transform={`translate(${dotCoords.x}, ${dotCoords.y})`}>
                  <circle r="12" fill={activeStage === 1 ? 'rgba(6,182,212,0.25)' : 'rgba(255,215,0,0.25)'} className="animate-ping" />
                  <circle r="6" fill="#ffffff" filter="url(#radar-glow)" />
                  <circle r="3" fill={activeStage === 1 ? '#06b6d4' : '#c39a3f'} />
                </g>
              </svg>
            </div>
          </div>

          {/* 3. Stage Content Below: Only Stage 1 at Anaheim, Switches to Stage 2 at Berkeley */}
          <div className="relative z-10 w-full min-h-[160px] sm:min-h-[200px] md:min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeStage === 1 ? (
                /* STAGE 1 — ANAHEIM CARD */
                <motion.div
                  key="stage-1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full flex flex-col gap-3.5 sm:gap-4 rounded-2xl bg-white/[0.02] border border-cyan-500/25 p-3.5 sm:p-6 md:p-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
                        {stage1.title}
                      </h3>
                    </div>
                    <span className="text-[11px] sm:text-xs font-mono text-cyan-400 bg-cyan-950/70 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-cyan-500/30 self-start sm:self-auto">
                      📍 {stage1.location}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm md:text-base text-white/80 font-light leading-relaxed">
                    {stage1.context}
                  </p>

                  {/* Highlights Pill Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1 text-xs font-mono">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-black/50 border border-white/5 flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-white/40 text-[9px] sm:text-[10px] uppercase">State Finish</span>
                      <span className="text-white/90 font-bold text-xs sm:text-sm">4th Place Finalist</span>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl bg-black/50 border border-white/5 flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-white/40 text-[9px] sm:text-[10px] uppercase">Event Level</span>
                      <span className="text-cyan-400 font-bold text-xs sm:text-sm">National Conf</span>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl bg-black/50 border border-white/5 flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-white/40 text-[9px] sm:text-[10px] uppercase">Focus</span>
                      <span className="text-[var(--color-brand-gold)] font-bold text-xs sm:text-sm">Networking</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* STAGE 2 — BERKELEY CARD */
                <motion.div
                  key="stage-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full flex flex-col gap-3.5 sm:gap-4 rounded-2xl bg-white/[0.02] border border-[var(--color-brand-gold)]/30 p-3.5 sm:p-6 md:p-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-brand-gold)]" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
                        {stage2.title}
                      </h3>
                    </div>
                    <span className="text-[11px] sm:text-xs font-mono text-[var(--color-brand-gold)] bg-yellow-950/50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[var(--color-brand-gold)]/30 self-start sm:self-auto">
                      📍 {stage2.location}
                    </span>
                  </div>

                  {/* Project Pitched */}
                  {stage2.projectPitched && (
                    <div className="p-3 sm:p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-1 sm:gap-1.5">
                      <span className="text-[9px] sm:text-[10px] font-mono text-[var(--color-brand-cyan)] uppercase tracking-wider font-semibold">
                        Venture Pitched at Berkeley
                      </span>
                      <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed">
                        {stage2.projectPitched}
                      </p>
                    </div>
                  )}

                  {/* Accolades List */}
                  {stage2.accolades && (
                    <div className="flex flex-col gap-1.5 sm:gap-2 pt-1">
                      <span className="text-[9px] sm:text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        Awards & Distinctions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        {stage2.accolades.map((acc: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl bg-black/50 border border-[var(--color-brand-gold)]/20"
                          >
                            <span className="text-sm">🏆</span>
                            <span className="text-xs font-medium text-white/95">{acc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Timeline Hint */}
          <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/5 text-[9px] sm:text-[10px] font-mono text-white/30">
            <span className="hidden sm:inline">Scroll down to fly from Anaheim to Berkeley</span>
            <span className="sm:hidden">Tap stages above to inspect leg</span>
            <span>{activeStage === 1 ? 'Leg 1: Anaheim' : 'Leg 2: Berkeley'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
