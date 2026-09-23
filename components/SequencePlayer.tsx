'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScroll, useTransform, MotionValue } from 'framer-motion';

interface SequencePlayerProps {
  folder: string;
  frameCount: number;
  scrollTarget?: React.RefObject<HTMLElement | null>;
  scrollProgress?: MotionValue<number>;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  fps?: number;
}

export function SequencePlayer({
  folder,
  frameCount,
  scrollTarget,
  scrollProgress: externalScrollProgress,
  className = '',
  autoPlay = false,
  loop = true,
  fps = 24,
}: SequencePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastDrawnFrameRef = useRef<number>(-1);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  // Initialize imagesRef array
  if (imagesRef.current.length !== frameCount) {
    imagesRef.current = new Array(frameCount).fill(null);
  }

  // Handle Scroll Progress
  const { scrollYProgress: internalScrollProgress } = useScroll({
    target: scrollTarget,
    offset: ['start end', 'end start'],
  });

  const activeProgress = externalScrollProgress || internalScrollProgress;
  const scrollFrameIndex = useTransform(activeProgress, [0, 1], [0, frameCount - 1]);

  const renderFrame = useCallback(
    (targetIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const images = imagesRef.current;
      // Search backwards for nearest loaded frame
      let index = targetIndex;
      while (index >= 0 && (!images[index] || !images[index]!.complete || images[index]!.naturalWidth === 0)) {
        index--;
      }
      // If none found backwards, search forwards
      if (index < 0) {
        index = targetIndex;
        while (index < frameCount && (!images[index] || !images[index]!.complete || images[index]!.naturalWidth === 0)) {
          index++;
        }
      }
      if (index < 0 || index >= frameCount) return;

      const img = images[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const { width, height } = dimensionsRef.current;
      if (!width || !height) return;

      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;

      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      if (imgRatio > canvasRatio) {
        drawW = width;
        drawH = drawW / imgRatio;
        drawX = 0;
        drawY = (height - drawH) / 2;
      } else {
        drawH = height;
        drawW = drawH * imgRatio;
        drawX = (width - drawW) / 2;
        drawY = 0;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      lastDrawnFrameRef.current = index;
    },
    [frameCount]
  );

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const clientW = parent.clientWidth;
    const clientH = parent.clientHeight;

    canvas.width = clientW * dpr;
    canvas.height = clientH * dpr;
    ctx.scale(dpr, dpr);
    dimensionsRef.current = { width: clientW, height: clientH };

    if (lastDrawnFrameRef.current >= 0) {
      renderFrame(lastDrawnFrameRef.current);
    } else {
      renderFrame(0);
    }
  }, [renderFrame]);

  // Priority Tiered Loading for WebP
  useEffect(() => {
    let isMounted = true;

    const loadImage = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) {
          resolve(imagesRef.current[index]!);
          return;
        }
        const img = new Image();
        const paddedIndex = (index + 1).toString().padStart(3, '0');
        img.src = `${folder}/ezgif-frame-${paddedIndex}.webp`;

        img.onload = () => {
          if (!isMounted) return;
          imagesRef.current[index] = img;
          if (index === 0) {
            setFirstFrameLoaded(true);
            if (lastDrawnFrameRef.current < 0) {
              renderFrame(0);
            }
          }
          resolve(img);
        };
        img.onerror = () => {
          // Fallback to png if webp fails
          img.src = `${folder}/ezgif-frame-${paddedIndex}.png`;
        };
      });
    };

    const loadAll = async () => {
      // Tier 1: Frame 1 immediately
      await loadImage(0);
      if (!isMounted) return;

      // Tier 2: Keyframes (every 5th frame)
      const keyframes: number[] = [];
      for (let i = 5; i < frameCount; i += 5) {
        keyframes.push(i);
      }
      if (keyframes[keyframes.length - 1] !== frameCount - 1) {
        keyframes.push(frameCount - 1);
      }

      const loadBatch = async (indices: number[]) => {
        const pool = 6;
        for (let i = 0; i < indices.length; i += pool) {
          if (!isMounted) return;
          const chunk = indices.slice(i, i + pool);
          await Promise.all(chunk.map((idx) => loadImage(idx)));
        }
      };

      await loadBatch(keyframes);
      if (!isMounted) return;

      // Tier 3: In-between frames
      const remaining: number[] = [];
      for (let i = 1; i < frameCount; i++) {
        if (!imagesRef.current[i]) {
          remaining.push(i);
        }
      }
      await loadBatch(remaining);
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [folder, frameCount, renderFrame]);

  // Handle Resize
  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Handle Scroll or Autoplay
  useEffect(() => {
    let animationFrameId: number;
    let autoPlayIndex = 0;

    if (autoPlay) {
      let lastTimestamp = performance.now();
      const frameInterval = 1000 / Math.max(1, fps);

      const playLoop = (currentTimestamp: number) => {
        const elapsed = currentTimestamp - lastTimestamp;

        if (elapsed >= frameInterval) {
          lastTimestamp = currentTimestamp - (elapsed % frameInterval);
          renderFrame(autoPlayIndex);
          autoPlayIndex++;

          if (autoPlayIndex >= frameCount) {
            if (loop) {
              autoPlayIndex = 0; // Seamless continuous infinite loop!
            } else {
              renderFrame(frameCount - 1);
              return;
            }
          }
        }
        animationFrameId = requestAnimationFrame(playLoop);
      };

      animationFrameId = requestAnimationFrame(playLoop);
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    } else {
      const unsubscribe = scrollFrameIndex.on('change', (latest) => {
        const index = Math.round(latest);
        if (index >= 0 && index < frameCount) {
          renderFrame(index);
        }
      });
      renderFrame(Math.round(scrollFrameIndex.get() || 0));
      return () => {
        unsubscribe();
      };
    }
  }, [autoPlay, frameCount, renderFrame, scrollFrameIndex, loop, fps]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Instant First-Frame Base (renders immediately without delay) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${folder}/ezgif-frame-001.webp`}
          alt="Sequence base"
          className={`w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300 ${
            firstFrameLoaded ? 'opacity-100' : 'opacity-80'
          }`}
          loading="eager"
          decoding="sync"
        />
      </div>

      <canvas ref={canvasRef} className="relative z-10 w-full h-full block" />
    </div>
  );
}
