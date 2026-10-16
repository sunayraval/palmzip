'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface MilestoneEvent {
  id: string;
  title: string;
  dateDisplay: string;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate?: string;   // ISO format: YYYY-MM-DD
  category: 'school' | 'college';
  description?: string;
}

const EVENTS: MilestoneEvent[] = [
  {
    id: 'staff-workday-oct',
    title: 'HCPSS Staff Workday (No School)',
    dateDisplay: 'Oct 16, 2026',
    startDate: '2026-10-16',
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
    id: 'mlk-day',
    title: 'MLK Day (No School)',
    dateDisplay: 'Jan 18, 2027',
    startDate: '2027-01-18',
    category: 'school',
  },
  {
    id: 'end-semester-1',
    title: 'End of Semester 1 (No School)',
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
    id: 'memorial-day',
    title: 'Memorial Day (No School)',
    dateDisplay: 'May 31, 2027',
    startDate: '2027-05-31',
    category: 'school',
  },
  {
    id: 'graduation-day',
    title: 'Last Day of School / Senior Dismissal',
    dateDisplay: 'June 8, 2027',
    startDate: '2027-06-08',
    category: 'school',
  },
];

// Target graduation: June 8, 2027 at 12:00 PM EST (EDT: UTC-4)
const GRADUATION_DATE = new Date('2027-06-08T12:00:00-04:00');
const SENIOR_START_DATE = new Date('2026-08-24T08:00:00-04:00');

// HCPSS specific days off for school day subtraction
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

  useEffect(() => {
    setMounted(true);
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 1. Digital Countdown Calculation
  const countdown = useMemo(() => {
    const diff = Math.max(0, GRADUATION_DATE.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  }, [now]);

  // Senior year completion percentage
  const progressPercent = useMemo(() => {
    const totalDuration = GRADUATION_DATE.getTime() - SENIOR_START_DATE.getTime();
    const elapsed = now.getTime() - SENIOR_START_DATE.getTime();
    const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return pct.toFixed(1);
  }, [now]);

  // 2. Quick Stats: Next Deadline
  const nextEvent = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    for (const ev of EVENTS) {
      const compareDate = ev.endDate || ev.startDate;
      if (compareDate >= todayStr) {
        // Calculate days left
        const target = new Date(`${ev.startDate}T00:00:00-04:00`);
        const diffMs = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { event: ev, diffDays };
      }
    }
    return null;
  }, [now]);

  // 3. Quick Stats: School Days Remaining (from 180 total)
  const schoolDaysRemaining = useMemo(() => {
    const curr = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const grad = new Date(GRADUATION_DATE.getFullYear(), GRADUATION_DATE.getMonth(), GRADUATION_DATE.getDate());
    let days = 0;

    const offSet = new Set(HCPSS_OFF_DAYS);

    const temp = new Date(curr);
    while (temp <= grad) {
      const dayOfWeek = temp.getDay();
      // Monday = 1, Friday = 5
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

  // 4. Quick Stats: Mondays Left
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
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[var(--color-brand-cyan)] selection:text-white flex flex-col relative">
      {/* Background radial ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12)_0%,rgba(4,75,54,0.08)_40%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(195,154,63,0.06)_0%,transparent_70%)] blur-3xl" />
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

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col gap-8 sm:gap-12">
        {/* Header title */}
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
            COUNTDOWN
          </h1>

          <p className="text-white/60 text-xs sm:text-base max-w-xl">
            Ticking down to June 8, 2027 at 12:00 PM EST. Track every college admissions deadline and HCPSS break until graduation.
          </p>
        </div>

        {/* 1. TOP SECTION: BIG DIGITAL COUNTDOWN */}
        <section className="bg-gradient-to-b from-[#0c1015]/90 to-[#07090c]/90 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle top shimmer */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-brand-cyan)]/60 to-transparent" />

          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 font-mono">
              <span>Graduation Day: June 8, 2027 • 12:00 PM EST</span>
            </div>

            {/* Digits Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-6 w-full max-w-3xl">
              {[
                { value: countdown.days, label: 'DAYS' },
                { value: countdown.hours, label: 'HOURS' },
                { value: countdown.minutes, label: 'MINUTES' },
                { value: countdown.seconds, label: 'SECONDS' },
              ].map((unit, idx) => (
                <div
                  key={idx}
                  className="bg-black/60 border border-white/10 rounded-2xl py-4 sm:py-7 px-2 flex flex-col items-center justify-center shadow-inner group hover:border-[var(--color-brand-cyan)]/40 transition-colors"
                >
                  <span className="text-3xl sm:text-6xl md:text-7xl font-mono font-bold tracking-tight text-white tabular-nums">
                    {mounted ? String(unit.value).padStart(2, '0') : '--'}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono tracking-widest text-white/50 mt-1 sm:mt-2">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Senior Year Progress Bar */}
            <div className="w-full max-w-3xl flex flex-col gap-2.5 mt-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-white/70">
                <span className="flex items-center gap-2">
                  <span className="text-white font-medium">Senior Year Progress</span>
                  <span className="text-[var(--color-brand-cyan)]">({mounted ? `${progressPercent}%` : '...'} Completed)</span>
                </span>
                <span className="text-white/40 text-[11px] sm:text-xs">Aug 24, 2026 → June 8, 2027</span>
              </div>

              <div className="h-3 sm:h-4 w-full bg-black/70 border border-white/10 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-emerald)] via-[var(--color-brand-cyan)] to-[var(--color-brand-gold)] transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  style={{ width: mounted ? `${progressPercent}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. QUICK STATS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Next Deadline */}
          <div className="bg-[#0b0e12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-[var(--color-brand-gold)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Next Deadline</span>
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

          {/* Card 2: School Days Remaining */}
          <div className="bg-[#0b0e12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-[var(--color-brand-cyan)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">School Days Left</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono">
                  of 180 total
                </span>
              </div>
              <div className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                {mounted ? schoolDaysRemaining : '--'}
              </div>
            </div>
            <p className="text-xs text-white/50 font-mono mt-4">
              Instructional days until dismissal
            </p>
          </div>

          {/* Card 3: Mondays Left */}
          <div className="bg-[#0b0e12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-[var(--color-brand-emerald)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Mondays Remaining</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono">
                  Weekly resets
                </span>
              </div>
              <div className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                {mounted ? mondaysRemaining : '--'}
              </div>
            </div>
            <p className="text-xs text-white/50 font-mono mt-4">
              Mondays until graduation
            </p>
          </div>
        </section>

        {/* 3. UPCOMING DEADLINES & SCHOOL DAYS OFF */}
        <section className="flex flex-col gap-6 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Upcoming Deadlines & Days Off
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

              return (
                <div
                  key={event.id}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 transition-all duration-200 ${
                    isPast
                      ? 'bg-[#080a0c]/40 border-white/5 opacity-40 hover:opacity-75'
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
                            event.category === 'college'
                              ? 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300'
                              : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                          }`}
                        >
                          {event.category === 'college' ? 'College Deadline' : 'School Date'}
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
                        isNext ? 'text-[var(--color-brand-gold)]' : 'text-white/80'
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
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>Senior Status Dashboard • Sunay Raval</span>
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
