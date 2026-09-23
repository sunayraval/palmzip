'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { FounderScrollCanvas } from '@/components/FounderScrollCanvas';
import { NeuralNetwork } from '@/components/NeuralNetwork';
import { CandlestickBackground } from '@/components/CandlestickChart';
import { useRef } from 'react';
import Link from 'next/link';

import contentData from '@/data/content.json';

export function CreativeSection({ content = contentData, beats }: { content?: any; beats?: typeof contentData.beats }) {
  const STATIC_BEATS = beats || content?.beats || contentData.beats;
  const sections = content?.sections || contentData.sections;
  const entrep = sections?.entrepreneurship || {
    tag: "ENTREPRENEUR",
    italicTitle: "Committed to",
    mainTitle: "ENTREPRENEURSHIP",
    subtitle: "From healthcare operations and venture incubation to national pitch circuits and enterprise team formation."
  };
  const tech = sections?.technology || {
    tag: "BUILDER",
    italicTitle: "Research &",
    mainTitle: "TECHNOLOGY",
    subtitle: "Pioneering vision-language models, edge robotics, and hands-on mechanical & software architectures."
  };
  const impact = sections?.impact || {
    tag: "COMMUNITY LEADERSHIP",
    italicTitle: "Community",
    mainTitle: "IMPACT",
    subtitle: "Empowering students through financial education, executive guest speakers, and actionable wealth literacy."
  };

  const flc = content?.financialLiteracyClub || contentData.financialLiteracyClub || {
    header: "Howard High Financial Literacy Club",
    subtitle: "Founder & President",
    summary: "Built a student-led organization at Howard High to help peers make educated financial decisions and prepare for the realities of college. Hosted guest sessions featuring business teachers, industry leaders, and college professors to unpack real-world wealth mechanics.",
    stats: [
      { value: "300+", label: "Students Impacted" },
      { value: "20+", label: "Meetings Held" },
      { value: "3", label: "Large Community Events" }
    ],
    tickerItems: [
      "SPY $582.40 ▲ +0.65%",
      "HFLC [Impact] 300+ Students",
      "QQQ $495.10 ▲ +0.92%",
      "COMM [Outreach] 3 Large Community Events",
      "DIA $421.15 ▲ +0.31%",
      "SESS [Sessions Held] 20+ Meetings",
      "SPEAKERS [Network] Faculty • Industry Leaders • Business Teachers",
      "VTI $284.50 ▲ +0.54%"
    ]
  };

  const beat0 = STATIC_BEATS[0] || contentData.beats[0];
  const beat1 = STATIC_BEATS[1] || contentData.beats[1];
  const beat2 = STATIC_BEATS[2] || contentData.beats[2];

  return (
    <div className="relative bg-[#050505] z-10 py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 flex flex-col gap-20 sm:gap-32 md:gap-40 overflow-x-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] animate-grid">
      
      {/* =================================================================== */}
      {/* PART 1: ENTREPRENEURSHIP (BIG CENTER TITLE & CONTENT)               */}
      {/* =================================================================== */}
      <div className="w-full flex flex-col items-center gap-12 sm:gap-20">
        
        {/* Big Centered Designation Header */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-4xl mx-auto px-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-[var(--color-brand-gold)]/30 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] font-mono text-[11px] sm:text-xs tracking-[0.25em] uppercase shadow-[0_0_20px_rgba(255,215,0,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-gold)] animate-pulse" />
            <span>{entrep.tag}</span>
          </div>

          <h2 className="text-3xl sm:text-7xl md:text-9xl font-black tracking-tight text-white drop-shadow-[0_0_40px_rgba(255,215,0,0.15)] leading-[0.95] break-words">
            <span 
              className="font-normal italic tracking-normal block text-3xl sm:text-6xl md:text-8xl text-white/90 pb-1 sm:pb-2" 
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {entrep.italicTitle}
            </span>
            {entrep.mainTitle}
          </h2>

          <p className="text-sm sm:text-lg md:text-2xl text-white/60 font-light max-w-2xl leading-relaxed mt-2 px-2">
            {entrep.subtitle}
          </p>

          <div className="w-24 sm:w-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-brand-gold)] to-transparent mt-2 shadow-[0_0_12px_var(--color-brand-gold)]" />
        </motion.div>

        {/* Beat B: Blue & Gold Healthcare */}
        <motion.div 
          id={beat0.id || 'beat-b'}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
        >
          <div className="flex flex-col gap-4 sm:gap-6 items-start">
            <p className="text-[var(--color-brand-gold)] text-xs md:text-sm font-mono tracking-[0.15em] uppercase">
              // {beat0.microTag}
            </p>
            <h3 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white/95 leading-tight">
              {beat0.title}
            </h3>
            <p className="text-base md:text-xl text-white/60 font-light leading-relaxed">
              {beat0.subtitle}
            </p>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-4 p-5 sm:p-8 rounded-2xl border border-[var(--color-brand-gold)]/20 bg-black/40 backdrop-blur-md shadow-[0_0_40px_rgba(255,215,0,0.05)]"
          >
            <h4 className="text-white/40 font-mono text-xs sm:text-sm tracking-widest uppercase mb-2 border-b border-white/10 pb-4">Operational Metrics</h4>
            {beat0.metrics?.map((metric: string, i: number) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
                whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 -mx-2 sm:-mx-3 rounded-xl cursor-default transition-colors duration-300"
              >
                <span className="w-1.5 h-1.5 mt-2 shrink-0 rounded-full bg-[var(--color-brand-gold)] shadow-[0_0_8px_var(--color-brand-gold)]" />
                <span className="text-white/90 text-sm sm:text-base font-medium tracking-wide leading-relaxed">{metric}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Link to Story */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <Link
            href="/story"
            className="group inline-flex items-center gap-3 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-[var(--color-brand-gold)]/30 bg-black/60 hover:bg-[var(--color-brand-gold)]/10 text-white font-mono text-xs tracking-wider uppercase backdrop-blur-md transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.1)] hover:shadow-[0_0_30px_rgba(255,215,0,0.25)] hover:border-[var(--color-brand-gold)]"
          >
            <span>Explore Entrepreneurship Journey</span>
            <span className="text-[var(--color-brand-gold)] group-hover:translate-x-1.5 transition-transform">→</span>
          </Link>
        </motion.div>

      </div>

      {/* =================================================================== */}
      {/* PART 2: TECHNOLOGY (BIG CENTER TITLE & CONTENT)                     */}
      {/* =================================================================== */}
      <div className="w-full flex flex-col items-center gap-12 sm:gap-20 pt-12 sm:pt-16 border-t border-white/5">
        
        {/* Big Centered Designation Header */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-4xl mx-auto px-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-[var(--color-brand-cyan)]/30 bg-[var(--color-brand-cyan)]/10 text-[var(--color-brand-cyan)] font-mono text-[11px] sm:text-xs tracking-[0.25em] uppercase shadow-[0_0_20px_rgba(0,255,255,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-cyan)] animate-pulse" />
            <span>{tech.tag}</span>
          </div>

          <h2 className="text-3xl sm:text-7xl md:text-9xl font-black tracking-tight text-white drop-shadow-[0_0_40px_rgba(0,255,255,0.15)] leading-[0.95] break-words">
            <span 
              className="font-normal italic tracking-normal block text-3xl sm:text-6xl md:text-8xl text-white/90 pb-1 sm:pb-2" 
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {tech.italicTitle}
            </span>
            {tech.mainTitle}
          </h2>

          <p className="text-sm sm:text-lg md:text-2xl text-white/60 font-light max-w-2xl leading-relaxed mt-2 px-2">
            {tech.subtitle}
          </p>

          <div className="w-24 sm:w-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-brand-cyan)] to-transparent mt-2 shadow-[0_0_12px_var(--color-brand-cyan)]" />
        </motion.div>

        {/* Beat C: Artificial Intelligence & VLMs */}
        <motion.div 
          id={beat1.id || 'beat-c'}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
        >
          <NeuralNetwork />
          <div className="flex flex-col gap-4 sm:gap-6 items-start md:order-2">
            <p className="text-[var(--color-brand-cyan)] text-xs md:text-sm font-mono tracking-[0.15em] uppercase">
              // {beat1.microTag}
            </p>
            <h3 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white/95 leading-tight">
              {beat1.title}
            </h3>
            <p className="text-base md:text-xl text-white/60 font-light leading-relaxed">
              {beat1.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:order-1">
            {beat1.badges?.map((badge: string, i: number) => (
              <motion.div 
                 key={i} 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 whileInView={{ opacity: 1, scale: 1, y: 0 }}
                 transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
                 whileHover={{ scale: 1.05, y: -5 }}
                 className="flex flex-col justify-center items-center text-center p-5 sm:p-6 border border-[var(--color-brand-cyan)]/20 rounded-xl bg-[var(--color-brand-cyan)]/5 hover:bg-[var(--color-brand-cyan)]/15 transition-all duration-300 backdrop-blur-sm group cursor-default shadow-[0_0_20px_rgba(0,255,255,0.02)] hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]"
              >
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="w-8 h-8 rounded-full border border-[var(--color-brand-cyan)]/40 mb-3 sm:mb-4 flex items-center justify-center group-hover:border-[var(--color-brand-cyan)] transition-colors duration-300"
                 >
                   <div className="w-2 h-2 rounded-full bg-[var(--color-brand-cyan)] shadow-[0_0_10px_var(--color-brand-cyan)]" />
                 </motion.div>
                 <span className="text-white/90 text-sm font-medium tracking-wide group-hover:text-white transition-colors">{badge}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Link to Story */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <Link
            href="/story"
            className="group inline-flex items-center gap-3 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-[var(--color-brand-cyan)]/30 bg-black/60 hover:bg-[var(--color-brand-cyan)]/10 text-white font-mono text-xs tracking-wider uppercase backdrop-blur-md transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.25)] hover:border-[var(--color-brand-cyan)]"
          >
            <span>Explore Technology & Engineering Story</span>
            <span className="text-[var(--color-brand-cyan)] group-hover:translate-x-1.5 transition-transform">→</span>
          </Link>
        </motion.div>

      </div>

      {/* =================================================================== */}
      {/* PART 3: COMMUNITY IMPACT (BIG CENTER TITLE & FLC CARD)              */}
      {/* =================================================================== */}
      <div className="w-full flex flex-col items-center gap-12 sm:gap-20 pt-12 sm:pt-16 border-t border-white/5">
        
        {/* Big Centered Designation Header */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-4xl mx-auto px-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px] sm:text-xs tracking-[0.25em] uppercase shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{impact.tag}</span>
          </div>

          <h2 className="text-3xl sm:text-7xl md:text-9xl font-black tracking-tight text-white drop-shadow-[0_0_40px_rgba(16,185,129,0.15)] leading-[0.95] break-words">
            <span 
              className="font-normal italic tracking-normal block text-3xl sm:text-6xl md:text-8xl text-white/90 pb-1 sm:pb-2" 
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {impact.italicTitle}
            </span>
            {impact.mainTitle}
          </h2>

          <p className="text-sm sm:text-lg md:text-2xl text-white/60 font-light max-w-2xl leading-relaxed mt-2 px-2">
            {impact.subtitle}
          </p>

          <div className="w-24 sm:w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
        </motion.div>

        {/* Full-width container: Candlesticks span edge-to-edge across entire screen */}
        <div className="relative w-full flex justify-center items-center py-4">
          
          {/* Panoramic Candlestick Engine spanning 100vw across full screen */}
          <div className="absolute inset-y-0 w-screen left-1/2 -translate-x-1/2 pointer-events-none overflow-hidden flex items-center justify-center">
            <div className="w-full h-[120%] relative pointer-events-auto [mask-image:linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)]">
              <CandlestickBackground />
            </div>
          </div>

          {/* High-Contrast Financial Literacy Club Card (Translucent glass elevated above full-width chart) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl p-5 sm:p-8 md:p-12 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-500 z-10"
          >
            {/* Subtle Ambient Emerald Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* Stock Ticker Marquee Ribbon */}
          <div className="relative w-full rounded-2xl bg-black/70 border border-white/10 mb-8 sm:mb-10 overflow-hidden py-3 sm:py-3.5 shadow-inner">
            {/* Edge Fade Gradients */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />

            {/* Scrolling Ticker Strip with Pause-on-hover */}
            <div className="animate-marquee items-center gap-8 cursor-default">
              {[...(flc.tickerItems || []), ...(flc.tickerItems || [])].map((item: string, idx: number) => {
                const hasGreenIndicator = item.includes('▲');
                if (hasGreenIndicator) {
                  const parts = item.split('▲');
                  return (
                    <div key={idx} className="flex items-center gap-2 font-mono text-xs text-white/85 whitespace-nowrap">
                      <span className="text-white/90">{parts[0]}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">
                        ▲ {parts[1]}
                      </span>
                      <span className="text-white/20 ml-3">•</span>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="flex items-center gap-2 font-mono text-xs text-white/85 whitespace-nowrap">
                    <span className="text-white/90">{item}</span>
                    <span className="text-white/20 ml-3">•</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Club Header & Subtitle */}
          <div className="flex flex-col gap-3 sm:gap-4 items-start relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{flc.subtitle}</span>
            </div>

            <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {flc.header}
            </h3>

            <p className="text-sm sm:text-base md:text-lg text-white/70 font-light leading-relaxed max-w-3xl mt-1">
              {flc.summary}
            </p>
          </div>

          {/* Stats Row: 3 rounded pill/card metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 mt-8 sm:mt-10 relative z-10">
            {flc.stats?.map((stat: { value: string; label: string }, idx: number) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="p-5 sm:p-6 md:p-8 rounded-2xl border border-white/10 bg-black/60 hover:bg-black/90 hover:border-emerald-500/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-center items-center text-center group/stat shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              >
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight group-hover/stat:text-emerald-400 transition-colors duration-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] font-mono">
                  {stat.value}
                </span>
                <span className="text-xs md:text-sm text-white/60 font-mono tracking-wider uppercase mt-2 sm:mt-3">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      </div>

      {/* =================================================================== */}
      {/* FINAL CTA: COLLABORATION                                            */}
      {/* =================================================================== */}
      <motion.div 
        id={beat2.id || 'beat-d'}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-5xl mx-auto w-full p-6 sm:p-12 md:p-24 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent text-center flex flex-col items-center gap-6 sm:gap-8 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,128,0.1)_0%,transparent_60%)] pointer-events-none" />
        
        <p className="text-white/60 text-xs md:text-sm font-mono tracking-[0.2em] uppercase relative z-10">
          [{beat2.microTag}]
        </p>
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white relative z-10 group-hover:text-[var(--color-brand-emerald)] transition-colors duration-700">
          {beat2.title}
        </h2>
        <p className="text-base sm:text-xl text-white/70 font-light max-w-2xl relative z-10 px-2">
          {beat2.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-4 sm:mt-8 relative z-10 w-full sm:w-auto">
          <motion.a 
            href="https://www.linkedin.com/in/sunay-raval-326215245/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto justify-center px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-black font-semibold rounded-full transition-all duration-300 inline-flex items-center gap-2.5 shadow-lg"
          >
            <span>{beat2.cta?.primary || "Get in Touch"}</span>
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.4a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
            </svg>
          </motion.a>
          <motion.div
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto rounded-full"
          >
            <Link 
              href="/story"
              className="w-full sm:w-auto justify-center px-8 sm:px-10 py-3.5 sm:py-4 border border-white/20 text-white font-medium rounded-full backdrop-blur-sm transition-all duration-300 inline-flex items-center gap-2 hover:border-white/40"
            >
              <span>{beat2.cta?.secondary || "Entrepreneurship Journey"}</span>
              <span className="text-[var(--color-brand-gold)]">→</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
}

export function PortfolioView({ content = contentData, isPreview = false }: { content?: any; isPreview?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8, 0.95], [1, 1, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

  const HERO = content?.hero || contentData.hero;
  const BEATS = content?.beats || contentData.beats;

  return (
    <main className="relative min-h-screen bg-[#050505] selection:bg-[var(--color-brand-cyan)] selection:text-white">
      
      {/* Sticky Header Nav */}
      <header className={`${isPreview ? 'absolute' : 'fixed'} top-0 inset-x-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5 h-14 sm:h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between`}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-2.5 sm:gap-3"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gradient-to-br from-[var(--color-brand-emerald)] to-[var(--color-brand-cyan)] flex items-center justify-center shadow-lg hover:shadow-[0_0_15px_var(--color-brand-emerald)] transition-shadow cursor-pointer">
            <span className="text-white font-bold text-xs sm:text-sm tracking-tighter">SR</span>
          </div>
          <span className="text-white/90 font-semibold tracking-wide hidden sm:block">SUNAY RAVAL</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-3 sm:gap-6"
        >
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-brand-emerald)]/30 bg-[var(--color-brand-emerald)]/10 hover:bg-[var(--color-brand-emerald)]/20 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-emerald)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand-emerald)]"></span>
            </span>
            <span className="text-white/80 text-xs font-medium tracking-wide">{HERO.availableBadge}</span>
          </div>
          
          <Link href="/story" className="text-xs sm:text-sm font-medium text-white/90 hover:text-[var(--color-brand-cyan)] transition-colors px-2 py-1 rounded">
            Story
          </Link>
          <a 
            href="https://www.linkedin.com/in/sunay-raval-326215245/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs sm:text-sm font-medium text-white/90 hover:text-[var(--color-brand-cyan)] transition-colors px-2 py-1 rounded"
          >
            Contact
          </a>
        </motion.div>
      </header>

      {/* Main Scrollytelling Container */}
      <div ref={containerRef} className="relative z-0">
        <FounderScrollCanvas>
          <motion.div 
            style={{ opacity: heroOpacity }}
            className="max-w-4xl flex flex-col items-center gap-2 sm:gap-4 md:gap-6"
          >
            <h1 className="text-3xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              <span 
                className="font-normal italic tracking-normal text-3xl sm:text-6xl md:text-9xl text-white/90 pb-0.5 sm:pb-3 block" 
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {HERO.titlePart1}
              </span>
              {HERO.titlePart2}
            </h1>
            
            {/* Subtitle with the warm yellow gradient glow effect right WITH it (not isolated at bottom) */}
            <div className="relative flex flex-col items-center max-w-xs sm:max-w-xl md:max-w-2xl px-2">
              {/* Sunlight glow centered right behind/with the subtitle */}
              <div 
                className="absolute -inset-3 sm:-inset-6 md:-inset-10 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.22)_0%,rgba(255,140,0,0.08)_45%,transparent_75%)] pointer-events-none mix-blend-screen blur-xl -z-10" 
              />
              
              <p className="text-xs sm:text-base md:text-xl text-white/80 font-light leading-relaxed bg-black/60 px-3.5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl border border-[var(--color-brand-gold)]/20 shadow-[0_0_30px_rgba(255,215,0,0.08)]">
                {HERO.subtitle}
              </p>

              {/* Vertical scroll indicator line placed close with the subtitle and glow */}
              <motion.div
                className="flex flex-col items-center mt-3 sm:mt-5 pointer-events-none"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-[1px] h-8 sm:h-12 bg-gradient-to-b from-[var(--color-brand-gold)]/70 via-white/40 to-transparent" />
              </motion.div>
            </div>
          </motion.div>
        </FounderScrollCanvas>
      </div>
      
      {/* Creative Section (Entrepreneurship, Technology & Community Impact) */}
      <CreativeSection content={content} beats={BEATS} />

    </main>
  );
}

export default function Portfolio() {
  return <PortfolioView />;
}
