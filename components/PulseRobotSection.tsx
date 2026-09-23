'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function PulseRobotSection({
  milestone,
  innerRef,
}: {
  milestone?: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const shouldReduceMotion = useReducedMotion();

  // Terminal typewriter sequence
  const terminalLines = [
    '> Voice: "Jarvis, move to the box in front of you"',
    '> RPi Camera: Frame Captured',
    '> VLM: Generating JSON action...',
    '> Arduino: Motors Engaged (28.3s loop)',
  ];

  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const currentLine = terminalLines[activeLineIdx];
    let count = 0;
    setTypedChars(0);

    const interval = setInterval(() => {
      count++;
      setTypedChars(count);

      if (count >= currentLine.length) {
        clearInterval(interval);
        // Hold on current line before advancing
        const timeout = setTimeout(() => {
          if (activeLineIdx < terminalLines.length - 1) {
            setActiveLineIdx((prev) => prev + 1);
          } else {
            // Completed cycle, pause for 2.4s and loop
            setTimeout(() => {
              setActiveLineIdx(0);
            }, 2400);
          }
        }, 800);
        return () => clearTimeout(timeout);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [activeLineIdx, shouldReduceMotion]);

  const stats = [
    { label: 'System Latency', value: '28.3s Latency', highlight: 'text-emerald-400' },
    { label: 'Compute Architecture', value: 'RPi 5 + Arduino Uno', highlight: 'text-cyan-300' },
    { label: 'Vision-Language Model', value: 'Local Gemma VLM', highlight: 'text-[var(--color-brand-gold)]' },
  ];

  return (
    <motion.section
      id={milestone?.id || 'pulse-robot'}
      ref={innerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full scroll-mt-28"
    >
      <div className="relative p-5 sm:p-8 md:p-12 rounded-3xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-emerald-500/40 transition-all duration-300 flex flex-col gap-6 sm:gap-8 overflow-hidden group">
        {/* Ambient Emerald Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* 1. Header Information */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-5 sm:pb-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
              // JHU APL ASPIRE • Physical Edge Robotics
            </p>
            <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
              Embodied Spatial Reasoning
            </span>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 sm:px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Physical Platform</span>
          </div>
        </div>

        {/* 2. Title, Subtitle & Showcase Link */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white/95">
              P.U.L.S.E. Physical Robot
            </h2>
            <p className="text-xs sm:text-base font-mono text-emerald-400/90 tracking-wide uppercase">
              JHU APL ASPIRE Research Project
            </p>
          </div>

          <a
            href={milestone?.link || "https://aspireshowcase.dunked.com/pulse-physical-unit-for-language-sight-and-execution"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs tracking-wider uppercase hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] group/link shrink-0 cursor-pointer"
          >
            <span>View ASPIRE Showcase</span>
            <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* 3. Verified Stats Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-1.5 backdrop-blur-md hover:border-white/20 transition-colors"
            >
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                {s.label}
              </span>
              <span className={`text-base md:text-lg font-mono font-bold tracking-tight ${s.highlight}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* 4. Mini HUD Terminal Visual Component */}
        <div className="relative z-10 w-full rounded-2xl bg-[#060b08] border border-emerald-500/20 p-4 sm:p-5 md:p-6 overflow-hidden shadow-inner flex flex-col md:flex-row gap-4 sm:gap-5 items-stretch">
          {/* Left Side / Top: 120px Dark Camera Feed Mockup with oscillating scanline */}
          <div className="relative md:w-5/12 h-[120px] rounded-xl bg-[#030704] border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
            {/* Camera feed ambient grid & vignette */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Corner Bracket Reticles */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400/80 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400/80 pointer-events-none" />

            {/* Camera Overlay HUD Badges */}
            <div className="absolute top-2 left-4 text-[9px] font-mono text-emerald-400 flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>REC // RPi CAM 5</span>
            </div>
            <div className="absolute bottom-2 right-4 text-[8px] font-mono text-white/40 z-10">
              1080P • 30 FPS
            </div>

            {/* Target Object with Dashed Bounding Box */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-14 border border-dashed border-emerald-400 bg-emerald-500/[0.08] rounded flex flex-col items-center justify-between p-1 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <span className="text-[8.5px] font-mono font-bold text-emerald-300 bg-black/85 px-1.5 py-0.5 rounded border border-emerald-500/40 tracking-wider">
                  [TARGET: BOX_01 | CONF: 94%]
                </span>
                <div className="w-2 h-2 text-emerald-400 flex items-center justify-center text-[10px] font-mono">
                  +
                </div>
              </div>
            </div>

            {/* Glowing Green Horizontal Scanline Oscillating Vertically (Pauses on reduced motion) */}
            {!shouldReduceMotion && (
              <motion.div
                animate={{ y: [0, 118, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#34d399,0_0_4px_#ffffff] pointer-events-none z-20"
              />
            )}
          </div>

          {/* Right Side / Bottom: Live Terminal Typewriter Animation */}
          <div className="relative flex-1 rounded-xl bg-black/80 border border-white/10 p-4 font-mono text-xs text-white/90 flex flex-col justify-center min-h-[120px] shadow-inner overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5 text-[10px] text-white/40">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-white/70">PULSE_ACTION_PIPELINE.sh</span>
              </div>
              <span className="text-emerald-400/80">LOOP: 28.3s</span>
            </div>

            {/* Terminal Log Lines */}
            <div className="flex flex-col gap-1.5 text-[11px] md:text-xs">
              {terminalLines.map((line, idx) => {
                if (shouldReduceMotion) {
                  return (
                    <div key={idx} className="text-emerald-300/90 font-mono">
                      {line}
                    </div>
                  );
                }

                if (idx < activeLineIdx) {
                  return (
                    <div key={idx} className="text-white/60 font-mono flex items-center gap-2">
                      <span className="text-emerald-400/70">✓</span>
                      <span>{line}</span>
                    </div>
                  );
                }

                if (idx === activeLineIdx) {
                  return (
                    <div key={idx} className="text-emerald-300 font-bold font-mono flex items-center">
                      <span>{line.slice(0, typedChars)}</span>
                      <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 animate-pulse" />
                    </div>
                  );
                }

                return (
                  <div key={idx} className="text-white/20 font-mono">
                    {line.slice(0, 8)}...
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Narrative Description */}
        <div className="relative z-10">
          <p className="text-base md:text-lg text-white/70 font-light leading-relaxed">
            Embodied physical robotics platform coupling edge Vision-Language Models with onboard Raspberry Pi 5 compute and Arduino motor actuation for zero-shot spatial comprehension and voice-directed navigation.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
