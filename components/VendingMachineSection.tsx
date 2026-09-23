'use client';

import { motion } from 'framer-motion';

export function VendingMachineSection({
  milestone,
  innerRef,
}: {
  milestone: any;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.section
      id={milestone.id}
      ref={innerRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full scroll-mt-28 transform-gpu"
    >
      <div className="relative p-8 md:p-12 rounded-3xl border border-white/15 bg-[#0a0a0a] shadow-[0_0_60px_rgba(0,0,0,0.85)] hover:border-cyan-500/40 transition-colors duration-300 flex flex-col gap-8 overflow-hidden group transform-gpu">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.1)_0%,transparent_70%)] pointer-events-none" />

        {/* 1. Header Row: Chronology & Category */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
              // {milestone.dateTag} • {milestone.category}
            </p>
            <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
              Applied Mechanical Prototyping
            </span>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Core Origin Prototype</span>
          </div>
        </div>

        {/* 2. Title */}
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/95">
            {milestone.title}
          </h2>
        </div>

        {/* 3. Narrative Description */}
        {milestone.description && (
          <div className="relative z-10">
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
              {milestone.description}
            </p>
          </div>
        )}

        {/* 4. Accolade / Key Takeaway */}
        {milestone.accolades?.[0] && (
          <div className="relative z-10 p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-4">
            <span className="w-2 h-2 mt-2 rounded-full bg-[var(--color-brand-gold)] shadow-[0_0_8px_var(--color-brand-gold)] shrink-0" />
            <span className="text-sm md:text-base text-white/90 font-medium leading-relaxed">
              {milestone.accolades[0]}
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}
