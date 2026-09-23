'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import storyData from '@/data/story.json';
import { SequencePlayer } from '@/components/SequencePlayer';
import { 
  FounderNetworkGraph 
} from '@/components/StoryVisualizers';
import { NotewaySection } from '@/components/NotewaySection';
import { BlueAndGoldSection } from '@/components/BlueAndGoldSection';
import { CrossCountrySection } from '@/components/CrossCountrySection';
import { CofindrSection } from '@/components/CofindrSection';
import { VendingMachineSection } from '@/components/VendingMachineSection';
import { StockSimulatorSection } from '@/components/StockSimulatorSection';
import { PulseRobotSection } from '@/components/PulseRobotSection';
import { MultiAgentPlanningSection } from '@/components/MultiAgentPlanningSection';
import { FutureMilestonesSection } from '@/components/FutureMilestonesSection';
import { TimelineFlowConnector, TimelineContinuousSpine } from '@/components/TimelineFlowLine';
import Link from 'next/link';

function getShortDate(dateTag: string): string {
  if (!dateTag) return '';
  if (dateTag.toLowerCase().includes('aspire')) return 'ASPIRE';
  if (dateTag.includes('2022') && dateTag.includes('Ongoing')) return '2022+';
  if (dateTag.includes('2022')) return '2022';
  if (dateTag.includes('2023')) return '2023';
  if (dateTag.includes('2024')) return '2024';
  if (dateTag.includes('2025')) return '2025';
  if (dateTag.includes('2026')) return '2026';
  if (dateTag.toLowerCase().includes('5th grade') || dateTag.toLowerCase().includes('foundational')) return 'Origin';
  if (dateTag.toLowerCase().includes('upcoming')) return 'Future';
  return dateTag.slice(0, 6);
}

/* -------------------------------------------------------------------------- */
/*                         VERTICAL TIMELINE BAR COMPONENT                    */
/* -------------------------------------------------------------------------- */

function VerticalTimelineBar({ milestones }: { milestones: any[] }) {
  const [activeId, setActiveId] = useState<string>(milestones[0]?.id || '');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dotProgress, setDotProgress] = useState<number>(0);
  const [sectionScrollYs, setSectionScrollYs] = useState<number[]>([]);

  // Fixed, beautifully spaced vertical percentages along the full-height rail (0% to 100%)
  const nodePercents = milestones.map((_, idx) => {
    const total = milestones.length;
    const start = total <= 3 ? 25 : 16;
    const end = 88;
    if (total <= 1) return 50;
    return start + (idx / (total - 1)) * (end - start);
  });

  // Measure exact document scroll positions for each milestone section
  useEffect(() => {
    const measureSections = () => {
      const positions = milestones.map((m) => {
        const el = document.getElementById(m.id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        // Target scroll when the section top is comfortably below the fixed nav
        return Math.max(0, window.scrollY + rect.top - 120);
      });
      setSectionScrollYs(positions);
    };

    measureSections();
    const t1 = setTimeout(measureSections, 200);
    const t2 = setTimeout(measureSections, 700);
    const t3 = setTimeout(measureSections, 1800);
    window.addEventListener('resize', measureSections);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', measureSections);
    };
  }, [milestones]);

  // Synchronize dot position and active milestone 1:1 with scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;
      const maxScroll = Math.max(1, scrollHeight - innerHeight);

      if (sectionScrollYs.length === 0 || sectionScrollYs.every((y) => y === 0)) {
        const raw = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
        setDotProgress(raw);
        return;
      }

      // 1. Piecewise interpolation so the dot is GUARANTEED to hit nodePercents[i] at sectionScrollYs[i]
      let calculated = 0;
      if (scrollY <= 0) {
        calculated = 0;
      } else if (scrollY < sectionScrollYs[0]) {
        const factor = scrollY / Math.max(1, sectionScrollYs[0]);
        calculated = factor * nodePercents[0];
      } else if (scrollY >= sectionScrollYs[sectionScrollYs.length - 1]) {
        const lastIdx = sectionScrollYs.length - 1;
        const remaining = Math.max(1, maxScroll - sectionScrollYs[lastIdx]);
        const factor = Math.min(1, Math.max(0, (scrollY - sectionScrollYs[lastIdx]) / remaining));
        calculated = nodePercents[lastIdx] + factor * (100 - nodePercents[lastIdx]);
      } else {
        for (let i = 0; i < sectionScrollYs.length - 1; i++) {
          if (scrollY >= sectionScrollYs[i] && scrollY < sectionScrollYs[i + 1]) {
            const span = sectionScrollYs[i + 1] - sectionScrollYs[i];
            const factor = span > 0 ? (scrollY - sectionScrollYs[i]) / span : 0;
            calculated = nodePercents[i] + factor * (nodePercents[i + 1] - nodePercents[i]);
            break;
          }
        }
      }
      setDotProgress(calculated);

      // 2. Determine active milestone using exact midpoints between sections
      let currentActiveId = milestones[0]?.id || '';
      for (let i = 0; i < sectionScrollYs.length; i++) {
        const prevMid = i === 0 ? 0 : (sectionScrollYs[i - 1] + sectionScrollYs[i]) / 2;
        const nextMid =
          i === sectionScrollYs.length - 1
            ? Infinity
            : (sectionScrollYs[i] + sectionScrollYs[i + 1]) / 2;

        if (scrollY >= prevMid && scrollY < nextMid) {
          currentActiveId = milestones[i].id;
          break;
        }
      }
      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [milestones, sectionScrollYs, nodePercents]);

  const scrollToMilestone = (idx: number) => {
    const targetY = sectionScrollYs[idx];
    if (typeof targetY === 'number') {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    } else {
      const el = document.getElementById(milestones[idx].id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const activeMilestone = milestones.find((m) => m.id === activeId) || milestones[0];
  const activeYear = activeMilestone ? getShortDate(activeMilestone.dateTag) : '';

  return (
    <div className="fixed right-1 sm:right-3 md:right-8 top-20 sm:top-24 bottom-6 z-40 flex flex-col items-end pointer-events-auto select-none">
      {/* Time & Chronology HUD Header */}
      <div className="hidden sm:flex items-center gap-2 mb-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
        <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-brand-cyan)] flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-[var(--color-brand-cyan)]" />
        </div>
        <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase">
          {activeYear}
        </span>
      </div>

      {/* Full-Height Vertical Timeline Rail Track (Takes up the whole up and down) */}
      <div className="relative w-full flex-1 pr-2 sm:pr-3">
        {/* Background Track Line running the full vertical height */}
        <div className="absolute right-[5px] top-0 bottom-0 w-[2px] bg-white/10 rounded-full" />

        {/* Dynamic Progress Fill Beam: matches exact dot progress */}
        <div
          style={{ height: `${dotProgress}%` }}
          className="absolute right-[5px] top-0 w-[2px] bg-gradient-to-b from-[var(--color-brand-cyan)] via-[var(--color-brand-emerald)] to-[var(--color-brand-gold)] rounded-full shadow-[0_0_12px_var(--color-brand-cyan)] origin-top transition-none"
        />

        {/* Moving Time Needle Bead: Directly at your exact position as you scroll */}
        <div
          style={{ top: `${dotProgress}%` }}
          className="absolute right-[0px] w-3 h-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_var(--color-brand-cyan),0_0_6px_white] pointer-events-none z-30 flex items-center justify-center transition-none"
        >
          <span className="absolute -inset-1 rounded-full bg-[var(--color-brand-cyan)] animate-ping opacity-60 pointer-events-none" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-cyan)]" />
        </div>

        {/* Milestone Node Points mapped to exact positions on rail */}
        {milestones.map((m, idx) => {
          const isActive = m.id === activeId;
          const isHovered = m.id === hoveredId;
          const shortDate = getShortDate(m.dateTag);
          const topPercent = nodePercents[idx];

          return (
            <div
              key={m.id}
              style={{ top: `${topPercent}%` }}
              className="absolute right-0 -translate-y-1/2 flex items-center gap-3 cursor-pointer group py-1 z-20"
              onClick={() => scrollToMilestone(idx)}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Year & Title Label (slides out on hover or active) */}
              <div
                className={`hidden sm:flex items-center gap-2 transition-all duration-300 ${
                  isActive
                    ? 'opacity-100 translate-x-0'
                    : isHovered
                    ? 'opacity-90 translate-x-0'
                    : 'opacity-40 translate-x-1 hover:opacity-80'
                }`}
              >
                {/* Milestone Name Preview (Visible when active or hovered) */}
                {(isActive || isHovered) && (
                  <span className="text-[10px] font-mono text-white/80 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 shadow-lg whitespace-nowrap">
                    {m.title}
                  </span>
                )}

                {/* Year Pill Tag */}
                <span
                  className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-[var(--color-brand-cyan)]/20 text-[var(--color-brand-cyan)] border border-[var(--color-brand-cyan)]/50 font-bold shadow-[0_0_12px_rgba(0,255,255,0.25)]'
                      : 'text-white/60 hover:text-white bg-black/40 border border-white/5'
                  }`}
                >
                  {shortDate}
                </span>
              </div>

              {/* Node Dot on Rail */}
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <span className="absolute w-5 h-5 rounded-full bg-[var(--color-brand-cyan)]/30 animate-pulse pointer-events-none" />
                )}
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border ${
                    isActive
                      ? 'bg-white border-[var(--color-brand-cyan)] shadow-[0_0_10px_var(--color-brand-cyan)] scale-125'
                      : isHovered
                      ? 'bg-white/80 border-white/60 scale-110'
                      : 'bg-[#050505] border-white/30 group-hover:border-white/70'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Footer Tag */}
      <div className="hidden sm:block mt-3 text-[9px] font-mono text-white/30 tracking-widest uppercase">
        // CHRONOLOGY
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN STORY PAGE                              */
/* -------------------------------------------------------------------------- */

export function StoryPageView({
  customStoryData,
  defaultTab,
  isPreview = false,
}: {
  customStoryData?: any;
  defaultTab?: string;
  isPreview?: boolean;
}) {
  const currentData = customStoryData || storyData;
  const initialTab = defaultTab || currentData.tabs[0]?.id || 'entrepreneurship';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (defaultTab && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && currentData.tabs?.some((t: any) => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [defaultTab, currentData]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const activeTabData = currentData.tabs?.find((t: any) => t.id === activeTab) || currentData.tabs?.[0];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[var(--color-brand-cyan)] selection:text-white relative">
      {/* Sleek Navigation Bar */}
      <header className={`${isPreview ? 'absolute' : 'fixed'} top-0 inset-x-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5 h-16 sm:h-20 px-3 sm:px-6 lg:px-12 flex items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--color-brand-emerald)] to-[var(--color-brand-cyan)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_var(--color-brand-cyan)] transition-all cursor-pointer">
            <span className="text-white font-bold text-sm tracking-tighter">SR</span>
          </div>
          <span className="text-white/90 font-semibold tracking-wide hidden sm:block group-hover:text-white transition-colors">
            SUNAY RAVAL
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          {currentData.tabs?.map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.id === 'technology' ? 'Technology' : 'Ventures'}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Floating Vertical Timeline Bar (Right side) */}
      {activeTabData && <VerticalTimelineBar milestones={activeTabData.milestones} />}

      {/* Dynamic Tab Content */}
      <div className="pt-16 sm:pt-20">
        {activeTabData?.id === 'entrepreneurship' ? (
          <EntrepreneurshipSections
            data={activeTabData}
            onContinueToTech={() => {
              handleTabChange('technology');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <TechnologySections
            data={activeTabData}
            onReturnToVentures={() => {
              handleTabChange('entrepreneurship');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </main>
  );
}

export default function StoryPage() {
  return <StoryPageView />;
}

/* -------------------------------------------------------------------------- */
/*                        SHARED EVENT SECTION COMPONENT                      */
/* -------------------------------------------------------------------------- */

function EventSection({
  milestone,
  index,
  innerRef,
}: {
  milestone: any;
  index: number;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const isEven = index % 2 === 0;

  return (
    <motion.section
      id={milestone.id}
      ref={innerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center scroll-mt-28"
    >
      {/* Narrative Info Column */}
      <div className={`flex flex-col gap-4 sm:gap-6 items-start ${isEven ? 'md:order-1' : 'md:order-2'}`}>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.15em] uppercase">
            // {milestone.dateTag} {milestone.category ? `• ${milestone.category}` : ''}
          </p>
          {milestone.role && (
            <span className="text-xs font-mono text-[var(--color-brand-gold)] tracking-wider uppercase">
              {milestone.role}
            </span>
          )}
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white/95 leading-tight">
          {milestone.title}
        </h2>

        {milestone.description && (
          <p className="text-base md:text-xl text-white/60 font-light leading-relaxed">
            {milestone.description}
          </p>
        )}

        {milestone.link && (
          <a
            href={`https://${milestone.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[var(--color-brand-cyan)]/30 bg-[var(--color-brand-cyan)]/10 text-white font-mono text-xs tracking-wider uppercase hover:bg-[var(--color-brand-cyan)]/20 hover:border-[var(--color-brand-cyan)]/60 transition-all duration-300"
          >
            <span>Visit {milestone.link}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}
      </div>

      {/* Visual / Details Card Column */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`flex flex-col gap-6 p-5 sm:p-8 md:p-10 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.7)] hover:border-white/20 transition-all duration-300 relative overflow-hidden group ${
          isEven ? 'md:order-2' : 'md:order-1'
        }`}
      >
        {/* Media Asset (Logo or Image) */}
        {milestone.mediaAsset && (
          <div className="w-full rounded-2xl bg-black/60 border border-white/10 p-4 sm:p-6 flex items-center justify-center overflow-hidden min-h-[120px] sm:min-h-[140px] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={milestone.mediaAsset}
              alt={milestone.title}
              className={`object-contain transition-transform duration-500 group-hover:scale-105 ${
                milestone.mediaAsset.endsWith('.png') && !milestone.mediaAsset.includes('stock-simulator')
                  ? 'max-h-16 sm:max-h-20 w-auto opacity-90 group-hover:opacity-100'
                  : 'max-h-52 sm:max-h-64 w-full rounded-xl object-cover'
              }`}
            />
          </div>
        )}

        {/* Milestone-Specific Fitting Creative Animations */}
        {milestone.id === 'cofindr' && <FounderNetworkGraph />}

        {/* Accolades List with Gold Glowing Dots */}
        {milestone.accolades && (
          <div className="flex flex-col gap-3 relative z-10">
            <h3 className="text-white/40 font-mono text-xs tracking-widest uppercase mb-1 border-b border-white/10 pb-3">
              Recognition & Achievements
            </h3>
            {milestone.accolades.map((acc: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <span className="w-1.5 h-1.5 mt-2 shrink-0 rounded-full bg-[var(--color-brand-gold)] shadow-[0_0_8px_var(--color-brand-gold)]" />
                <span className="text-white/90 text-sm md:text-base font-medium leading-relaxed">
                  {acc}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sub-Milestone Highlight Card */}
        {milestone.subMilestone && (
          <div className="relative z-10 p-4 sm:p-5 rounded-2xl border border-[var(--color-brand-gold)]/30 bg-black/60 backdrop-blur-md">
            <span className="text-xs font-mono text-[var(--color-brand-gold)] block mb-1.5 tracking-wider uppercase">
              {milestone.subMilestone.eventTag}
            </span>
            <p className="text-sm sm:text-base font-semibold text-white/95">
              {milestone.subMilestone.achievement}
            </p>
          </div>
        )}

        {/* Multi-Stage Breakdown (for Circuit Milestones) */}
        {milestone.stages && (
          <div className="flex flex-col gap-4 w-full">
            <h3 className="text-white/40 font-mono text-xs tracking-widest uppercase mb-1 border-b border-white/10 pb-3">
              Circuit Stages
            </h3>
            {milestone.stages.map((stage: any, i: number) => (
              <div
                key={i}
                className="flex flex-col gap-2.5 p-4 sm:p-5 rounded-2xl border border-[var(--color-brand-cyan)]/20 bg-black/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-white">{stage.title}</h4>
                  <span className="text-[10px] sm:text-[11px] font-mono text-[var(--color-brand-cyan)] tracking-wider uppercase shrink-0">
                    {stage.location}
                  </span>
                </div>

                {stage.context && (
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed">{stage.context}</p>
                )}

                {stage.projectPitched && (
                  <div className="text-xs bg-white/5 p-3 rounded-xl border border-white/10 text-white/80">
                    <span className="text-white font-semibold mr-1">Pitched:</span>
                    {stage.projectPitched}
                  </div>
                )}

                {stage.accolades && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {stage.accolades.map((acc: string, j: number) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-gold)] shadow-[0_0_6px_var(--color-brand-gold)] shrink-0" />
                        <span className="text-xs text-white/90 font-medium">{acc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*                         ENTREPRENEURSHIP SECTIONS                          */
/* -------------------------------------------------------------------------- */

function EntrepreneurshipSections({
  data,
  onContinueToTech,
}: {
  data: any;
  onContinueToTech?: () => void;
}) {
  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Ambient Bay Area Background - Fills the space continuously throughout the journey */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.06)_0%,transparent_70%)] z-10 pointer-events-none" />
        <SequencePlayer
          folder="/story-assets/bayarea"
          frameCount={150}
          autoPlay={true}
          loop={true}
          fps={24}
          className="w-full h-full object-cover opacity-40 mix-blend-screen pointer-events-none"
        />
        {/* Subtle vignette so cards pop with high contrast */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none z-10" />
      </div>

      {/* Hero Header Section */}
      <div className="relative z-10 w-full pt-14 sm:pt-20 pb-10 sm:pb-16 px-4 sm:px-6 md:px-12 flex flex-col items-center text-center max-w-4xl mx-auto">
        <p className="text-[var(--color-brand-cyan)] bg-black/60 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-mono text-xs md:text-sm tracking-[0.3em] uppercase border border-white/10 shadow-2xl mb-4 sm:mb-6">
          The Journey
        </p>
        <h1 className="text-4xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-[0_0_35px_rgba(0,0,0,0.8)]">
          <span
            className="font-normal italic tracking-normal text-4xl sm:text-7xl md:text-9xl text-white pb-2 block"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Building
          </span>
          VENTURES.
        </h1>
        <p className="text-sm sm:text-lg md:text-xl text-white/60 font-light max-w-2xl mt-4 sm:mt-6 leading-relaxed px-2">
          From early product inception to core venture execution, hospital operations, and competitive founder circuits.
        </p>
      </div>

      {/* Event Sections Flow with Animated Connecting Flow Lines */}
      <div className="relative z-10 w-full py-12 sm:py-20 px-3 sm:px-6 md:px-12 flex flex-col items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]">
        {/* Continuous Background Flow Spine */}
        <TimelineContinuousSpine theme="entrepreneurship" />

        {data.milestones.map((milestone: any, index: number) => {
          let sectionComponent = null;
          if (milestone.id === 'noteway') {
            sectionComponent = <NotewaySection milestone={milestone} />;
          } else if (milestone.id === 'baghealthcare') {
            sectionComponent = <BlueAndGoldSection milestone={milestone} />;
          } else if (milestone.id === 'crosscountry') {
            sectionComponent = <CrossCountrySection milestone={milestone} />;
          } else if (milestone.id === 'cofindr') {
            sectionComponent = <CofindrSection milestone={milestone} />;
          } else {
            sectionComponent = <EventSection milestone={milestone} index={index} />;
          }

          return (
            <div key={milestone.id} className="w-full flex flex-col items-center relative z-10">
              {sectionComponent}
              {index < data.milestones.length - 1 && (
                <TimelineFlowConnector
                  index={index}
                  theme="entrepreneurship"
                />
              )}
            </div>
          );
        })}

        {/* Animated Flow Line into CTA */}
        <TimelineFlowConnector
          index={data.milestones.length}
          theme="entrepreneurship"
          isLastToCta={true}
        />

        {/* Continue to Tech Journey Call-to-Action */}
        <div className="flex flex-col items-center justify-center pt-2 pb-16 relative z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinueToTech}
            className="group relative inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 rounded-full bg-white text-black font-semibold text-sm sm:text-base md:text-lg shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(0,255,255,0.6)] transition-all duration-300 border border-white/90 cursor-pointer"
          >
            <span className="tracking-wide">Continue to Tech Journey</span>
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </motion.button>
          <span className="mt-3 text-xs font-mono text-white/40 tracking-widest uppercase">
            Explore: Technology & Engineering
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            TECHNOLOGY SECTIONS                             */
/* -------------------------------------------------------------------------- */

function TechnologySections({
  data,
  onReturnToVentures,
}: {
  data: any;
  onReturnToVentures?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const milestones = data.milestones || [];

  // Pinned container scroll tracker for Vending Machine sequence
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Fluid spring smoothing that operates entirely on native hardware-accelerated scroll
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 24,
    restDelta: 0.001,
  });

  // 1. Plays forward to end (0 -> 0.55), holds on the can with answers (0.55 -> 0.68), then reverses (0.68 -> 0.96)
  const animationProgress = useTransform(
    smoothProgress,
    [0, 0.55, 0.68, 0.96, 1],
    [0, 1, 1, 0, 0]
  );

  // 2. Slower, gradual fade out: solid while forward & hold, then gently fades out across 0.68 -> 0.98
  const sequenceOpacity = useTransform(
    smoothProgress,
    [0, 0.55, 0.68, 0.88, 0.98, 1],
    [1, 1, 1, 0.65, 0.15, 0]
  );

  // 3. Title visibility: gently softens and fades with the sequence
  const titleOpacity = useTransform(
    smoothProgress,
    [0, 0.55, 0.70, 0.88, 1],
    [1, 1, 0.85, 0.1, 0]
  );

  return (
    <div className="relative w-full flex flex-col items-center min-h-screen bg-[#050505]">
      {/* 210vh Pinned Vending Machine Hero with Slow Cinematic Scroll & Smooth Native Handoff */}
      <div ref={containerRef} className="relative w-full h-[210vh]">
        <div className="sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] w-full flex flex-col items-center justify-start pt-6 sm:pt-8 overflow-hidden bg-[#050505]">
          {/* Scroll-Scrubbed Vending Machine Animation */}
          <motion.div
            style={{ opacity: sequenceOpacity }}
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
          >
            <SequencePlayer
              folder="/story-assets/vending-machine"
              frameCount={233}
              scrollProgress={animationProgress}
              autoPlay={false}
              className="w-full h-full object-contain pointer-events-none"
            />
          </motion.div>

          {/* Clean "Driven by..." Header Overlay (Answers revealed on can: Creativity, Curiosity, Resilience) */}
          <motion.div
            style={{ opacity: titleOpacity }}
            className="relative z-20 flex flex-col items-center text-center max-w-4xl mx-auto px-4 sm:px-6 pointer-events-none"
          >
            <p className="text-[var(--color-brand-cyan)] bg-black/60 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-mono text-xs md:text-sm tracking-[0.3em] uppercase border border-white/10 shadow-2xl mb-4 sm:mb-6 backdrop-blur-md">
              The Journey
            </p>
            <h1
              className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-normal italic tracking-wide text-white/95 drop-shadow-[0_0_35px_rgba(0,0,0,0.9)] pb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Driven by...
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Event Sections Flow with Animated Connecting Flow Lines */}
      <div className="relative z-20 w-full -mt-[10vh] sm:-mt-[16vh] md:-mt-[22vh] pb-16 sm:pb-24 px-3 sm:px-6 md:px-12 flex flex-col items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]">
        {/* Continuous Background Flow Spine */}
        <TimelineContinuousSpine theme="technology" />

        {milestones.map((milestone: any, index: number) => {
          let sectionComponent = null;
          if (milestone.id === 'vending-machine') {
            sectionComponent = <VendingMachineSection milestone={milestone} />;
          } else if (milestone.id === 'stock-simulator') {
            sectionComponent = <StockSimulatorSection milestone={milestone} />;
          } else if (milestone.id === 'pulse-robot') {
            sectionComponent = <PulseRobotSection milestone={milestone} />;
          } else if (milestone.id === 'multi-agent-planning') {
            sectionComponent = <MultiAgentPlanningSection milestone={milestone} />;
          } else if (milestone.id === 'future-milestones') {
            sectionComponent = <FutureMilestonesSection milestone={milestone} />;
          } else {
            sectionComponent = <EventSection milestone={milestone} index={index} />;
          }

          return (
            <div key={milestone.id} className="w-full flex flex-col items-center relative z-10">
              {sectionComponent}
              {index < milestones.length - 1 && (
                <TimelineFlowConnector
                  index={index}
                  theme="technology"
                />
              )}
            </div>
          );
        })}

        {/* Animated Flow Line into CTA */}
        <TimelineFlowConnector
          index={milestones.length}
          theme="technology"
          isLastToCta={true}
        />

        {/* Return to Ventures Journey CTA */}
        <div className="flex flex-col items-center justify-center pt-2 pb-16 relative z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReturnToVentures}
            className="group relative inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 rounded-full bg-white text-black font-semibold text-sm sm:text-base md:text-lg shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(0,255,255,0.6)] transition-all duration-300 border border-white/90 cursor-pointer"
          >
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:-translate-x-1.5 transition-transform duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="tracking-wide">Return to Ventures Journey</span>
          </motion.button>
          <span className="mt-3 text-xs font-mono text-white/40 tracking-widest uppercase">
            Explore: Entrepreneurship & Ventures
          </span>
        </div>
      </div>
    </div>
  );
}
