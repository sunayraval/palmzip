'use client';

import { motion } from 'framer-motion';

interface TimelineFlowConnectorProps {
  index: number;
  theme: 'entrepreneurship' | 'technology';
  isLastToCta?: boolean;
}

export function TimelineFlowConnector({
  index,
  theme,
  isLastToCta = false,
}: TimelineFlowConnectorProps) {
  const isTech = theme === 'technology';

  // Deterministic unique IDs for SVG gradients and filters
  const gradId = `flow-grad-${theme}-${index}`;
  const glowId = `flow-glow-${theme}-${index}`;
  const pulseId = `flow-pulse-${theme}-${index}`;

  const primaryColor = isTech ? '#06b6d4' : '#10b981';
  const secondaryColor = isTech ? '#3b82f6' : '#f59e0b';
  const highlightColor = isTech ? '#67e8f9' : '#34d399';

  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center select-none pointer-events-none py-2 my-1"
    >
      {/* SVG Canvas for High-Performance Hardware-Accelerated Flow Line */}
      <div className="relative w-48 sm:w-56 h-32 sm:h-36 flex items-center justify-center">
        <svg
          viewBox="0 0 160 140"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Luminous Neon Filter */}
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor={primaryColor}
                floodOpacity="0.85"
              />
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="7"
                floodColor={secondaryColor}
                floodOpacity="0.45"
              />
            </filter>

            {/* Neon Conduit Gradient */}
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
              <stop offset="50%" stopColor={secondaryColor} stopOpacity="1" />
              <stop offset="100%" stopColor={highlightColor} stopOpacity="0.9" />
            </linearGradient>

            {/* Laser Tracer Packet Gradient */}
            <linearGradient id={pulseId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="70%" stopColor={highlightColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* 1. TOP TERMINAL EMITTER (Meeting bottom of previous card) */}
          <g opacity="0.8">
            <line
              x1="55"
              y1="2"
              x2="105"
              y2="2"
              stroke={primaryColor}
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <circle cx="80" cy="2" r="3" fill="#ffffff" filter={`url(#${glowId})`} />
            <circle cx="80" cy="2" r="6" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.6" />
          </g>

          {/* 2. PARALLEL SECONDARY CIRCUIT TRACES */}
          <line
            x1="66"
            y1="10"
            x2="66"
            y2="130"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          />
          <line
            x1="94"
            y1="10"
            x2="94"
            y2="130"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          />

          {/* Circuit Grid Crosshairs / Micro-hash markers */}
          <g stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.8" opacity="0.6">
            <line x1="63" y1="35" x2="69" y2="35" />
            <line x1="91" y1="35" x2="97" y2="35" />
            <line x1="63" y1="105" x2="69" y2="105" />
            <line x1="91" y1="105" x2="97" y2="105" />
          </g>

          {/* 3. MAIN GLOWING NEON CONDUIT TUBE */}
          {/* Ambient wide aura */}
          <line
            x1="80"
            y1="2"
            x2="80"
            y2="138"
            stroke={`url(#${gradId})`}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.2"
          />
          {/* Saturated Neon Tube */}
          <line
            x1="80"
            y1="2"
            x2="80"
            y2="138"
            stroke={`url(#${gradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            opacity="0.9"
          />
          {/* Crisp Core Laser Beam */}
          <line
            x1="80"
            y1="2"
            x2="80"
            y2="138"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* 4. DYNAMIC FLOWING PHOTON ENERGY PULSES */}
          {/* Energy Packet 1 */}
          <motion.g
            animate={{ y: [0, 136] }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Trail */}
            <line
              x1="80"
              y1="-14"
              x2="80"
              y2="0"
              stroke={`url(#${pulseId})`}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Photon Head */}
            <circle cx="80" cy="0" r="3.2" fill="#ffffff" filter={`url(#${glowId})`} />
            <circle cx="80" cy="0" r="6" fill={highlightColor} opacity="0.35" />
          </motion.g>

          {/* Energy Packet 2 (Staggered by 1s) */}
          <motion.g
            animate={{ y: [0, 136] }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              delay: 1.0,
              ease: 'linear',
            }}
          >
            {/* Trail */}
            <line
              x1="80"
              y1="-12"
              x2="80"
              y2="0"
              stroke={`url(#${pulseId})`}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Photon Head */}
            <circle cx="80" cy="0" r="2.8" fill="#ffffff" filter={`url(#${glowId})`} />
            <circle cx="80" cy="0" r="5" fill={primaryColor} opacity="0.4" />
          </motion.g>

          {/* 5. BOTTOM TERMINAL RECEIVER (Leading directly into next card) */}
          <g opacity="0.8">
            <line
              x1="55"
              y1="138"
              x2="105"
              y2="138"
              stroke={highlightColor}
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <circle cx="80" cy="138" r="3" fill="#ffffff" filter={`url(#${glowId})`} />
            <circle cx="80" cy="138" r="6" fill="none" stroke={highlightColor} strokeWidth="1" opacity="0.6" />
          </g>
        </svg>

        {/* 6. CENTRAL WAYPOINT CIRCUIT HUB */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
          {/* Radar ripple wave */}
          <motion.div
            animate={{ scale: [1, 2.1], opacity: [0.65, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            style={{
              borderColor: isTech ? 'rgba(6,182,212,0.6)' : 'rgba(16,185,129,0.6)',
            }}
            className="absolute w-8 h-8 rounded-full border pointer-events-none"
          />

          {/* Center Glassmorphic Core Node */}
          <div
            style={{
              borderColor: isTech ? 'rgba(6,182,212,0.5)' : 'rgba(16,185,129,0.5)',
              boxShadow: isTech
                ? '0 0 20px rgba(6,182,212,0.35), inset 0 0 10px rgba(6,182,212,0.2)'
                : '0 0 20px rgba(16,185,129,0.35), inset 0 0 10px rgba(16,185,129,0.2)',
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#050505]/90 backdrop-blur-md border flex items-center justify-center"
          >
            {/* Animated Directional Downward Laser Chevron */}
            <motion.svg
              animate={{ y: [-1, 2, -1], opacity: [0.75, 1, 0.75] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                stroke={isTech ? '#67e8f9' : '#34d399'}
              />
            </motion.svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineContinuousSpine({
  theme,
}: {
  theme: 'entrepreneurship' | 'technology';
}) {
  const isTech = theme === 'technology';

  return (
    <div
      aria-hidden="true"
      className="absolute left-1/2 -translate-x-1/2 top-24 bottom-36 w-[2px] pointer-events-none z-0 overflow-hidden"
    >
      {/* Soft Ambient Radial Laser Trail */}
      <div
        style={{
          background: isTech
            ? 'linear-gradient(to bottom, transparent 0%, rgba(6,182,212,0.2) 6%, rgba(59,130,246,0.18) 50%, rgba(16,185,129,0.2) 94%, transparent 100%)'
            : 'linear-gradient(to bottom, transparent 0%, rgba(16,185,129,0.2) 6%, rgba(6,182,212,0.18) 50%, rgba(245,158,11,0.2) 94%, transparent 100%)',
        }}
        className="w-full h-full opacity-60"
      />
      {/* Ambient Traveling Energy Shimmer */}
      <motion.div
        animate={{ y: ['-100%', '800%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          background: isTech
            ? 'linear-gradient(to bottom, transparent, rgba(6,182,212,0.65), transparent)'
            : 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.65), transparent)',
        }}
        className="w-full h-72 blur-[1px]"
      />
    </div>
  );
}

