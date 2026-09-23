'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function CofindrSection({
  milestone,
  innerRef,
}: {
  milestone: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Network topology: Center founder node and orbiting core discipline nodes
  const nodes = [
    { id: 'lead', label: 'Founder', role: 'Sunay Raval • Product & Vision', x: 250, y: 120, isCenter: true },
    { id: 'eng', label: 'Engineering', role: 'Full-Stack & Systems Architecture', x: 90, y: 55, isCenter: false },
    { id: 'ai', label: 'AI / ML', role: 'VLM & Intelligent Agent Pipeline', x: 410, y: 55, isCenter: false },
    { id: 'ops', label: 'Operations', role: 'Go-to-Market & Venture Growth', x: 90, y: 185, isCenter: false },
    { id: 'design', label: 'Product Design', role: 'UI/UX & Interactive Interfaces', x: 410, y: 185, isCenter: false },
  ];

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
      <div className="relative p-5 sm:p-8 md:p-12 rounded-3xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-cyan-500/40 transition-all duration-300 flex flex-col gap-6 sm:gap-8 overflow-hidden group">
        {/* Subtle Ambient Cyan Radial Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* 1. Header Information: Chronology, Role & Status Tag */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-5 sm:pb-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
              // {milestone.dateTag} • Venture Platform
            </p>
            {milestone.role && (
              <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
                {milestone.role}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 sm:px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>BBAY Cohort Spin-Out</span>
          </div>
        </div>

        {/* 2. Title */}
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white/95">
            {milestone.title}
          </h2>
        </div>

        {/* 3. Centerpiece: Enlarged Cofindr Logo */}
        {milestone.mediaAsset && (
          <div className="relative z-10 w-full py-4 md:py-6 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={milestone.mediaAsset}
              alt={milestone.title}
              className="max-h-20 sm:max-h-28 md:max-h-36 w-auto object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* 4. Streamlined Network Animation (Extra telemetry & headers removed, pure animation) */}
        <div className="relative z-10 w-full rounded-2xl bg-[#090b12] border border-cyan-500/20 p-3 sm:p-4 md:p-6 overflow-hidden shadow-inner flex flex-col items-center justify-center">
          {/* Subtle grid texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          {/* Interactive Network Graph */}
          <div className="relative w-full h-56 md:h-64 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="cofindr-node-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.8" />
                </filter>
                <radialGradient id="center-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Pulsing center ambient ring */}
              <circle
                cx={nodes[0].x}
                cy={nodes[0].y}
                r={44}
                fill="url(#center-halo)"
              />

              {/* Interconnecting Laser Lines with Travelling Energy Pulses */}
              {nodes.slice(1).map((node, i) => (
                <g key={`link-${node.id}`}>
                  {/* Glowing Connection Beam */}
                  <line
                    x1={nodes[0].x}
                    y1={nodes[0].y}
                    x2={node.x}
                    y2={node.y}
                    stroke="rgba(6, 182, 212, 0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Travelling Energy Particle: Node -> Center */}
                  <motion.circle
                    r="3"
                    fill="#ffffff"
                    filter="url(#cofindr-node-glow)"
                    animate={{
                      cx: [node.x, nodes[0].x],
                      cy: [node.y, nodes[0].y],
                      opacity: [0.2, 1, 0.2],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Return Pulse: Center -> Node */}
                  <motion.circle
                    r="2"
                    fill="#06b6d4"
                    animate={{
                      cx: [nodes[0].x, node.x],
                      cy: [nodes[0].y, node.y],
                      opacity: [0.1, 0.8, 0.1],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.5 + 1.25,
                      ease: 'easeInOut',
                    }}
                  />
                </g>
              ))}

              {/* Cross Links between satellite nodes for realistic mesh topology */}
              <line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[3].x} y2={nodes[3].y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={nodes[2].x} y1={nodes[2].y} x2={nodes[4].x} y2={nodes[4].y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Interactive Nodes */}
              {nodes.map((node) => {
                const isCenter = node.isCenter;
                const isHovered = hoveredNode === node.id;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform duration-300"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Outer Glow Halo */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isCenter ? 30 : 20}
                      fill={isCenter ? 'rgba(6, 182, 212, 0.18)' : isHovered ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)'}
                      stroke={isCenter ? 'var(--color-brand-cyan)' : isHovered ? '#06b6d4' : 'rgba(255, 255, 255, 0.3)'}
                      strokeWidth={isCenter ? 2 : 1}
                      filter={isCenter || isHovered ? 'url(#cofindr-node-glow)' : undefined}
                    />

                    {/* Inner Node Bead */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isCenter ? 8 : 4.5}
                      fill={isCenter ? '#06b6d4' : isHovered ? '#06b6d4' : '#ffffff'}
                    />

                    {/* Clean Minimal Node Label */}
                    <text
                      x={node.x}
                      y={node.y + (isCenter ? 44 : 32)}
                      fill={isCenter ? '#ffffff' : isHovered ? '#06b6d4' : 'rgba(255, 255, 255, 0.75)'}
                      fontSize={isCenter ? '12' : '10'}
                      fontFamily="monospace"
                      fontWeight={isCenter ? 'bold' : 'normal'}
                      textAnchor="middle"
                      className="pointer-events-none tracking-wider"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Dynamic Role Synergy Indicator (Clean, non-distracting single line) */}
          <div className="mt-2 text-center text-xs font-mono text-cyan-300/80 min-h-[20px] transition-opacity duration-300">
            {hoveredNode
              ? nodes.find((n) => n.id === hoveredNode)?.role
              : 'Interactive Founder & Talent Matchmaking Network'}
          </div>
        </div>

        {/* 5. Venture Narrative Description */}
        {milestone.description && (
          <div className="relative z-10 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <p className="text-base md:text-lg text-white/80 font-light leading-relaxed">
              {milestone.description}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
