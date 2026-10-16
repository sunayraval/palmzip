'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type Category = 'all' | 'robotics-ai' | 'ventures' | 'software' | 'community';

interface Project {
  id: string;
  title: string;
  category: Category;
  categoryLabel: string;
  badge?: string;
  affiliation: string;
  dateTag: string;
  description: string;
  accolades?: string;
  stats?: string;
  tech: string[];
  link?: string;
  linkLabel?: string;
  storyLink?: string;
  highlightColor: 'cyan' | 'gold' | 'emerald' | 'blue';
}

const PROJECTS: Project[] = [
  {
    id: 'pulse-robot',
    title: 'P.U.L.S.E. Physical Robot',
    category: 'robotics-ai',
    categoryLabel: 'Robotics & Edge AI',
    badge: 'Hardware & Edge AI',
    affiliation: 'Johns Hopkins Applied Physics Laboratory (ASPIRE)',
    dateTag: 'Research Initiative',
    description: 'An embodied robotics system coupling local Vision-Language Models with onboard Raspberry Pi & Arduino microcontrollers for autonomous obstacle detection, spatial reasoning, and voice-directed physical navigation.',
    accolades: 'Featured Project at JHU APL ASPIRE Showcase',
    tech: ['Vision-Language Models', 'Edge AI', 'Raspberry Pi', 'Arduino', 'LiDAR & Sonar', 'Python', 'Autonomous Navigation'],
    link: 'https://aspireshowcase.dunked.com/pulse-physical-unit-for-language-sight-and-execution',
    linkLabel: 'View APL Showcase',
    storyLink: '/story',
    highlightColor: 'cyan',
  },
  {
    id: 'multi-agent-planning',
    title: 'Centralized Multi-Agent Planning',
    category: 'robotics-ai',
    categoryLabel: 'Autonomous Systems Research',
    badge: 'Research Publication',
    affiliation: 'JHU Applied Physics Laboratory (Pixel 2 Pathways)',
    dateTag: 'ASPIRE Research Paper',
    description: 'Centralized Vision-Language Model coordinator orchestrating collaborative multi-agent trajectories, sequential cooperative stacking, and synchronized goal completion across dynamic physical environments.',
    accolades: 'Formal Research Paper: Pixel 2 Pathways',
    tech: ['Multi-Agent Coordination', 'VLM Reasoning', 'Trajectory Optimization', 'Sim-to-Real', 'Autonomous Control'],
    link: 'https://lnkd.in/p/ecyCSXbM',
    linkLabel: 'Read Publication',
    storyLink: '/story',
    highlightColor: 'cyan',
  },
  {
    id: 'baghealthcare',
    title: 'Blue and Gold Healthcare',
    category: 'ventures',
    categoryLabel: 'HealthTech & Operations',
    badge: 'Core Venture',
    affiliation: 'Co-Founder, COO & CTO',
    dateTag: 'Late 2022 – Ongoing',
    description: 'Comprehensive hospital staffing platform and venture addressing clinical labor shortages. Engineered scalable operational workflows, shift allocations, and enterprise technology infrastructures.',
    accolades: '2024 TiE University (TiE U) NJ Finals • Rising Young Entrepreneurs',
    tech: ['Healthcare Operations', 'Enterprise Architecture', 'Clinical Logistics', 'Executive Strategy', 'Pitch Circuits'],
    link: 'https://baghealthcare.com',
    linkLabel: 'baghealthcare.com',
    storyLink: '/story',
    highlightColor: 'gold',
  },
  {
    id: 'noteway',
    title: 'Noteway',
    category: 'software',
    categoryLabel: 'AI & EdTech',
    badge: 'Award Winner',
    affiliation: 'UC Berkeley Business Academy for Youth (BBAY)',
    dateTag: 'Summer 2022',
    description: 'AI-driven educational platform designed for university students, intelligently transcribing lectures and structuring complex discourse into intuitive, searchable study syntheses.',
    accolades: 'Golden Bear Award for Leadership (UC Berkeley)',
    tech: ['AI Note Synthesis', 'NLP Processing', 'Web Application', 'Product Architecture'],
    storyLink: '/story',
    highlightColor: 'emerald',
  },
  {
    id: 'stock-simulator',
    title: 'Stock Trading Simulator',
    category: 'software',
    categoryLabel: 'FinTech & Software',
    badge: 'Financial Systems',
    affiliation: 'Independent Development',
    dateTag: 'August 2023',
    description: 'Interactive stock market simulation engine allowing users to execute virtual trades, track simulated equity portfolios, and stress-test real-time trading strategies with zero capital risk.',
    tech: ['FinTech Simulation', 'Market Data Processing', 'Portfolio Analytics', 'TypeScript', 'Next.js'],
    storyLink: '/story',
    highlightColor: 'emerald',
  },
  {
    id: 'financial-literacy-club',
    title: 'Howard High Financial Literacy Club',
    category: 'community',
    categoryLabel: 'Community & Education',
    badge: 'Founder & President',
    affiliation: 'Howard High School',
    dateTag: '2023 – Present',
    description: 'Founded and expanded a student-led organization demystifying real-world personal finance and college budgeting. Convened guest lectures with university professors, financial leaders, and business faculty.',
    stats: '300+ Students Impacted • 20+ Sessions Held • 3 Large Community Events',
    tech: ['Financial Education', 'Community Leadership', 'Executive Speaker Series', 'Student Mentorship'],
    storyLink: '/story',
    highlightColor: 'blue',
  },
  {
    id: 'cross-country-circuit',
    title: 'Cross-Country Circuit & FBLA Nationals',
    category: 'ventures',
    categoryLabel: 'Venture & Pitch Circuits',
    badge: 'National Competitor',
    affiliation: 'FBLA Nationals & UC Berkeley BBAY',
    dateTag: 'Summer 2025',
    description: 'Competed at the FBLA National Leadership Conference in Anaheim, CA following 4th place at States. Pitched founder collaboration platform at UC Berkeley BBAY to venture mentors.',
    accolades: '2x Golden Bear Award for Leadership • 2nd Place BBAY Final Pitch Competition',
    tech: ['Business Plan Pitching', 'Founder Networking Platform', 'National Competition'],
    storyLink: '/story',
    highlightColor: 'gold',
  },
  {
    id: 'vending-machine',
    title: 'Cardboard Vending Machine',
    category: 'software',
    categoryLabel: 'Mechanical Engineering',
    badge: 'Foundational Prototype',
    affiliation: 'Early Mechanical Engineering',
    dateTag: 'Foundational',
    description: 'Fully functional dispensing mechanism fabricated entirely from recycled cardboard, reverse-engineering mechanical coin validation and gravity-fed inventory delivery.',
    accolades: 'The foundational hands-on spark for systems engineering and prototyping.',
    tech: ['Mechanical Prototyping', 'Reverse Engineering', 'Kinematic Logic'],
    storyLink: '/story',
    highlightColor: 'emerald',
  },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'robotics-ai', label: 'Robotics & AI' },
  { id: 'ventures', label: 'Ventures & HealthTech' },
  { id: 'software', label: 'Software & FinTech' },
  { id: 'community', label: 'Community' },
];

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const filteredProjects = selectedCategory === 'all'
    ? PROJECTS
    : PROJECTS.filter(p => p.category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[var(--color-brand-cyan)] selection:text-white relative flex flex-col">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(4,75,54,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(195,154,63,0.08)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10 h-16 sm:h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--color-brand-emerald)] to-[var(--color-brand-cyan)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_var(--color-brand-cyan)] transition-all">
            <span className="text-white font-bold text-xs sm:text-sm tracking-tighter">SR</span>
          </div>
          <span className="text-white/90 font-semibold tracking-wide hidden sm:block group-hover:text-white transition-colors">
            SUNAY RAVAL
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm">
          <Link href="/" className="text-white/70 hover:text-white transition-colors px-2 py-1 rounded">
            Home
          </Link>
          <span className="text-white font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
            Projects
          </span>
          <Link href="/story" className="text-white/70 hover:text-white transition-colors px-2 py-1 rounded">
            Story
          </Link>
          <Link href="/senior-countdown" className="text-[var(--color-brand-gold)] hover:text-amber-300 transition-colors px-2 py-1 rounded flex items-center gap-1 font-medium">
            <span>Senior Countdown</span>
            <span className="text-xs">↗</span>
          </Link>
          <a
            href="https://www.linkedin.com/in/sunay-raval-326215245/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-[var(--color-brand-cyan)] transition-colors hidden md:block px-2 py-1"
          >
            Contact
          </a>
        </nav>
      </header>

      {/* Hero Header */}
      <section className="pt-12 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-start gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--color-brand-emerald)]/40 bg-[var(--color-brand-emerald)]/10 text-[var(--color-brand-cyan)] text-xs font-mono tracking-wider"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-cyan)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand-cyan)]"></span>
            </span>
            PORTFOLIO & INITIATIVES
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white"
          >
            <span
              className="font-normal italic tracking-normal block text-white/90 text-3xl sm:text-5xl md:text-6xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Curated
            </span>
            PROJECTS & RESEARCH
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 text-sm sm:text-lg max-w-2xl leading-relaxed mt-1"
          >
            Autonomous vision-language robotics, healthcare operations, venture pitch circuits, and student empowerment initiatives engineered from zero to execution.
          </motion.p>
        </div>

        {/* Featured Callout: Senior Countdown Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 sm:mt-12"
        >
          <Link
            href="/senior-countdown"
            className="group relative overflow-hidden rounded-2xl border border-[var(--color-brand-gold)]/30 bg-gradient-to-r from-amber-950/20 via-zinc-950 to-black p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:border-[var(--color-brand-gold)]/60 hover:shadow-[0_0_25px_rgba(195,154,63,0.15)]"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/30 flex items-center justify-center shrink-0 text-lg group-hover:scale-105 transition-transform">
                ⏳
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-brand-gold)] animate-pulse" />
                  <span className="text-[11px] font-mono tracking-widest text-[var(--color-brand-gold)] uppercase">Milestone Portal</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[var(--color-brand-gold)] transition-colors">
                  Senior Countdown
                </h3>
                <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                  Track the journey and upcoming senior milestones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/90 group-hover:text-[var(--color-brand-gold)] transition-colors px-4 py-2 rounded-full bg-white/5 border border-white/10 group-hover:border-[var(--color-brand-gold)]/40 shrink-0 self-end sm:self-center">
              <span>View Senior Countdown</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center gap-2 overflow-x-auto pb-2 pt-8 sm:pt-12 scrollbar-none"
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                    : 'bg-zinc-900/80 text-white/70 border border-white/10 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* Projects Grid */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full pb-20 sm:pb-32 flex-1">
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map(project => {
              const borderAccent =
                project.highlightColor === 'cyan'
                  ? 'hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]'
                  : project.highlightColor === 'gold'
                  ? 'hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(195,154,63,0.15)]'
                  : project.highlightColor === 'emerald'
                  ? 'hover:border-emerald-400/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                  : 'hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]';

              const badgeColor =
                project.highlightColor === 'cyan'
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300'
                  : project.highlightColor === 'gold'
                  ? 'border-[var(--color-brand-gold)]/30 bg-amber-950/40 text-amber-300'
                  : project.highlightColor === 'emerald'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                  : 'border-blue-500/30 bg-blue-950/40 text-blue-300';

              return (
                <motion.article
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className={`bg-[#0a0d10]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${borderAccent} group relative overflow-hidden`}
                >
                  {/* Subtle top border gradient accent */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-[var(--color-brand-cyan)] transition-all" />

                  <div>
                    {/* Header meta badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeColor}`}>
                          {project.categoryLabel}
                        </span>
                        {project.badge && (
                          <span className="text-[11px] text-white/60 font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {project.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40 font-mono">
                        {project.dateTag}
                      </span>
                    </div>

                    {/* Affiliation */}
                    <p className="text-xs font-medium text-[var(--color-brand-gold)] mb-1 tracking-wide">
                      {project.affiliation}
                    </p>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-[var(--color-brand-cyan)] transition-colors mb-3">
                      {project.title}
                    </h2>

                    {/* Description */}
                    <p className="text-white/70 text-sm leading-relaxed mb-5">
                      {project.description}
                    </p>

                    {/* Accolades or Stats Callout */}
                    {project.accolades && (
                      <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                        <span className="text-amber-400 text-sm shrink-0">✦</span>
                        <p className="text-xs text-white/85 font-medium leading-relaxed">
                          {project.accolades}
                        </p>
                      </div>
                    )}

                    {project.stats && (
                      <div className="mb-5 p-3 rounded-xl bg-[var(--color-brand-emerald)]/10 border border-[var(--color-brand-emerald)]/30 flex items-start gap-2.5">
                        <span className="text-emerald-400 text-sm shrink-0">📈</span>
                        <p className="text-xs text-emerald-200 font-mono leading-relaxed">
                          {project.stats}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Tech Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10 mb-5">
                      {project.tech.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-900 border border-white/10 text-white/70 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center gap-3">
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all shadow-md group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                          <span>{project.linkLabel || 'Visit Link'}</span>
                          <span>↗</span>
                        </a>
                      )}
                      {project.storyLink && (
                        <Link
                          href={project.storyLink}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-medium transition-colors"
                        >
                          <span>Read Story</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-4 sm:px-6 lg:px-12 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Sunay Raval. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/projects" className="text-white font-medium">Projects</Link>
            <Link href="/story" className="hover:text-white transition-colors">Story</Link>
            <Link href="/senior-countdown" className="text-[var(--color-brand-gold)] hover:text-amber-300 transition-colors">Senior Countdown</Link>
            <a
              href="https://www.linkedin.com/in/sunay-raval-326215245/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
