import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Senior Countdown | Sunay Raval",
  description: "Senior Countdown page",
};

export default function SeniorCountdownPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-[var(--color-brand-cyan)] selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10 h-16 sm:h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--color-brand-emerald)] to-[var(--color-brand-cyan)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_var(--color-brand-cyan)] transition-all">
            <span className="text-white font-bold text-xs sm:text-sm tracking-tighter">SR</span>
          </div>
          <span className="text-white/90 font-semibold tracking-wide hidden sm:block group-hover:text-white transition-colors">
            SUNAY RAVAL
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
          <Link href="/" className="text-white/70 hover:text-white transition-colors px-2 py-1 rounded">
            Home
          </Link>
          <Link href="/projects" className="text-white/70 hover:text-white transition-colors px-2 py-1 rounded">
            Projects
          </Link>
          <Link href="/story" className="text-white/70 hover:text-white transition-colors px-2 py-1 rounded">
            Story
          </Link>
          <span className="text-[var(--color-brand-gold)] font-medium px-2 py-1 bg-white/5 rounded border border-[var(--color-brand-gold)]/20">
            Senior Countdown
          </span>
        </nav>
      </header>

      {/* Main Content (Minimal placeholder as requested) */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,rgba(4,75,54,0.06)_40%,transparent_70%)] blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/60 mb-6 font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-gold)] animate-pulse" />
          Page Initialized
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
          Senior Countdown
        </h1>

        <p className="text-white/50 text-sm sm:text-base max-w-md mb-8">
          This page is ready for your countdown milestones.
        </p>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 border border-white/10 hover:border-white/20"
        >
          <span>← Back to Projects</span>
        </Link>
      </section>
    </main>
  );
}
