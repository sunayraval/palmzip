'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function StockSimulatorSection({
  milestone,
  innerRef,
}: {
  milestone: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [balance, setBalance] = useState(128450.0);
  const [shares, setShares] = useState(250);
  const [price, setPrice] = useState(194.85);
  const [tradeLogs, setTradeLogs] = useState<string[]>([
    'BUY 50 SHARES @ $191.20 [FILLED]',
    'PORTFOLIO REBALANCED +12.4%',
  ]);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Simulated live market price oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((prev) => {
        const delta = (Math.random() - 0.48) * 0.4;
        return Number((prev + delta).toFixed(2));
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = (type: 'BUY' | 'SELL') => {
    const qty = 25;
    if (type === 'BUY') {
      const cost = Number((qty * price).toFixed(2));
      setBalance((b) => Number((b - cost).toFixed(2)));
      setShares((s) => s + qty);
      setLastAction(`BOUGHT ${qty} SHARES @ $${price}`);
      setTradeLogs((logs) => [`BUY ${qty} @ $${price} [SIMULATED EXECUTION]`, ...logs.slice(0, 3)]);
    } else {
      if (shares < qty) return;
      const gain = Number((qty * price).toFixed(2));
      setBalance((b) => Number((b + gain).toFixed(2)));
      setShares((s) => s - qty);
      setLastAction(`SOLD ${qty} SHARES @ $${price}`);
      setTradeLogs((logs) => [`SELL ${qty} @ $${price} [SIMULATED EXECUTION]`, ...logs.slice(0, 3)]);
    }
  };

  const totalValue = Number((balance + shares * price).toFixed(2));
  const pnlPercent = Number((((totalValue - 100000) / 100000) * 100).toFixed(2));

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
      <div className="relative p-8 md:p-12 rounded-3xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-emerald-500/40 transition-all duration-300 flex flex-col gap-8 overflow-hidden group">
        {/* Subtle Ambient Emerald Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* 1. Header Information */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
              // {milestone.dateTag} • {milestone.category}
            </p>
            <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
              Financial Systems & Software
            </span>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Virtual Market Sandbox</span>
          </div>
        </div>

        {/* 2. Title */}
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/95">
            {milestone.title}
          </h2>
        </div>

        {/* 3. Real-Time Trading Terminal Visualizer (No static photos) */}
        <div className="relative z-10 w-full rounded-2xl bg-[#060e18] border border-emerald-500/20 p-5 md:p-8 overflow-hidden shadow-inner flex flex-col gap-6">
          {/* Top Terminal HUD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-6 font-mono">
              <div>
                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Simulated Portfolio</span>
                <span className="text-lg md:text-xl font-bold text-white tracking-tight">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-white/10 pl-6">
                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Total Return</span>
                <span className="text-lg md:text-xl font-bold text-emerald-400 flex items-center gap-1">
                  <span>+{pnlPercent}%</span>
                  <span className="text-xs">▲</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-white/40">TICKER:</span>
              <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-bold tracking-wider">
                SIM / USD
              </span>
              <span className="text-emerald-400 font-bold ml-1">${price.toFixed(2)}</span>
            </div>
          </div>

          {/* SVG Vector Price Chart */}
          <div className="relative w-full h-48 md:h-56 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <filter id="chart-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Background Price Horizontal Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              {/* Area Gradient Fill under chart */}
              <polygon
                points="0,170 50,150 110,155 170,130 230,140 290,105 350,115 410,80 470,95 530,60 580,45 580,200 0,200"
                fill="url(#chart-area-grad)"
              />

              {/* Neon Vector Trend Line */}
              <path
                d="M 0 170 Q 30 160, 50 150 T 110 155 T 170 130 T 230 140 T 290 105 T 350 115 T 410 80 T 470 95 T 530 60 L 580 45"
                fill="none"
                stroke="url(#chart-line-grad)"
                strokeWidth="2.8"
                strokeLinecap="round"
                filter="url(#chart-glow)"
              />

              {/* Dynamic Live Price Point Cursor */}
              <circle cx="580" cy="45" r="5" fill="#34d399" filter="url(#chart-glow)" />
              <circle cx="580" cy="45" r="10" fill="none" stroke="#10b981" strokeWidth="1.5" className="animate-ping" />

              {/* Volume Bars at Bottom */}
              {[
                { x: 30, h: 22 }, { x: 70, h: 35 }, { x: 110, h: 18 }, { x: 150, h: 42 },
                { x: 190, h: 28 }, { x: 230, h: 45 }, { x: 270, h: 60 }, { x: 310, h: 38 },
                { x: 350, h: 52 }, { x: 390, h: 70 }, { x: 430, h: 48 }, { x: 470, h: 65 },
                { x: 510, h: 80 }, { x: 550, h: 75 },
              ].map((bar, i) => (
                <rect
                  key={i}
                  x={bar.x}
                  y={200 - bar.h}
                  width="12"
                  height={bar.h}
                  rx="1"
                  fill="rgba(16, 185, 129, 0.22)"
                />
              ))}
            </svg>

            {/* Sweeping laser cursor */}
            <motion.div
              animate={{ x: ['-20%', '110%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent pointer-events-none"
            />
          </div>

          {/* Interactive Trade Execution Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10 font-mono text-xs">
            <div className="flex items-center gap-2 text-white/50 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {lastAction
                  ? `Execution Confirmed: ${lastAction}`
                  : 'Execute zero-risk simulated trades on live market models'}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleTrade('BUY')}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 transition-all duration-200 hover:scale-105 active:scale-95 font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <span>+ SIMULATE BUY</span>
              </button>
              <button
                type="button"
                onClick={() => handleTrade('SELL')}
                disabled={shares < 25}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all duration-200 hover:scale-105 active:scale-95 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>- SIMULATE SELL</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Narrative Description */}
        {milestone.description && (
          <div className="relative z-10">
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
              {milestone.description}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
