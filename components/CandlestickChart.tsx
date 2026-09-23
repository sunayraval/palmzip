'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CandleData {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number; // 0.1 to 1
  isGreen: boolean;
}

// Deterministic pseudo-random number generator (Mulberry32) to prevent SSR/client hydration mismatch
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate realistic financial candle series trending upwards with volatility (Edge-to-Edge Panoramic)
function generateCandleData(): CandleData[] {
  const rng = createPrng(1024);
  const candles: CandleData[] = [];
  let current = 536.0;
  const count = 56; // 56 candles for panoramic edge-to-edge span

  for (let i = 0; i < count; i++) {
    const change = (rng() - 0.44) * 3.8;
    const open = current;
    const close = +(open + change).toFixed(2);
    const high = +(Math.max(open, close) + rng() * 2.6).toFixed(2);
    const low = +(Math.min(open, close) - rng() * 2.4).toFixed(2);
    const isGreen = close >= open;
    const volume = +(0.2 + rng() * 0.75).toFixed(2);

    const totalMinutes = i * 7;
    const hour = Math.floor(9 + totalMinutes / 60);
    const min = totalMinutes % 60;
    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

    candles.push({ time, open, close, high, low, volume, isGreen });
    current = close;
  }
  return candles;
}

const INITIAL_CANDLES: CandleData[] = generateCandleData();
const INITIAL_LIVE_PRICE: number = INITIAL_CANDLES[INITIAL_CANDLES.length - 1]?.close ?? 584.6;

export function CandlestickBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<CandleData[]>(INITIAL_CANDLES);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; normX: number; normY: number } | null>(null);
  const [activeCandleIndex, setActiveCandleIndex] = useState<number | null>(null);
  const [livePrice, setLivePrice] = useState<number>(INITIAL_LIVE_PRICE);

  // Live micro-tick fluctuation on the last candle
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIdx = next.length - 1;
        const last = { ...next[lastIdx] };
        const tick = (Math.random() - 0.47) * 0.75;
        last.close = +(last.close + tick).toFixed(2);
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.isGreen = last.close >= last.open;
        next[lastIdx] = last;
        setLivePrice(last.close);
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Compute price bounds
  const minPrice = Math.min(...candles.map((c) => c.low)) - 2;
  const maxPrice = Math.max(...candles.map((c) => c.high)) + 2;
  const priceRange = Math.max(1, maxPrice - minPrice);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = Math.max(0, Math.min(1, x / rect.width));
    const normY = Math.max(0, Math.min(1, y / rect.height));

    setHoverPos({ x, y, normX, normY });

    // Identify candle nearest to cursor
    const candleIndex = Math.min(candles.length - 1, Math.max(0, Math.floor(normX * candles.length)));
    setActiveCandleIndex(candleIndex);
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
    setActiveCandleIndex(null);
  };

  // Compute hovered price value from cursor position
  const hoveredPrice = hoverPos
    ? +(maxPrice - hoverPos.normY * priceRange).toFixed(2)
    : livePrice;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto select-none opacity-40 hover:opacity-70 transition-opacity duration-700"
    >
      {/* SVG Canvas for High-DPI Panoramic Candlesticks */}
      <svg
        className="w-full h-full"
        viewBox="0 0 1800 420"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Luminous Green Neon Glow */}
          <filter id="glow-green-wide" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10b981" floodOpacity="0.65" />
          </filter>

          {/* Luminous Red Neon Glow */}
          <filter id="glow-red-wide" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#ef4444" floodOpacity="0.65" />
          </filter>

          {/* Linear Gradients for Candles */}
          <linearGradient id="green-gradient-wide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="red-gradient-wide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          {/* Volume Gradients */}
          <linearGradient id="vol-green-wide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.45)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
          </linearGradient>
          <linearGradient id="vol-red-wide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.45)" />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
          </linearGradient>
        </defs>

        {/* Horizontal Technical Grid Levels spanning full 1800px width */}
        {[0.12, 0.32, 0.52, 0.72, 0.88].map((ratio, i) => {
          const y = ratio * 320 + 20;
          const priceLevel = (maxPrice - ratio * priceRange).toFixed(1);
          return (
            <g key={i} className="opacity-20">
              <line
                x1="0"
                y1={y}
                x2="1800"
                y2={y}
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeDasharray="4 6"
              />
              <text
                x="1785"
                y={y - 4}
                fill="#ffffff"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
                className="opacity-70"
              >
                ${priceLevel}
              </text>
            </g>
          );
        })}

        {/* Candlesticks & Volume Bars */}
        {candles.map((candle, idx) => {
          const total = candles.length;
          const candleSpacing = 1800 / total;
          const xCenter = idx * candleSpacing + candleSpacing / 2;
          const bodyWidth = Math.max(9, candleSpacing * 0.65);

          // Map price to SVG Y coordinate (30px padding top/bottom)
          const chartHeight = 290;
          const chartTop = 30;

          const highY = chartTop + ((maxPrice - candle.high) / priceRange) * chartHeight;
          const lowY = chartTop + ((maxPrice - candle.low) / priceRange) * chartHeight;
          const openY = chartTop + ((maxPrice - candle.open) / priceRange) * chartHeight;
          const closeY = chartTop + ((maxPrice - candle.close) / priceRange) * chartHeight;

          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(3, Math.abs(closeY - openY));

          // Volume bars in bottom 60px
          const volMaxHeight = 50;
          const volY = 410 - candle.volume * volMaxHeight;
          const volHeight = candle.volume * volMaxHeight;

          const isHovered = activeCandleIndex === idx;
          const isLatest = idx === candles.length - 1;

          return (
            <g
              key={idx}
              className="transition-all duration-200"
              style={{
                transformOrigin: `${xCenter}px ${bodyTop + bodyHeight / 2}px`,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {/* Volume Bar */}
              <rect
                x={xCenter - bodyWidth / 2}
                y={volY}
                width={bodyWidth}
                height={volHeight}
                rx={1.5}
                fill={candle.isGreen ? 'url(#vol-green-wide)' : 'url(#vol-red-wide)'}
                opacity={isHovered ? 0.9 : 0.4}
              />

              {/* Upper & Lower Wick Line */}
              <line
                x1={xCenter}
                y1={highY}
                x2={xCenter}
                y2={lowY}
                stroke={candle.isGreen ? '#34d399' : '#f87171'}
                strokeWidth={isHovered ? 2.4 : 1.2}
                strokeLinecap="round"
                filter={isHovered || isLatest ? (candle.isGreen ? 'url(#glow-green-wide)' : 'url(#glow-red-wide)') : undefined}
                opacity={isHovered ? 1 : 0.75}
              />

              {/* Candle Body Rect */}
              <rect
                x={xCenter - bodyWidth / 2}
                y={bodyTop}
                width={bodyWidth}
                height={bodyHeight}
                rx={2}
                fill={candle.isGreen ? 'url(#green-gradient-wide)' : 'url(#red-gradient-wide)'}
                stroke={candle.isGreen ? '#6ee7b7' : '#fca5a5'}
                strokeWidth={isHovered ? 1.5 : 0.5}
                filter={isHovered || isLatest ? (candle.isGreen ? 'url(#glow-green-wide)' : 'url(#glow-red-wide)') : undefined}
                opacity={isHovered ? 1 : 0.85}
              />

              {/* Live Ticking Indicator on Latest Candle */}
              {isLatest && (
                <circle
                  cx={xCenter}
                  cy={closeY}
                  r={3.5}
                  fill={candle.isGreen ? '#10b981' : '#ef4444'}
                  className="animate-ping"
                />
              )}
            </g>
          );
        })}

        {/* Live Market Price Horizontal Line spanning full 1800 width */}
        {candles.length > 0 && (
          <g>
            {(() => {
              const lastCandle = candles[candles.length - 1];
              const chartHeight = 290;
              const chartTop = 30;
              const currentY = chartTop + ((maxPrice - lastCandle.close) / priceRange) * chartHeight;
              return (
                <>
                  <line
                    x1="0"
                    y1={currentY}
                    x2="1800"
                    y2={currentY}
                    stroke={lastCandle.isGreen ? '#10b981' : '#ef4444'}
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    opacity="0.65"
                  />
                  <rect
                    x="1725"
                    y={currentY - 9}
                    width="70"
                    height="18"
                    rx="4"
                    fill={lastCandle.isGreen ? '#047857' : '#b91c1c'}
                    className="shadow-lg"
                  />
                  <text
                    x="1760"
                    y={currentY + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ${lastCandle.close.toFixed(2)}
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* Interactive Cursor Crosshairs spanning full 1800 width */}
        {hoverPos && (
          <g className="pointer-events-none transition-opacity duration-150">
            {/* Horizontal Line */}
            <line
              x1="0"
              y1={hoverPos.normY * 420}
              x2="1800"
              y2={hoverPos.normY * 420}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
            {/* Vertical Line */}
            <line
              x1={hoverPos.normX * 1800}
              y1="0"
              x2={hoverPos.normX * 1800}
              y2="420"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
          </g>
        )}
      </svg>

      {/* Interactive Micro-HUD Tooltip when hovering over a candle */}
      {activeCandleIndex !== null && candles[activeCandleIndex] && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 left-6 z-30 pointer-events-none bg-black/90 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-3 shadow-xl"
        >
          <span className="text-white/60">TIME: {candles[activeCandleIndex].time}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">O: <strong className="text-white">${candles[activeCandleIndex].open}</strong></span>
          <span className="text-white/80">H: <strong className="text-emerald-400">${candles[activeCandleIndex].high}</strong></span>
          <span className="text-white/80">L: <strong className="text-rose-400">${candles[activeCandleIndex].low}</strong></span>
          <span className="text-white/80">
            C:{' '}
            <strong className={candles[activeCandleIndex].isGreen ? 'text-emerald-400' : 'text-rose-400'}>
              ${candles[activeCandleIndex].close}
            </strong>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              candles[activeCandleIndex].isGreen
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {candles[activeCandleIndex].isGreen ? '▲ BULLISH' : '▼ BEARISH'}
          </span>
        </motion.div>
      )}

      {/* Floating Price Pill Tag tracking Cursor Y on the Right Axis */}
      {hoverPos && (
        <div
          style={{ top: `${hoverPos.y - 10}px` }}
          className="absolute right-4 pointer-events-none bg-white text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded shadow-lg transition-transform duration-75 z-30"
        >
          ${hoveredPrice.toFixed(2)}
        </div>
      )}
    </div>
  );
}
