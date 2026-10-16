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
  description?: string;
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

// Marking Periods
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

type SenioritisTier = 'mild' | 'spicy' | 'hot' | 'overload';

export default function SeniorCountdownPage() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'school' | 'college'>('all');
  const [previewTierOverride, setPreviewTierOverride] = useState<SenioritisTier | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
  const realProgressPercent = useMemo(() => {
    const totalDuration = GRADUATION_DATE.getTime() - SENIOR_START_DATE.getTime();
    const elapsed = now.getTime() - SENIOR_START_DATE.getTime();
    const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return pct;
  }, [now]);

  // Senioritis Tier Calculation
  const activeTier: SenioritisTier = useMemo(() => {
    if (previewTierOverride) return previewTierOverride;
    if (realProgressPercent < 25) return 'mild';
    if (realProgressPercent < 50) return 'spicy';
    if (realProgressPercent < 75) return 'hot';
    return 'overload';
  }, [realProgressPercent, previewTierOverride]);

  const tierMetadata = useMemo(() => {
    switch (activeTier) {
      case 'mild':
        return {
          label: 'MILD LEVEL',
          tagline: 'Still taking notes, syllabus week mindset',
          colorName: 'Emerald Green',
          hex: '#10b981',
          bgHex: 'rgba(16, 185, 129, 0.15)',
          borderHex: 'rgba(16, 185, 129, 0.4)',
          multiplier: 1.0,
          heatPct: Math.max(12, Math.min(25, realProgressPercent)),
        };
      case 'spicy':
        return {
          label: 'SPICY LEVEL',
          tagline: 'Early Action submitted, attendance slipping',
          colorName: 'Serrano Orange',
          hex: '#f59e0b',
          bgHex: 'rgba(245, 158, 11, 0.15)',
          borderHex: 'rgba(245, 158, 11, 0.45)',
          multiplier: 2.2,
          heatPct: 45,
        };
      case 'hot':
        return {
          label: 'HOT LEVEL',
          tagline: 'Second semester senior, senioritis in full swing',
          colorName: 'Habanero Red',
          hex: '#ef4444',
          bgHex: 'rgba(239, 68, 68, 0.2)',
          borderHex: 'rgba(239, 68, 68, 0.5)',
          multiplier: 3.5,
          heatPct: 68,
        };
      case 'overload':
        return {
          label: 'OVERLOAD LEVEL',
          tagline: 'Critical Senioritis reached! Graduation imminent',
          colorName: 'Ghost Pepper Blazing',
          hex: '#ff0055',
          bgHex: 'rgba(255, 0, 85, 0.25)',
          borderHex: 'rgba(255, 0, 85, 0.65)',
          multiplier: 5.0,
          heatPct: 95,
        };
    }
  }, [activeTier, realProgressPercent]);

  // Particle Canvas Emitter for Pepper Flame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const multiplier = tierMetadata.multiplier;
    const particleCount = Math.floor(18 * multiplier);

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

    const getHueForTier = () => {
      if (activeTier === 'mild') return 145 + Math.random() * 25; // Green-emerald
      if (activeTier === 'spicy') return 35 + Math.random() * 20;  // Orange-gold
      if (activeTier === 'hot') return 5 + Math.random() * 25;    // Red-orange
      return Math.random() > 0.5 ? 340 + Math.random() * 25 : 40; // Magenta & fiery gold
    };

    const spawnParticle = (): Particle => {
      const w = canvas.width;
      const h = canvas.height;
      return {
        x: w * 0.5 + (Math.random() - 0.5) * (20 + multiplier * 12),
        y: h * 0.75 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * (0.8 + multiplier * 0.7),
        vy: -(1.2 + Math.random() * (1.5 + multiplier * 1.2)),
        size: 2 + Math.random() * (2.5 + multiplier * 1.5),
        alpha: 0.7 + Math.random() * 0.3,
        decay: 0.012 + Math.random() * 0.018,
        hue: getHueForTier(),
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

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTier, tierMetadata]);

  // 2. Quick Stats: Next Deadline
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

  // 3. Quick Stats: School Days Remaining until May 28, 2027
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

  // 4. Quick Stats: Mondays Left until May 28, 2027
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
            background: `radial-gradient(ellipse at top, ${tierMetadata.hex}22 0%, rgba(6,182,212,0.06) 40%, transparent 70%)`,
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

        {/* 1. TOP SECTION: BIG COUNTDOWN + SENIORITIS SPICY PEPPER METER */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-b from-[#0c1015]/90 to-[#07090c]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle top glow line */}
          <div
            className="absolute top-0 inset-x-0 h-[2px] transition-colors duration-1000"
            style={{
              background: `linear-gradient(90deg, transparent, ${tierMetadata.hex}, transparent)`,
            }}
          />

          {/* Left / Center: Big Countdown & Progress Bar (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6 sm:gap-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-white/50 font-mono mb-4">
                <span>Senior Graduation: May 28, 2027 • 12:00 PM EST</span>
                <span className="text-[var(--color-brand-cyan)] font-semibold">Ticking Live</span>
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
                    className="bg-black/60 border border-white/10 rounded-2xl py-4 sm:py-6 px-2 flex flex-col items-center justify-center shadow-inner group hover:border-white/30 transition-colors"
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
                    ({mounted ? `${realProgressPercent.toFixed(1)}%` : '...'} Completed)
                  </span>
                </span>
                <span className="text-white/40 text-[11px] sm:text-xs">Aug 24, 2026 → May 28, 2027</span>
              </div>

              <div className="h-3 sm:h-4 w-full bg-black/70 border border-white/10 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  style={{
                    width: mounted ? `${realProgressPercent}%` : '0%',
                    background: `linear-gradient(90deg, #044b36 0%, #06b6d4 50%, ${tierMetadata.hex} 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Senioritis Fire Meter (Spicy Pepper) (4 Cols) */}
          <div
            className="lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-700 backdrop-blur-md"
            style={{
              borderColor: tierMetadata.borderHex,
              background: `linear-gradient(180deg, ${tierMetadata.bgHex} 0%, rgba(10, 14, 18, 0.9) 100%)`,
            }}
          >
            {/* Particle Canvas Behind Pepper */}
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-90"
            />

            {/* Top Badge */}
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
                <span className="text-sm">🌶️</span> Senioritis Meter
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border transition-colors duration-500"
                style={{
                  color: tierMetadata.hex,
                  borderColor: tierMetadata.borderHex,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                {tierMetadata.label}
              </span>
            </div>

            {/* Center: Stylized Spicy Chili Pepper Illustration */}
            <div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-3">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                {/* Ambient pulsating heat glow circle */}
                <div
                  className="absolute inset-2 rounded-full blur-xl transition-all duration-700 animate-pulse pointer-events-none opacity-60"
                  style={{ backgroundColor: tierMetadata.hex }}
                />

                {/* SVG Spicy Pepper Graphic */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-2xl relative z-10"
                >
                  <defs>
                    {/* Linear fill gradient for pepper body */}
                    <linearGradient id="pepperGrad" x1="0%" y1="100%" x2="50%" y2="0%">
                      <stop offset="0%" stopColor={tierMetadata.hex} />
                      <stop offset="60%" stopColor={activeTier === 'overload' ? '#ffd700' : tierMetadata.hex} />
                      <stop offset="100%" stopColor={activeTier === 'mild' ? '#044b36' : '#b91c1c'} />
                    </linearGradient>

                    <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={tierMetadata.hex} floodOpacity="0.8" />
                    </filter>
                  </defs>

                  {/* Pepper Green Stem */}
                  <path
                    d="M 52 18 C 50 10 56 6 62 4 C 60 7 57 11 55 18 Z"
                    fill="#10b981"
                    stroke="#044b36"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 45 20 C 47 16 57 16 59 20 C 57 23 47 23 45 20 Z"
                    fill="#059669"
                  />

                  {/* Pepper Curved Body */}
                  <path
                    d="M 48 22 C 65 24 72 38 70 54 C 68 70 56 82 48 92 C 45 95 43 95 44 91 C 46 80 40 68 36 56 C 32 44 35 26 48 22 Z"
                    fill="url(#pepperGrad)"
                    stroke={tierMetadata.hex}
                    strokeWidth="2"
                    filter="url(#flameGlow)"
                  />

                  {/* Highlights / 3D sheen */}
                  <path
                    d="M 44 28 C 39 38 38 52 42 66"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Flame sparks icons at top when hot/overload */}
                  {(activeTier === 'hot' || activeTier === 'overload') && (
                    <text x="66" y="24" fontSize="16" className="animate-bounce">
                      🔥
                    </text>
                  )}
                </svg>
              </div>

              {/* Tagline & Level description */}
              <div className="text-center mt-2">
                <span
                  className="text-xs font-mono font-bold tracking-wider uppercase block"
                  style={{ color: tierMetadata.hex }}
                >
                  {tierMetadata.label} ({tierMetadata.heatPct.toFixed(0)}% Heat)
                </span>
                <p className="text-[11px] text-white/70 max-w-xs mt-0.5 leading-snug">
                  {tierMetadata.tagline}
                </p>
              </div>
            </div>

            {/* Bottom 4-Tier Gauge Selector / Live Preview */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                <span>Heat Stages</span>
                {previewTierOverride && (
                  <button
                    onClick={() => setPreviewTierOverride(null)}
                    className="text-[var(--color-brand-cyan)] hover:underline cursor-pointer"
                  >
                    Reset to Live
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1">
                {(['mild', 'spicy', 'hot', 'overload'] as SenioritisTier[]).map(t => {
                  const isCurrent = activeTier === t;
                  const isLive = !previewTierOverride && realProgressPercent < 25
                    ? t === 'mild'
                    : !previewTierOverride && realProgressPercent < 50
                    ? t === 'spicy'
                    : !previewTierOverride && realProgressPercent < 75
                    ? t === 'hot'
                    : t === 'overload';

                  return (
                    <button
                      key={t}
                      onClick={() => setPreviewTierOverride(t)}
                      title={`Preview ${t} tier`}
                      className={`py-1 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-white text-black shadow-md'
                          : 'bg-black/40 text-white/50 hover:text-white border border-white/5'
                      }`}
                    >
                      {t.slice(0, 4)}
                    </button>
                  );
                })}
              </div>
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
              const isFuture = currentTime < start;

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
          {/* Card 1: Next Deadline */}
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
