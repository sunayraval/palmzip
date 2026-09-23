'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export function MultiAgentPlanningSection({
  milestone,
  innerRef,
}: {
  milestone?: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const stats = [
    { label: 'Empirical Reliability', value: '100% Success across 35 trials', highlight: 'text-emerald-400' },
    { label: 'Planning Speed', value: '4.46s Avg Inference', highlight: 'text-cyan-300' },
    { label: 'Multi-Agent Fleet', value: '4 Agents', highlight: 'text-[var(--color-brand-gold)]' },
  ];

  // 4 Agent definition with distinct theme colors and trajectories
  const agents = [
    { id: 'p1', label: 'p1', color: '#06b6d4', glow: 'rgba(6,182,212,0.8)', start: { x: 100, y: 130 }, button: { x: 130, y: 190 }, stack: { x: 380, y: 195 } },
    { id: 'p2', label: 'p2', color: '#10b981', glow: 'rgba(16,185,129,0.8)', start: { x: 180, y: 130 }, button: { x: 210, y: 205 }, stack: { x: 380, y: 165 } },
    { id: 'p3', label: 'p3', color: '#eab308', glow: 'rgba(234,179,8,0.8)', start: { x: 260, y: 140 }, button: { x: 290, y: 185 }, stack: { x: 380, y: 135 } },
    { id: 'p4', label: 'p4', color: '#a855f7', glow: 'rgba(168,85,247,0.8)', start: { x: 340, y: 140 }, button: { x: 380, y: 105 }, stack: { x: 470, y: 105 } },
  ];

  return (
    <motion.section
      id={milestone?.id || 'multi-agent-planning'}
      ref={innerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full scroll-mt-28"
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative p-8 md:p-12 rounded-3xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-cyan-500/40 transition-all duration-300 flex flex-col gap-8 overflow-hidden group"
      >
        {/* Ambient Cyan / Violet Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* 1. Header Information */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
              // ASPIRE Research Paper • Autonomous Systems
            </p>
            <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
              Cooperative Multi-Agent Coordination
            </span>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Empirical Paper Results</span>
          </div>
        </div>

        {/* 2. Title, Subtitle & Research Link */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/95">
              Centralized Multi-Agent Planning
            </h2>
            <p className="text-sm md:text-base font-mono text-cyan-400/90 tracking-wide uppercase">
              Pixel 2 Pathways • ASPIRE Research Paper • JHU APL
            </p>
          </div>

          <a
            href={milestone?.link || "https://lnkd.in/p/ecyCSXbM"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-xs tracking-wider uppercase hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] group/link shrink-0 cursor-pointer"
          >
            <span>View on LinkedIn</span>
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

        {/* 4. 2D Vector Waypoint Simulator Visual Component */}
        <div className="relative z-10 w-full rounded-2xl bg-[#070b14] border border-cyan-500/20 p-5 md:p-6 overflow-hidden shadow-inner flex flex-col gap-4">
          {/* Top Readout HUD Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-semibold tracking-wider uppercase text-[11px]">
                2D VECTOR WAYPOINT SIMULATOR
              </span>
            </div>

            {/* Verified Corner Readout Badge */}
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              INFERENCE: 4.46s | SUCCESS: 35/35
            </div>
          </div>

          {/* SVG Coordinate Plane Simulator */}
          <div className="relative w-full h-64 md:h-72 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 560 250" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="vlm-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
                <filter id="agent-dot-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Coordinate Plane Grid */}
              <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
                {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520].map((x) => (
                  <line key={`x-${x}`} x1={x} y1="10" x2={x} y2="240" />
                ))}
                {[30, 70, 110, 150, 190, 230].map((y) => (
                  <line key={`y-${y}`} x1="20" y1={y} x2="540" y2={y} />
                ))}
              </g>

              {/* 1. Apex "VLM Controller" Node */}
              <g transform="translate(280, 30)">
                <circle cx="0" cy="0" r="32" fill="url(#vlm-glow)" />
                <circle cx="0" cy="0" r="16" fill="#08101a" stroke="var(--color-brand-cyan)" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="5" fill="var(--color-brand-cyan)" className="animate-pulse" />
                <text x="0" y="-22" fill="#06b6d4" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  APEX: VLM CONTROLLER
                </text>
              </g>

              {/* 2. Vector Paths Radiating from Apex down to waypoints */}
              {agents.map((ag) => (
                <g key={`vector-${ag.id}`}>
                  {/* Radiating Ray to Agent Base */}
                  <line
                    x1="280"
                    y1="30"
                    x2={ag.start.x}
                    y2={ag.start.y}
                    stroke="rgba(6, 182, 212, 0.3)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  {/* Navigation Trajectory: Base -> Button -> Stack */}
                  <path
                    d={`M ${ag.start.x} ${ag.start.y} L ${ag.button.x} ${ag.button.y} L ${ag.stack.x} ${ag.stack.y}`}
                    fill="none"
                    stroke={ag.color}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.45"
                  />
                </g>
              ))}

              {/* 3. Static Landmark Targets */}
              {/* Button 1 */}
              <circle cx="130" cy="190" r="10" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="130" y="212" fill="#06b6d4" fontSize="8" fontFamily="monospace" textAnchor="middle">BUTTON_A</text>

              {/* Button 2 */}
              <circle cx="210" cy="205" r="10" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="210" y="227" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle">BUTTON_B</text>

              {/* Vertical Stack Station Base & Tower */}
              <rect x="360" y="220" width="40" height="6" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" />
              <line x1="380" y1="220" x2="380" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="380" y="240" fill="rgba(255,255,255,0.6)" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                COOPERATIVE STACK TOWER
              </text>

              {/* Goal Door Landmark */}
              <g transform="translate(470, 105)">
                <rect x="-14" y="-22" width="28" height="44" rx="4" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1.8" />
                <circle cx="6" cy="0" r="2.5" fill="#34d399" />
                <text x="0" y="-28" fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  GOAL DOOR [OPEN]
                </text>
              </g>

              {/* 4. 4 Animated Distinct Glowing Agent Dots (p1, p2, p3, p4) */}
              {agents.map((ag, i) => (
                <g key={`agent-${ag.id}`}>
                  <motion.g
                    animate={
                      shouldReduceMotion
                        ? { x: ag.stack.x, y: ag.stack.y }
                        : {
                            x: [ag.start.x, ag.button.x, ag.stack.x],
                            y: [ag.start.y, ag.button.y, ag.stack.y],
                          }
                    }
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      repeatDelay: 1.2,
                      ease: 'easeInOut',
                      delay: i * 0.4,
                    }}
                  >
                    {/* Glowing outer halo */}
                    <circle cx="0" cy="0" r="14" fill={ag.glow} opacity="0.25" />
                    {/* Core Agent Bead */}
                    <circle cx="0" cy="0" r="6" fill={ag.color} stroke="#ffffff" strokeWidth="1.5" />
                    {/* Agent Label Tag */}
                    <text x="0" y="-10" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {ag.label}
                    </text>
                  </motion.g>
                </g>
              ))}
            </svg>

            {/* Hover Effect: Floating Glass Badge with JSON Payload */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-4 right-4 z-30 p-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.35)] pointer-events-none"
                >
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10 text-[10px] font-mono text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>CENTRALIZED_ACTION_PLAN.json</span>
                  </div>
                  <pre className="font-mono text-xs text-white/90 leading-tight">
                    <code>
                      {`{\n  "p1": `}
                      <span className="text-cyan-300">"stack_1"</span>
                      {`,\n  "p2": `}
                      <span className="text-emerald-400">"stack_2"</span>
                      {`,\n  "p3": `}
                      <span className="text-amber-300">"stack_3"</span>
                      {`,\n  "p4": `}
                      <span className="text-purple-300">"stack_4"</span>
                      {`\n}`}
                    </code>
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive simulator caption */}
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-1 border-t border-white/10">
            <span className="text-white/70">Hover card to inspect centralized multi-agent JSON action plan</span>
            <span className="text-cyan-400/80">35/35 BENCHMARK PASS</span>
          </div>
        </div>

        {/* 5. Narrative Description */}
        <div className="relative z-10">
          <p className="text-base md:text-lg text-white/70 font-light leading-relaxed">
            Formulated a centralized multi-agent coordination architecture powered by vision-language models to execute multi-step collaborative tasks, including synchronized button triggers, cooperative physical stacking, and goal room traversal.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
