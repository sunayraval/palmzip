'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScroll, useSpring, motion } from 'framer-motion';

const FRAME_COUNT = 120;

export function FounderScrollCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(FRAME_COUNT).fill(null));
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastDrawnFrameRef = useRef<number>(-1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const springProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Draw frame function optimized for zero layout thrashing
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find nearest loaded frame searching backwards
    let idx = frameIndex;
    const images = imagesRef.current;
    while (idx >= 0 && (!images[idx] || !images[idx]!.complete || images[idx]!.naturalWidth === 0)) {
      idx--;
    }
    // If not found backwards, search forwards
    if (idx < 0) {
      idx = frameIndex;
      while (idx < FRAME_COUNT && (!images[idx] || !images[idx]!.complete || images[idx]!.naturalWidth === 0)) {
        idx++;
      }
    }
    if (idx < 0 || idx >= FRAME_COUNT) return;

    const img = images[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const { width, height } = dimensionsRef.current;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    // Object-fit: contain logic
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imgRatio > canvasRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastDrawnFrameRef.current = idx;
  }, []);

  // Update canvas size and re-draw current frame
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    dimensionsRef.current = { width: rect.width, height: rect.height };

    if (lastDrawnFrameRef.current >= 0) {
      drawFrame(lastDrawnFrameRef.current);
    }
  }, [drawFrame]);

  // Priority Tiered Loading:
  // Tier 1: Frame 1 immediately
  // Tier 2: Keyframes (every 4th frame) so full scrub range is ready in <200ms
  // Tier 3: In-between frames in small non-blocking chunks
  useEffect(() => {
    let isMounted = true;

    const loadImage = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) {
          resolve(imagesRef.current[index]!);
          return;
        }
        const img = new Image();
        const formatted = (index + 1).toString().padStart(3, '0');
        img.src = `/sequence/ezgif-frame-${formatted}.webp`;

        img.onload = () => {
          if (!isMounted) return;
          imagesRef.current[index] = img;
          setLoadedCount((prev) => prev + 1);
          // If this is the first frame or current active frame, draw immediately
          if (index === 0 && lastDrawnFrameRef.current < 0) {
            drawFrame(0);
          }
          resolve(img);
        };
        img.onerror = () => {
          // Fallback to png if webp fails for any reason
          img.src = `/sequence/ezgif-frame-${formatted}.png`;
        };
      });
    };

    const loadSequence = async () => {
      // Tier 1: Frame 1 loaded instantly
      await loadImage(0);
      if (!isMounted) return;

      // Tier 2: Keyframes across the sequence (every 4th frame)
      const keyframeIndices: number[] = [];
      for (let i = 4; i < FRAME_COUNT; i += 4) {
        keyframeIndices.push(i);
      }
      if (keyframeIndices[keyframeIndices.length - 1] !== FRAME_COUNT - 1) {
        keyframeIndices.push(FRAME_COUNT - 1);
      }

      // Load keyframes with concurrency limit of 6
      const loadBatch = async (indices: number[]) => {
        const pool = 6;
        for (let i = 0; i < indices.length; i += pool) {
          if (!isMounted) return;
          const chunk = indices.slice(i, i + pool);
          await Promise.all(chunk.map((idx) => loadImage(idx)));
        }
      };

      await loadBatch(keyframeIndices);
      if (!isMounted) return;

      // Tier 3: Remaining frames
      const remainingIndices: number[] = [];
      for (let i = 1; i < FRAME_COUNT; i++) {
        if (!imagesRef.current[i]) {
          remainingIndices.push(i);
        }
      }
      await loadBatch(remainingIndices);
    };

    loadSequence();

    return () => {
      isMounted = false;
    };
  }, [drawFrame]);

  // Setup canvas size listener
  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Active scroll rendering loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const progress = springProgress.get();
      const targetFrameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(progress * FRAME_COUNT)));
      drawFrame(targetFrameIndex);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [springProgress, drawFrame]);

  const loadPercent = Math.round((loadedCount / FRAME_COUNT) * 100);
  const isFullyLoaded = loadedCount >= FRAME_COUNT;

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Instant First-Frame Base Layer (Eliminates initial blank screen delay) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sequence/ezgif-frame-001.webp"
            alt="Palm Tree Animation"
            className="w-full h-full object-contain pointer-events-none select-none opacity-100"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
        </div>

        {/* Canvas - Rendered immediately on top without blocking overlays */}
        <canvas
          ref={canvasRef}
          className="relative z-10 w-full h-full object-cover block"
        />

        {/* Minimal, elegant loading indicator that does NOT block the palm tree */}
        {!isFullyLoaded && (
          <div className="absolute top-24 right-6 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-opacity duration-500 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-emerald)] animate-pulse" />
            <span className="text-white/50 text-[10px] font-mono tracking-wider uppercase">
              Buffering {loadPercent}%
            </span>
          </div>
        )}

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20"
          style={{
            opacity: useSpring(
              useScroll({ target: containerRef, offset: ['start start', 'end end'] }).scrollYProgress,
              { stiffness: 100, damping: 30 }
            ),
          }}
        >
          <motion.div
            className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
