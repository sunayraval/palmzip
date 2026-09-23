'use client';

import { motion } from 'framer-motion';

export function FutureMilestonesSection({
  milestone,
  innerRef,
}: {
  milestone?: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.section
      id={milestone?.id || 'future-milestones'}
      ref={innerRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full scroll-mt-28 transform-gpu"
    >
      <div className="relative p-8 md:p-12 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center overflow-hidden group">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.04)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-cyan)] animate-pulse" />
          <span className="text-[11px] font-mono text-white/40 tracking-[0.25em] uppercase">
            Future
          </span>
        </div>

        <h3 className="relative z-10 text-2xl md:text-3xl font-light tracking-tight text-white/90">
          More to come.
        </h3>
      </div>
    </motion.section>
  );
}
