'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';

interface MilestoneEvent {
  id: string;
  title: string;
  dateDisplay: string;
  startDate: string; // ISO: YYYY-MM-DD
  endDate?: string;   // ISO: YYYY-MM-DD
  category: 'school' | 'college';
}

interface MarkingPeriod {
  id: string;
  name: string;
  quarterLabel: string;
  startDate: string;
  endDate: string;
  exactEndDateDisplay: string;
  dayOfWeek: string;
  notes: string;
}

// Graduation Target: May 28, 2027 at 12:00 PM EST (EDT: UTC-4)
const GRADUATION_DATE = new Date('2027-05-28T12:00:00-04:00');
const SENIOR_START_DATE = new Date('2026-08-24T08:00:00-04:00');

// 4 Marking Periods
const MARKING_PERIODS: MarkingPeriod[] = [
  {
    id: 'q1',
    name: 'Quarter 1',
    quarterLabel: 'Q1',
    startDate: '2026-08-24T08:00:00-04:00',
    endDate: '2026-10-27T14:30:00-04:00',
    exactEndDateDisplay: 'October 27, 2026',
    dayOfWeek: 'Tuesday',
    notes: 'Followed by staff professional learning day on Oct 28 (No school)',
  },
  {
    id: 'q2',
    name: 'Quarter 2',
    quarterLabel: 'Q2',
    startDate: '2026-10-29T08:00:00-04:00',
    endDate: '2027-01-15T14:30:00-04:00',
    exactEndDateDisplay: 'January 15, 2027',
    dayOfWeek: 'Friday',
    notes: 'End of Semester 1; MLK Day on Jan 18 & Staff Workday on Jan 19',
  },
  {
    id: 'q3',
    name: 'Quarter 3',
    quarterLabel: 'Q3',
    startDate: '2027-01-20T08:00:00-04:00',
    endDate: '2027-04-07T14:30:00-04:00',
    exactEndDateDisplay: 'April 7, 2027',
    dayOfWeek: 'Wednesday',
    notes: 'Followed by 3-hour early dismissal on April 8',
  },
  {
    id: 'q4',
    name: 'Quarter 4',
    quarterLabel: 'Q4',
    startDate: '2027-04-08T08:00:00-04:00',
    endDate: '2027-06-08T11:30:00-04:00',
    exactEndDateDisplay: 'June 8, 2027',
    dayOfWeek: 'Tuesday',
    notes: 'Scheduled last day of school (3-hour early dismissal)',
  },
];

// All Exact Schedule Events
const EVENTS: MilestoneEvent[] = [
  {
    id: 'staff-workday-oct',
    title: 'HCPSS Staff Workday (No School)',
    dateDisplay: 'Oct 16, 2026',
    startDate: '2026-10-16',
    category: 'school',
  },
  {
    id: 'q1-end',
    title: 'Quarter 1 Ends (Q1 Marking Period)',
    dateDisplay: 'Oct 27, 2026',
    startDate: '2026-10-27',
    category: 'school',
  },
  {
    id: 'prof-learning-oct',
    title: 'HCPSS Professional Learning Day (No School)',
    dateDisplay: 'Oct 28, 2026',
    startDate: '2026-10-28',
    category: 'school',
  },
  {
    id: 'college-ea-ed1',
    title: 'College Early Action / Early Decision I',
    dateDisplay: 'Nov 1, 2026',
    startDate: '2026-11-01',
    category: 'college',
  },
  {
    id: 'election-day',
    title: 'Election Day (No School)',
    dateDisplay: 'Nov 3, 2026',
    startDate: '2026-11-03',
    category: 'school',
  },
  {
    id: 'college-ea-round2',
    title: 'College Early Action (Round 2)',
    dateDisplay: 'Nov 15, 2026',
    startDate: '2026-11-15',
    category: 'college',
  },
  {
    id: 'thanksgiving-break',
    title: 'Thanksgiving Break',
    dateDisplay: 'Nov 25–27, 2026',
    startDate: '2026-11-25',
    endDate: '2026-11-27',
    category: 'school',
  },
  {
    id: 'uc-deadline',
    title: 'UC Application Deadline',
    dateDisplay: 'Nov 30, 2026',
    startDate: '2026-11-30',
    category: 'college',
  },
  {
    id: 'merit-scholarship-deadline',
    title: 'Merit Scholarship Priority Deadline',
    dateDisplay: 'Dec 1, 2026',
    startDate: '2026-12-01',
    category: 'college',
  },
  {
    id: 'ea-ed-decisions',
    title: 'EA/ED Decisions Released',
    dateDisplay: 'Dec 15, 2026',
    startDate: '2026-12-15',
    category: 'college',
  },
  {
    id: 'winter-break',
    title: 'Winter Break',
    dateDisplay: 'Dec 24, 2026 – Jan 1, 2027',
    startDate: '2026-12-24',
    endDate: '2027-01-01',
    category: 'school',
  },
  {
    id: 'rd-ed2-deadlines',
    title: 'College Regular Decision / ED II',
    dateDisplay: 'Jan 1–5, 2027',
    startDate: '2027-01-01',
    endDate: '2027-01-05',
    category: 'college',
  },
  {
    id: 'q2-end',
    title: 'Quarter 2 Ends (End of Semester 1)',
    dateDisplay: 'Jan 15, 2027',
    startDate: '2027-01-15',
    category: 'school',
  },
  {
    id: 'mlk-day',
    title: 'MLK Day (No School)',
    dateDisplay: 'Jan 18, 2027',
    startDate: '2027-01-18',
    category: 'school',
  },
  {
    id: 'end-semester-1-day',
    title: 'Staff Workday / End of Sem 1 (No School)',
    dateDisplay: 'Jan 19, 2027',
    startDate: '2027-01-19',
    category: 'school',
  },
  {
    id: 'presidents-day',
    title: "Presidents' Day (No School)",
    dateDisplay: 'Feb 15, 2027',
    startDate: '2027-02-15',
    category: 'school',
  },
  {
    id: 'eid-al-fitr',
    title: 'Eid al-Fitr (No School)',
    dateDisplay: 'Mar 9, 2027',
    startDate: '2027-03-09',
    category: 'school',
  },
  {
    id: 'spring-break',
    title: 'Spring Break',
    dateDisplay: 'Mar 22–29, 2027',
    startDate: '2027-03-22',
    endDate: '2027-03-29',
    category: 'school',
  },
  {
    id: 'ivy-day-releases',
    title: 'Regular Decision / Ivy Day Releases',
    dateDisplay: 'Late March 2027',
    startDate: '2027-03-27',
    category: 'college',
  },
  {
    id: 'q3-end',
    title: 'Quarter 3 Ends',
    dateDisplay: 'Apr 7, 2027',
    startDate: '2027-04-07',
    category: 'school',
  },
  {
    id: 'decision-day',
    title: 'College Decision Day',
    dateDisplay: 'May 1, 2027',
    startDate: '2027-05-01',
    category: 'college',
  },
  {
    id: 'ap-exams',
    title: 'AP Exams',
    dateDisplay: 'May 3–14, 2027',
    startDate: '2027-05-03',
    endDate: '2027-05-14',
    category: 'school',
  },
  {
    id: 'graduation-may28',
    title: 'Senior Graduation Day (Dismissal)',
    dateDisplay: 'May 28, 2027',
    startDate: '2027-05-28',
    category: 'school',
  },
  {
    id: 'memorial-day',
    title: 'Memorial Day (No School)',
    dateDisplay: 'May 31, 2027',
    startDate: '2027-05-31',
    category: 'school',
  },
  {
    id: 'q4-last-day',
    title: 'Quarter 4 Ends / Scheduled Last Day of School',
    dateDisplay: 'June 8, 2027',
    startDate: '2027-06-08',
    category: 'school',
  },
];

// HCPSS off-days for school day countdown
const HCPSS_OFF_DAYS = [
  '2026-10-16',
  '2026-10-28',
  '2026-11-03',
  '2026-11-25', '2026-11-26', '2026-11-27',
  '2026-12-24', '2026-12-25', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01',
  '2027-01-18',
  '2027-01-19',
  '2027-02-15',
  '2027-03-09',
  '2027-03-22', '2027-03-23', '2027-03-24', '2027-03-25', '2027-03-26', '2027-03-29',
  '2027-05-31',
];

export default function SeniorCountdownPage() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'school' | 'college'>('all');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.title = "Senior Countdown | Sunay Raval";
    setMounted(true);
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 1. Digital Countdown to Graduation (May 28, 2027)
  const gradCountdown = useMemo(() => {
    const diff = Math.max(0, GRADUATION_DATE.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  }, [now]);

  // Senior year completion percentage (Aug 24, 2026 -> May 28, 2027)
  const progressPercent = useMemo(() => {
    const totalDuration = GRADUATION_DATE.getTime() - SENIOR_START_DATE.getTime();
    const elapsed = now.getTime() - SENIOR_START_DATE.getTime();
    const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return pct;
  }, [now]);

  // Dynamic Phase and Color Interpolation based on Progress
  const senioritisData = useMemo(() => {
    const pct = progressPercent;

    if (pct < 25) {
      return {
        phaseName: 'MILD LEVEL',
        tagline: 'Syllabus week mindset, full attendance',
        color: '#10b981', // Jalapeño Emerald
        border: 'rgba(16, 185, 129, 0.4)',
        bgGlow: 'rgba(16, 185, 129, 0.12)',
        particleMultiplier: 1.0,
        hue: 150,
      };
    } else if (pct < 50) {
      return {
        phaseName: 'SPICY LEVEL',
        tagline: 'Early action submitted, attendance slipping',
        color: '#f59e0b', // Serrano Gold-Orange
        border: 'rgba(245, 158, 11, 0.45)',
        bgGlow: 'rgba(245, 158, 11, 0.14)',
        particleMultiplier: 2.2,
        hue: 38,
      };
    } else if (pct < 75) {
      return {
        phaseName: 'HOT LEVEL',
        tagline: 'Second semester senior, senioritis in full swing',
        color: '#ef4444', // Habanero Crimson
        border: 'rgba(239, 68, 68, 0.5)',
        bgGlow: 'rgba(239, 68, 68, 0.18)',
        particleMultiplier: 3.6,
        hue: 8,
      };
    } else {
      return {
        phaseName: 'OVERLOAD LEVEL',
        tagline: 'Critical Senioritis reached! Graduation imminent',
        color: '#ff0055', // Ghost Pepper Blazing
        border: 'rgba(255, 0, 85, 0.65)',
        bgGlow: 'rgba(255, 0, 85, 0.25)',
        particleMultiplier: 5.2,
        hue: 345,
      };
    }
  }, [progressPercent]);

  // Pepper SVG fill calculations:
  // Body top is y=42, bottom is y=152 (total height = 110)
  const pepperFill = useMemo(() => {
    const bottomY = 152;
    const topY = 42;
    const totalH = bottomY - topY;
    const fillH = totalH * (progressPercent / 100);
    const fillY = bottomY - fillH;
    return { fillY, fillH };
  }, [progressPercent]);

  // Particle Canvas Emitter: Emits sparks with amplitude proportional to heat
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const multiplier = senioritisData.particleMultiplier;
    const particleCount = Math.floor(16 * multiplier);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      hue: number;
    }

    const particles: Particle[] = [];

    const spawnParticle = (): Particle => {
      const w = canvas.width;
      const h = canvas.height;
      // Amplitude scales wider as year progresses
      const spread = 20 + multiplier * 18;
      return {
        x: w * 0.5 + (Math.random() - 0.5) * spread,
        y: h * 0.72 + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * (0.8 + multiplier * 0.8),
        vy: -(1.4 + Math.random() * (1.6 + multiplier * 1.4)),
        size: 2 + Math.random() * (2 + multiplier * 1.2),
        alpha: 0.75 + Math.random() * 0.25,
        decay: 0.012 + Math.random() * 0.018,
        hue: senioritisData.hue + (Math.random() - 0.5) * 20,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(spawnParticle());
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y < 0) {
          particles[i] = spawnParticle();
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
        ctx.shadowBlur = 8 + multiplier * 3;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [senioritisData]);

  // Quick Stats: Next Deadline
  const nextEvent = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    for (const ev of EVENTS) {
      const compareDate = ev.endDate || ev.startDate;
      if (compareDate >= todayStr) {
        const target = new Date(`${ev.startDate}T00:00:00-04:00`);
        const diffMs = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { event: ev, diffDays };
      }
    }
    return null;
  }, [now]);

  // Quick Stats: School Days Remaining until May 28, 2027
  const schoolDaysRemaining = useMemo(() => {
    const curr = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const grad = new Date(GRADUATION_DATE.getFullYear(), GRADUATION_DATE.getMonth(), GRADUATION_DATE.getDate());
    let days = 0;
    const offSet = new Set(HCPSS_OFF_DAYS);

    const temp = new Date(curr);
    while (temp <= grad) {
      const dayOfWeek = temp.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const iso = temp.toISOString().split('T')[0];
        if (!offSet.has(iso)) {
          days++;
        }
      }
      temp.setDate(temp.getDate() + 1);
    }

    return Math.min(180, days);
  }, [now]);

  // Quick Stats: Mondays Left until May 28, 2027
  const mondaysRemaining = useMemo(() => {
    const curr = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const grad = new Date(GRADUATION_DATE.getFullYear(), GRADUATION_DATE.getMonth(), GRADUATION_DATE.getDate());
    let count = 0;

    const temp = new Date(curr);
    while (temp <= grad) {
      if (temp.getDay() === 1) {
        count++;
      }
      temp.setDate(temp.getDate() + 1);
    }
    return count;
  }, [now]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return EVENTS;
    return EVENTS.filter(e => e.category === selectedFilter);
  }, [selectedFilter]);

  const todayStr = useMemo(() => now.toISOString().split('T')[0], [now]);

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[var(--color-brand-cyan)] selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] blur-3xl transition-colors duration-1000"
          style={{
            background: `radial-gradient(ellipse at top, ${senioritisData.color}20 0%, rgba(6,182,212,0.06) 40%, transparent 70%)`,
          }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(195,154,63,0.05)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10 h-16 sm:h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--color-brand-emerald)] to-[var(--color-brand-cyan)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_var(--color-brand-cyan)] transition-all cursor-pointer">
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
          <Link href="/story" className="text-white/70 hover:text-white transition-colors px-2 py-1 rounded">
            Story
          </Link>
          <span className="text-[var(--color-brand-gold)] font-medium px-3 py-1 rounded-full bg-amber-950/30 border border-[var(--color-brand-gold)]/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(195,154,63,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-gold)] animate-pulse" />
            Senior Countdown
          </span>
          <a
            href="https://www.linkedin.com/in/sunay-raval-326215245/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-[var(--color-brand-cyan)] transition-colors hidden sm:block px-2 py-1"
          >
            Contact
          </a>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col gap-8 sm:gap-12">
        {/* Header Title */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--color-brand-gold)]/30 bg-amber-950/20 text-[var(--color-brand-gold)] text-xs font-mono tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-gold)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand-gold)]"></span>
            </span>
            CLASS OF 2027 • SENIOR STATUS DASHBOARD
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white mt-1">
            <span
              className="font-normal italic tracking-normal block text-white/90 text-2xl sm:text-4xl md:text-5xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Senior Year
            </span>
            COUNTDOWN & STATUS
          </h1>

          <p className="text-white/60 text-xs sm:text-base max-w-2xl">
            Ticking down to Senior Graduation on <strong className="text-white">May 28, 2027 at 12:00 PM EST</strong>. Monitor academic marking periods, college admissions, and live senioritis heat levels.
          </p>
        </div>

        {/* 1. TOP SECTION: TWO SEPARATE BOXES SIDE-BY-SIDE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* BOX 1: Main Countdown Box (8 Cols) */}
          <div className="lg:col-span-8 bg-gradient-to-b from-[#0c1015]/95 to-[#07090c]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between gap-6 sm:gap-8">
            {/* Subtle top cyan line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-brand-cyan)]/70 to-transparent" />

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-white/50 font-mono mb-4">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Senior Graduation: May 28, 2027 • 12:00 PM EST
                </span>
                <span className="text-[var(--color-brand-cyan)] font-semibold">Live Ticker</span>
              </div>

              {/* 4 Digital Timer Blocks */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full">
                {[
                  { value: gradCountdown.days, label: 'DAYS' },
                  { value: gradCountdown.hours, label: 'HOURS' },
                  { value: gradCountdown.minutes, label: 'MINS' },
                  { value: gradCountdown.seconds, label: 'SECS' },
                ].map((unit, idx) => (
                  <div
                    key={idx}
                    className="bg-black/60 border border-white/10 rounded-2xl py-4 sm:py-6 px-2 flex flex-col items-center justify-center shadow-inner hover:border-white/30 transition-colors"
                  >
                    <span className="text-3xl sm:text-5xl md:text-6xl font-mono font-bold tracking-tight text-white tabular-nums">
                      {mounted ? String(unit.value).padStart(2, '0') : '--'}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono tracking-widest text-white/50 mt-1 sm:mt-2">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Senior Year Progress Bar */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-white/70">
                <span className="flex items-center gap-2">
                  <span className="text-white font-medium">Senior Year Progress</span>
                  <span className="text-[var(--color-brand-cyan)] font-bold">
                    ({mounted ? `${progressPercent.toFixed(1)}%` : '...'} Completed)
                  </span>
                </span>
                <span className="text-white/40 text-[11px] sm:text-xs">Aug 24, 2026 → May 28, 2027</span>
              </div>

              <div className="h-3 sm:h-4 w-full bg-black/70 border border-white/10 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  style={{
                    width: mounted ? `${progressPercent}%` : '0%',
                    background: `linear-gradient(90deg, #044b36 0%, #06b6d4 50%, ${senioritisData.color} 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* BOX 2: Senioritis Spicy Pepper Meter in its OWN Separate Box (4 Cols) */}
          <div
            className="lg:col-span-4 rounded-3xl border p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-700 backdrop-blur-xl shadow-2xl"
            style={{
              borderColor: senioritisData.border,
              background: `linear-gradient(180deg, ${senioritisData.bgGlow} 0%, rgba(9, 12, 16, 0.95) 100%)`,
            }}
          >
            {/* Particle Canvas Behind Pepper */}
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-90"
            />

            {/* Top Row: Title + ONLY the Current Phase */}
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1.5">
                <span className="text-sm">🌶️</span> Senioritis Meter
              </span>
              <span
                className="text-[11px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-bold border transition-colors duration-500 shadow-md"
                style={{
                  color: senioritisData.color,
                  borderColor: senioritisData.border,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                }}
              >
                {senioritisData.phaseName}
              </span>
            </div>

            {/* Center: Filling Pepper Chamber Graphic */}
            <div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-3">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                {/* Dynamic heat halo glow */}
                <div
                  className="absolute inset-4 rounded-full blur-2xl transition-all duration-700 animate-pulse pointer-events-none opacity-60"
                  style={{ backgroundColor: senioritisData.color }}
                />

                {/* SVG Pepper with Double-Clipped Liquid Fill that rises with % */}
                <svg
                  viewBox="0 0 200 220"
                  className="w-full h-full drop-shadow-2xl relative z-10"
                >
                  <defs>
                    {/* The exact contour of the pepper chamber */}
                    <clipPath id="pepperChamberOutline">
                      <path d="M 100 42 C 126 44 136 64 133 86 C 130 110 114 130 100 152 C 96 156 94 156 95 150 C 98 132 89 112 82 94 C 76 76 80 44 100 42 Z" />
                    </clipPath>

                    {/* Clip rect that rises from bottom based on progressPercent */}
                    <clipPath id="pepperLiquidHeightClip">
                      <rect
                        x="0"
                        y={pepperFill.fillY.toFixed(1)}
                        width="200"
                        height={(pepperFill.fillH + 20).toFixed(1)}
                      />
                    </clipPath>

                    {/* Liquid fill gradient */}
                    <linearGradient id="pepperLiquidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor={senioritisData.color} />
                      <stop offset="85%" stopColor={senioritisData.color} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                    </linearGradient>

                    <filter id="liquidGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={senioritisData.color} floodOpacity="0.9" />
                    </filter>
                  </defs>

                  {/* Stem at top */}
                  <path
                    d="M 105 38 C 103 22 110 14 122 10 C 117 15 113 22 109 38 Z"
                    fill="#10b981"
                    stroke="#044b36"
                    strokeWidth="2"
                  />
                  <path
                    d="M 93 40 C 96 33 111 33 114 40 C 111 44 96 44 93 40 Z"
                    fill="#059669"
                  />

                  {/* Unfilled Glass Chamber Outline */}
                  <path
                    d="M 100 42 C 126 44 136 64 133 86 C 130 110 114 130 100 152 C 96 156 94 156 95 150 C 98 132 89 112 82 94 C 76 76 80 44 100 42 Z"
                    fill="rgba(255, 255, 255, 0.04)"
                    stroke="rgba(255, 255, 255, 0.22)"
                    strokeWidth="2.5"
                  />

                  {/* Filled Section: Only fills up to current graduation progress */}
                  <g clipPath="url(#pepperChamberOutline)">
                    <g clipPath="url(#pepperLiquidHeightClip)">
                      <rect
                        x="0"
                        y="0"
                        width="200"
                        height="220"
                        fill="url(#pepperLiquidGrad)"
                        filter="url(#liquidGlowFilter)"
                      />
                      {/* Bright meniscus line across liquid level */}
                      <rect
                        x="0"
                        y={(pepperFill.fillY - 1).toFixed(1)}
                        width="200"
                        height="3"
                        fill="#ffffff"
                        opacity="0.95"
                      />
                      {/* Gloss highlight */}
                      <path
                        d="M 91 50 C 85 66 84 90 89 115"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </g>
                  </g>

                  {/* Measurement tick marks along side */}
                  <line x1="145" y1="145" x2="153" y2="145" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <text x="157" y="148" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">0%</text>

                  <line x1="147" y1="118" x2="155" y2="118" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <text x="159" y="121" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">25%</text>

                  <line x1="149" y1="92" x2="157" y2="92" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <text x="161" y="95" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">50%</text>

                  <line x1="147" y1="66" x2="155" y2="66" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <text x="159" y="69" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">75%</text>

                  <line x1="142" y1="42" x2="150" y2="42" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <text x="154" y="45" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">MAX</text>
                </svg>
              </div>
            </div>

            {/* Bottom Row: Percentage Heat & Current Phase Info Only */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col gap-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white tabular-nums">
                  {mounted ? `${progressPercent.toFixed(1)}%` : '--'}
                </span>
                <span
                  className="text-xs font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/50 border"
                  style={{ color: senioritisData.color, borderColor: senioritisData.border }}
                >
                  HEAT
                </span>
              </div>
              <p className="text-xs text-white/60 font-sans leading-snug">
                {senioritisData.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* 2. SUBCLOCKS FOR MARKING PERIODS */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">⏱️</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Marking Period Subclocks
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Exact end dates and live countdown timers for all four academic quarters.
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-brand-cyan)] bg-cyan-950/30 border border-cyan-500/30 px-3 py-1 rounded-full self-start sm:self-center">
              Active: Quarter 1 (Q1)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {MARKING_PERIODS.map(mp => {
              const start = new Date(mp.startDate).getTime();
              const end = new Date(mp.endDate).getTime();
              const currentTime = now.getTime();

              const isPast = currentTime > end;
              const isActive = currentTime >= start && currentTime <= end;

              // Calculate countdown to end
              const diffToEnd = Math.max(0, end - currentTime);
              const qDays = Math.floor(diffToEnd / (1000 * 60 * 60 * 24));
              const qHours = Math.floor((diffToEnd / (1000 * 60 * 60)) % 24);
              const qMins = Math.floor((diffToEnd / (1000 * 60)) % 60);
              const qSecs = Math.floor((diffToEnd / 1000) % 60);

              // Percentage of quarter
              const totalQ = end - start;
              const elapsedQ = Math.max(0, currentTime - start);
              const qPct = Math.min(100, Math.max(0, (elapsedQ / totalQ) * 100));

              return (
                <div
                  key={mp.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-b from-[#0f171c] to-[#090d10] border-[var(--color-brand-cyan)] shadow-[0_0_25px_rgba(6,182,212,0.18)] ring-1 ring-[var(--color-brand-cyan)]/40'
                      : isPast
                      ? 'bg-[#090b0e]/50 border-white/5 opacity-60'
                      : 'bg-[#0a0d10]/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top shimmer indicator for active quarter */}
                  {isActive && (
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-brand-cyan)] to-transparent" />
                  )}

                  <div>
                    {/* Quarter Header & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                        {mp.quarterLabel}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-bold'
                            : isPast
                            ? 'border-white/10 text-white/40'
                            : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300'
                        }`}
                      >
                        {isActive ? '● Active' : isPast ? 'Completed ✓' : 'Upcoming'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-0.5">
                      {mp.name}
                    </h3>
                    <p className="text-xs text-[var(--color-brand-gold)] font-mono mb-4">
                      {mp.exactEndDateDisplay} ({mp.dayOfWeek})
                    </p>

                    {/* Subclock Digital Display */}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-3 mb-4 text-center">
                      {isPast ? (
                        <div className="text-sm font-mono text-white/50 py-1">
                          Quarter Finished
                        </div>
                      ) : (
                        <div>
                          <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums tracking-tight">
                            {mounted ? `${qDays}d ${qHours}h ${qMins}m ${qSecs}s` : '--'}
                          </div>
                          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase block mt-0.5">
                            {isActive ? 'Time Remaining in Q1' : 'Countdown to End'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar for Quarter */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-1">
                        <span>Quarter Elapsed</span>
                        <span>{mounted ? `${qPct.toFixed(0)}%` : '0%'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-emerald)] to-[var(--color-brand-cyan)] transition-all duration-500"
                          style={{ width: mounted ? `${qPct}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes / Next Day Schedule */}
                  <div className="pt-3 border-t border-white/10 text-[11px] text-white/70 leading-relaxed font-sans bg-white/[0.02] -mx-5 -mb-5 p-4 rounded-b-2xl">
                    <span className="text-[var(--color-brand-gold)] font-semibold block mb-0.5">
                      Schedule Note:
                    </span>
                    {mp.notes}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. QUICK STATS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Next Target */}
          <div className="bg-[#0b0e12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-[var(--color-brand-gold)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Next Target</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/40 border border-[var(--color-brand-gold)]/30 text-[var(--color-brand-gold)] font-mono">
                  {nextEvent ? (nextEvent.diffDays <= 0 ? 'Today' : `In ${nextEvent.diffDays}d`) : 'None'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {nextEvent ? nextEvent.event.title : 'All Milestones Completed'}
              </h3>
            </div>
            <p className="text-xs text-[var(--color-brand-gold)] font-mono mt-4">
              {nextEvent ? nextEvent.event.dateDisplay : ''}
            </p>
          </div>

          {/* Card 2: School Days Remaining until May 28 */}
          <div className="bg-[#0b0e12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-[var(--color-brand-cyan)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">School Days Left</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono">
                  Until May 28
                </span>
              </div>
              <div className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                {mounted ? schoolDaysRemaining : '--'}
              </div>
            </div>
            <p className="text-xs text-white/50 font-mono mt-4">
              Instructional days until senior dismissal
            </p>
          </div>

          {/* Card 3: Mondays Left until May 28 */}
          <div className="bg-[#0b0e12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-[var(--color-brand-emerald)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Mondays Remaining</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono">
                  Until May 28
                </span>
              </div>
              <div className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                {mounted ? mondaysRemaining : '--'}
              </div>
            </div>
            <p className="text-xs text-white/50 font-mono mt-4">
              Weekly resets until graduation day
            </p>
          </div>
        </section>

        {/* 4. UPCOMING DEADLINES & SCHOOL DAYS OFF */}
        <section className="flex flex-col gap-6 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Upcoming Deadlines & School Days Off
              </h2>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Full chronological schedule of HCPSS breaks, college admissions, and graduation milestones.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-full border border-white/10 self-start sm:self-center">
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'college', label: 'College Deadlines' },
                { id: 'school', label: 'School Dates' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    selectedFilter === tab.id
                      ? 'bg-white text-black shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline / Event Cards */}
          <div className="flex flex-col gap-3">
            {filteredEvents.map(event => {
              const compareDate = event.endDate || event.startDate;
              const isPast = mounted && compareDate < todayStr;
              const isNext = mounted && nextEvent?.event.id === event.id;
              const isGraduation = event.id === 'graduation-may28';

              return (
                <div
                  key={event.id}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 transition-all duration-200 ${
                    isPast
                      ? 'bg-[#080a0c]/40 border-white/5 opacity-40 hover:opacity-75'
                      : isGraduation
                      ? 'bg-gradient-to-r from-amber-950/40 via-[#131108] to-black border-[var(--color-brand-gold)] shadow-[0_0_30px_rgba(195,154,63,0.25)] ring-1 ring-[var(--color-brand-gold)]'
                      : isNext
                      ? 'bg-gradient-to-r from-amber-950/30 via-[#0e1318] to-black border-[var(--color-brand-gold)]/60 shadow-[0_0_25px_rgba(195,154,63,0.15)] ring-1 ring-[var(--color-brand-gold)]/30'
                      : 'bg-[#0a0d10]/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Status Icon */}
                    <div className="shrink-0 mt-0.5 sm:mt-0">
                      {isPast ? (
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/40">
                          ✓
                        </div>
                      ) : isGraduation ? (
                        <div className="w-7 h-7 rounded-full bg-[var(--color-brand-gold)] text-black flex items-center justify-center text-xs font-bold shadow-lg animate-bounce">
                          🎓
                        </div>
                      ) : isNext ? (
                        <div className="w-7 h-7 rounded-full bg-[var(--color-brand-gold)]/20 border border-[var(--color-brand-gold)] flex items-center justify-center text-xs text-[var(--color-brand-gold)] font-bold animate-pulse">
                          ▶
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/50 font-mono">
                          •
                        </div>
                      )}
                    </div>

                    {/* Title and Category */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${
                            isGraduation
                              ? 'border-amber-400 bg-amber-950/60 text-amber-200 font-bold'
                              : event.category === 'college'
                              ? 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300'
                              : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                          }`}
                        >
                          {isGraduation
                            ? 'Graduation Day'
                            : event.category === 'college'
                            ? 'College Deadline'
                            : 'School Date'}
                        </span>

                        {isNext && (
                          <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-brand-gold)] text-black font-bold">
                            Next Up
                          </span>
                        )}

                        {isPast && (
                          <span className="text-[10px] font-mono text-white/40">
                            Passed
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base sm:text-lg font-semibold tracking-tight ${
                          isPast ? 'line-through text-white/50' : 'text-white'
                        }`}
                      >
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Date badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <span
                      className={`text-sm sm:text-base font-mono font-medium ${
                        isGraduation || isNext ? 'text-[var(--color-brand-gold)] font-bold' : 'text-white/80'
                      }`}
                    >
                      {event.dateDisplay}
                    </span>
                    {!isPast && mounted && (
                      <span className="text-[11px] font-mono text-white/40">
                        {isNext
                          ? nextEvent?.diffDays === 0
                            ? 'Today!'
                            : `${nextEvent?.diffDays} days away`
                          : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-4 sm:px-6 lg:px-12 bg-black/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>Senior Status Dashboard • Graduation May 28, 2027 • Sunay Raval</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/story" className="hover:text-white transition-colors">Story</Link>
            <span className="text-[var(--color-brand-gold)] font-medium">Senior Countdown</span>
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
