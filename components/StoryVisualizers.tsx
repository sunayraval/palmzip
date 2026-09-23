'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* -------------------------------------------------------------------------- */
/*             1. BLUE & GOLD: CLINICAL TELEMETRY & ECG PULSE WAVE            */
/* -------------------------------------------------------------------------- */

export function HealthcareTelemetryWave() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-3xl">
      {/* 1. Clinical Telemetry Grid Spanning Full Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_96%)]" />

      {/* 2. Ambient Cardiac Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-48 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12)_0%,transparent_75%)] pointer-events-none" />

      {/* 3. Heart Rate Monitor ECG Waveform Spanning the Background */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-28 w-full flex items-center">
        <svg className="w-full h-full" viewBox="0 0 1000 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ecg-pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="0.95" />
              <stop offset="85%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
            </linearGradient>
            <filter id="ecg-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10b981" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Authentic Clinical Cardiac P-Q-R-S-T Heartbeat Pattern repeated across background */}
          <path
            d="M 0 40 L 60 40 Q 75 35, 90 40 L 110 40 L 118 46 L 128 6 L 138 72 L 146 40 L 160 40 Q 185 30, 210 40 L 310 40 Q 325 35, 340 40 L 360 40 L 368 46 L 378 6 L 388 72 L 396 40 L 410 40 Q 435 30, 460 40 L 560 40 Q 575 35, 590 40 L 610 40 L 618 46 L 628 6 L 638 72 L 646 40 L 660 40 Q 685 30, 710 40 L 810 40 Q 825 35, 840 40 L 860 40 L 868 46 L 878 6 L 888 72 L 896 40 L 910 40 Q 935 30, 960 40 L 1000 40"
            fill="none"
            stroke="url(#ecg-pulse-gradient)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ecg-glow-filter)"
          />
        </svg>

        {/* Live sweeping laser beam cursor */}
        <motion.div
          animate={{ x: ['-20%', '110%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-emerald-400/15 to-emerald-400/35 pointer-events-none"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*         2. COFINDR: FOUNDER NETWORK & TALENT MATCHMAKING VISUALIZER        */
/* -------------------------------------------------------------------------- */

export function FounderNetworkGraph() {
  const [activeNode, setActiveNode] = useState<string | null>('Lead / Sunay');

  const nodes = [
    { id: 'lead', label: 'Sunay Raval', role: 'Founder / Product', x: 200, y: 110, isCenter: true },
    { id: 'cto', label: 'Tech Lead', role: 'Full-Stack Architecture', x: 80, y: 45, isCenter: false },
    { id: 'ai', label: 'AI Researcher', role: 'VLM & Agents', x: 320, y: 45, isCenter: false },
    { id: 'ops', label: 'Operations', role: 'Go-to-Market', x: 80, y: 175, isCenter: false },
    { id: 'design', label: 'UI/UX Lead', role: 'Product Design', x: 320, y: 175, isCenter: false },
  ];

  return (
    <div className="w-full rounded-2xl bg-black/70 border border-white/10 p-5 flex flex-col gap-4 relative overflow-hidden group shadow-[0_0_25px_rgba(0,0,0,0.8)] hover:border-[var(--color-brand-cyan)]/40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono text-white/70 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-cyan)] animate-pulse" />
          <span className="text-white/90 font-semibold tracking-wide uppercase text-[11px]">
            Founder Network & Core Team Discovery
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
          TEAM MATCHING: ACTIVE
        </span>
      </div>

      {/* Network Graph Container */}
      <div className="relative h-56 w-full flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 400 220">
          <defs>
            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Connection Lines from Center Node to Orbiting Nodes */}
          {nodes.slice(1).map((node, i) => (
            <g key={i}>
              <line
                x1={nodes[0].x}
                y1={nodes[0].y}
                x2={node.x}
                y2={node.y}
                stroke="rgba(6, 182, 212, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Animated particle pulse traveling to center node */}
              <motion.circle
                r="2.5"
                fill="#ffffff"
                animate={{
                  cx: [node.x, nodes[0].x],
                  cy: [node.y, nodes[0].y],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeInOut',
                }}
              />
            </g>
          ))}

          {/* Node Render */}
          {nodes.map((node) => {
            const isCenter = node.isCenter;
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setActiveNode(node.role)}
              >
                {/* Outer Glow Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCenter ? 26 : 18}
                  fill={isCenter ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                  stroke={isCenter ? 'var(--color-brand-cyan)' : 'rgba(255, 255, 255, 0.3)'}
                  strokeWidth={isCenter ? 2 : 1}
                  filter={isCenter ? 'url(#node-glow)' : undefined}
                />
                {/* Inner Core */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCenter ? 7 : 4}
                  fill={isCenter ? '#06b6d4' : '#ffffff'}
                />
                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y + (isCenter ? 38 : 28)}
                  fill={isCenter ? '#ffffff' : 'rgba(255, 255, 255, 0.75)'}
                  fontSize={isCenter ? '11' : '9'}
                  fontFamily="monospace"
                  fontWeight={isCenter ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active Selection Tooltip */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 border-t border-white/10 pt-2.5">
        <span>CORE SYNERGY: <strong className="text-[var(--color-brand-cyan)]">{activeNode}</strong></span>
        <span className="text-white/40">BBAY Cohort Collaboration Engine</span>
      </div>
    </div>
  );
}
