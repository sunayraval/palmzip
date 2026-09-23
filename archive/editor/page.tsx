'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import initialContent from '@/data/content.json';
import initialStory from '@/data/story.json';
import { PortfolioView } from '@/app/page';
import { StoryPageView } from '@/app/story/page';

type TargetPage = 'home' | 'story-entrepreneurship' | 'story-technology';
type ViewMode = 'split' | 'preview' | 'editor';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export default function DevEditorPage() {
  const [target, setTarget] = useState<TargetPage>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // Live editable state
  const [content, setContent] = useState<any>(initialContent);
  const [story, setStory] = useState<any>(initialStory);

  // Editor UI state
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUnsavedHome, setHasUnsavedHome] = useState<boolean>(false);
  const [hasUnsavedStory, setHasUnsavedStory] = useState<boolean>(false);

  // Load fresh content from API on mount
  useEffect(() => {
    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setContent(data);
      })
      .catch((err) => console.error('Error fetching content:', err));

    fetch('/api/story')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setStory(data);
      })
      .catch((err) => console.error('Error fetching story:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  /* -------------------------------------------------------------------------- */
  /*                                SAVE HANDLERS                               */
  /* -------------------------------------------------------------------------- */

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (target === 'home') {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content, null, 2),
        });
        if (res.ok) {
          setHasUnsavedHome(false);
          showToast('✅ Saved changes to data/content.json');
        } else {
          showToast('❌ Failed to save content');
        }
      } else {
        const res = await fetch('/api/story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(story, null, 2),
        });
        if (res.ok) {
          setHasUnsavedStory(false);
          showToast('✅ Saved changes to data/story.json');
        } else {
          showToast('❌ Failed to save story');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Revert all unsaved changes to the saved disk state?')) {
      if (target === 'home') {
        const res = await fetch('/api/content');
        const data = await res.json();
        setContent(data);
        setHasUnsavedHome(false);
        showToast('🔄 Reverted home page content');
      } else {
        const res = await fetch('/api/story');
        const data = await res.json();
        setStory(data);
        setHasUnsavedStory(false);
        showToast('🔄 Reverted story content');
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             HOME EDIT HELPERS                              */
  /* -------------------------------------------------------------------------- */

  const updateHero = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
    setHasUnsavedHome(true);
  };

  const updateSection = (section: 'entrepreneurship' | 'technology' | 'impact', field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      sections: {
        ...(prev.sections || {}),
        [section]: {
          ...(prev.sections?.[section] || {}),
          [field]: value,
        },
      },
    }));
    setHasUnsavedHome(true);
  };

  const updateFlc = (field: string, value: any) => {
    setContent((prev: any) => ({
      ...prev,
      financialLiteracyClub: {
        ...(prev.financialLiteracyClub || {}),
        [field]: value,
      },
    }));
    setHasUnsavedHome(true);
  };

  const updateFlcStat = (index: number, field: 'value' | 'label', value: string) => {
    setContent((prev: any) => {
      const stats = [...(prev.financialLiteracyClub?.stats || [])];
      stats[index] = { ...stats[index], [field]: value };
      return {
        ...prev,
        financialLiteracyClub: {
          ...(prev.financialLiteracyClub || {}),
          stats,
        },
      };
    });
    setHasUnsavedHome(true);
  };

  const updateFlcTicker = (index: number, value: string) => {
    setContent((prev: any) => {
      const tickerItems = [...(prev.financialLiteracyClub?.tickerItems || [])];
      tickerItems[index] = value;
      return {
        ...prev,
        financialLiteracyClub: {
          ...(prev.financialLiteracyClub || {}),
          tickerItems,
        },
      };
    });
    setHasUnsavedHome(true);
  };

  const updateBeat = (beatIndex: number, field: string, value: any) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], [field]: value };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const updateMetric = (beatIndex: number, metricIndex: number, value: string) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const nextMetrics = [...(nextBeats[beatIndex].metrics || [])];
      nextMetrics[metricIndex] = value;
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], metrics: nextMetrics };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const addMetric = (beatIndex: number) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const nextMetrics = [...(nextBeats[beatIndex].metrics || []), 'New metric or achievement'];
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], metrics: nextMetrics };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const removeMetric = (beatIndex: number, metricIndex: number) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const nextMetrics = (nextBeats[beatIndex].metrics || []).filter((_: any, i: number) => i !== metricIndex);
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], metrics: nextMetrics };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const updateBadge = (beatIndex: number, badgeIndex: number, value: string) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const nextBadges = [...(nextBeats[beatIndex].badges || [])];
      nextBadges[badgeIndex] = value;
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], badges: nextBadges };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const addBadge = (beatIndex: number) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const nextBadges = [...(nextBeats[beatIndex].badges || []), 'New Badge Item'];
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], badges: nextBadges };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const removeBadge = (beatIndex: number, badgeIndex: number) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const nextBadges = (nextBeats[beatIndex].badges || []).filter((_: any, i: number) => i !== badgeIndex);
      nextBeats[beatIndex] = { ...nextBeats[beatIndex], badges: nextBadges };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  const updateCta = (field: 'primary' | 'secondary', value: string) => {
    setContent((prev: any) => {
      const nextBeats = [...prev.beats];
      const lastIndex = nextBeats.length - 1;
      nextBeats[lastIndex] = {
        ...nextBeats[lastIndex],
        cta: { ...(nextBeats[lastIndex].cta || {}), [field]: value },
      };
      return { ...prev, beats: nextBeats };
    });
    setHasUnsavedHome(true);
  };

  /* -------------------------------------------------------------------------- */
  /*                            STORY EDIT HELPERS                              */
  /* -------------------------------------------------------------------------- */

  const activeStoryTabIndex = target === 'story-technology' ? 1 : 0;
  const currentStoryTab = story.tabs?.[activeStoryTabIndex] || { milestones: [] };

  const updateMilestone = (mIndex: number, field: string, value: any) => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const newMilestones = [...newTabs[activeStoryTabIndex].milestones];
      newMilestones[mIndex] = { ...newMilestones[mIndex], [field]: value };
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const updateMilestoneSub = (mIndex: number, subField: 'eventTag' | 'achievement', value: string) => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const newMilestones = [...newTabs[activeStoryTabIndex].milestones];
      const currSub = newMilestones[mIndex].subMilestone || { eventTag: '', achievement: '' };
      newMilestones[mIndex] = {
        ...newMilestones[mIndex],
        subMilestone: { ...currSub, [subField]: value },
      };
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const updateMilestoneAccolade = (mIndex: number, accIndex: number, value: string) => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const newMilestones = [...newTabs[activeStoryTabIndex].milestones];
      const newAccs = [...(newMilestones[mIndex].accolades || [])];
      newAccs[accIndex] = value;
      newMilestones[mIndex] = { ...newMilestones[mIndex], accolades: newAccs };
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const addMilestoneAccolade = (mIndex: number) => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const newMilestones = [...newTabs[activeStoryTabIndex].milestones];
      const newAccs = [...(newMilestones[mIndex].accolades || []), 'New Honor / Award'];
      newMilestones[mIndex] = { ...newMilestones[mIndex], accolades: newAccs };
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const removeMilestoneAccolade = (mIndex: number, accIndex: number) => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const newMilestones = [...newTabs[activeStoryTabIndex].milestones];
      const newAccs = (newMilestones[mIndex].accolades || []).filter((_: any, i: number) => i !== accIndex);
      newMilestones[mIndex] = { ...newMilestones[mIndex], accolades: newAccs };
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const addMilestone = () => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const newMilestones = [
        ...newTabs[activeStoryTabIndex].milestones,
        {
          id: `milestone-${Date.now()}`,
          dateTag: 'New Date',
          title: 'New Milestone Title',
          role: 'Founder / Lead',
          category: 'Venture / Engineering',
          description: 'Description of the achievement, venture, or project.',
          accolades: ['Key Achievement'],
        },
      ];
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const removeMilestone = (mIndex: number) => {
    if (confirm('Delete this milestone?')) {
      setStory((prev: any) => {
        const newTabs = [...prev.tabs];
        const newMilestones = newTabs[activeStoryTabIndex].milestones.filter((_: any, i: number) => i !== mIndex);
        newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones: newMilestones };
        return { ...prev, tabs: newTabs };
      });
      setHasUnsavedStory(true);
    }
  };

  const moveMilestone = (mIndex: number, direction: 'up' | 'down') => {
    setStory((prev: any) => {
      const newTabs = [...prev.tabs];
      const milestones = [...newTabs[activeStoryTabIndex].milestones];
      const targetIndex = direction === 'up' ? mIndex - 1 : mIndex + 1;
      if (targetIndex < 0 || targetIndex >= milestones.length) return prev;
      const temp = milestones[mIndex];
      milestones[mIndex] = milestones[targetIndex];
      milestones[targetIndex] = temp;
      newTabs[activeStoryTabIndex] = { ...newTabs[activeStoryTabIndex], milestones };
      return { ...prev, tabs: newTabs };
    });
    setHasUnsavedStory(true);
  };

  const isHomeDirty = hasUnsavedHome;
  const isStoryDirty = hasUnsavedStory;
  const isCurrentDirty = target === 'home' ? isHomeDirty : isStoryDirty;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-[var(--color-brand-cyan)] selection:text-white">
      {/* -------------------------------------------------------------------- */}
      {/*                               TOP BAR                                */}
      {/* -------------------------------------------------------------------- */}
      <header className="h-16 bg-[#0c0c0e] border-b border-white/10 px-4 md:px-6 flex items-center justify-between shrink-0 z-40">
        {/* Left: Brand & Page Switcher */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-mono text-sm font-semibold tracking-wide hover:opacity-80 transition-opacity"
          >
            <span className="w-3 h-3 rounded-full bg-[var(--color-brand-cyan)] shadow-[0_0_8px_var(--color-brand-cyan)]" />
            <span className="hidden sm:inline">SUNAY.DEV //</span>
            <span className="text-[var(--color-brand-cyan)] font-bold">STUDIO</span>
          </Link>

          {/* Page Target Selector */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setTarget('home')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                target === 'home'
                  ? 'bg-white text-black font-semibold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🏠 Home {isHomeDirty && <span className="text-amber-500 font-bold">•</span>}
            </button>
            <button
              onClick={() => setTarget('story-entrepreneurship')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                target === 'story-entrepreneurship'
                  ? 'bg-white text-black font-semibold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🚀 Entrepreneurship {isStoryDirty && <span className="text-amber-500 font-bold">•</span>}
            </button>
            <button
              onClick={() => setTarget('story-technology')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                target === 'story-technology'
                  ? 'bg-white text-black font-semibold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ⚙️ Technology {isStoryDirty && <span className="text-amber-500 font-bold">•</span>}
            </button>
          </div>
        </div>

        {/* Center: View & Device Switchers */}
        <div className="hidden lg:flex items-center gap-3">
          {/* View Mode */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'split' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
              title="Split View (Editor + Live Preview)"
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'preview' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
              title="Full Live Preview"
            >
              Full Preview
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'editor' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
              title="Editor Panel Only"
            >
              Editor Only
            </button>
          </div>

          {/* Device Preview (Active in split / preview) */}
          {viewMode !== 'editor' && (
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  deviceMode === 'desktop' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
                }`}
              >
                🖥️ Desktop
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  deviceMode === 'tablet' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
                }`}
              >
                📟 Tablet
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  deviceMode === 'mobile' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
                }`}
              >
                📱 Mobile
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Live site link */}
          <Link
            href={target === 'home' ? '/' : '/story'}
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-all font-mono"
          >
            <span>Live Site ↗</span>
          </Link>

          {/* Reset button */}
          {isCurrentDirty && (
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-mono transition-all"
            >
              Revert
            </button>
          )}

          {/* Save to disk button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wide transition-all shadow-lg ${
              isCurrentDirty
                ? 'bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] text-black hover:opacity-95 shadow-[0_0_20px_rgba(0,255,255,0.3)] animate-pulse'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{isCurrentDirty ? 'SAVE CHANGES' : 'SAVED'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/90 text-white px-5 py-3 rounded-xl border border-[var(--color-brand-cyan)] shadow-[0_0_25px_rgba(0,255,255,0.3)] font-mono text-xs flex items-center gap-3 backdrop-blur-md animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/*                            MAIN CONTENT                              */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT COLUMN: INTERACTIVE EDITOR FORM                              */}
        {/* ================================================================= */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <aside
            className={`${
              viewMode === 'editor' ? 'w-full max-w-4xl mx-auto' : 'w-[440px] xl:w-[500px]'
            } shrink-0 border-r border-white/10 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-y-auto`}
          >
            {/* Form Header Info */}
            <div className="p-5 border-b border-white/10 bg-[#0c0c0e] sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white/90">
                    {target === 'home'
                      ? 'Home Page Content'
                      : target === 'story-entrepreneurship'
                      ? 'Story — Entrepreneurship'
                      : 'Story — Technology & Engineering'}
                  </h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">
                    {target === 'home' ? 'data/content.json' : 'data/story.json'}
                  </p>
                </div>
                {isCurrentDirty && (
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    Unsaved edits
                  </span>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-5 flex flex-col gap-6">
              {/* ===================== HOME EDITOR ===================== */}
              {target === 'home' && (
                <>
                  {/* Hero Card */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-mono font-bold uppercase text-[var(--color-brand-cyan)] tracking-wider">
                        Hero Section
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">3D Canvas Text</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Cursive Header (Title Part 1)</label>
                      <input
                        type="text"
                        value={content?.hero?.titlePart1 || ''}
                        onChange={(e) => updateHero('titlePart1', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-brand-cyan)]"
                        placeholder="e.g. Cultivating"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Bold Header (Title Part 2)</label>
                      <input
                        type="text"
                        value={content?.hero?.titlePart2 || ''}
                        onChange={(e) => updateHero('titlePart2', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-brand-cyan)]"
                        placeholder="e.g. RESILIENCE."
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Hero Subtitle</label>
                      <textarea
                        rows={3}
                        value={content?.hero?.subtitle || ''}
                        onChange={(e) => updateHero('subtitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-cyan)] resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Top Bar Available Badge</label>
                      <input
                        type="text"
                        value={content?.hero?.availableBadge || ''}
                        onChange={(e) => updateHero('availableBadge', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-brand-cyan)]"
                      />
                    </div>
                  </div>

                  {/* PART 1: Entrepreneurship Section Header Card */}
                  <div className="rounded-xl border border-[var(--color-brand-gold)]/30 bg-[var(--color-brand-gold)]/5 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[var(--color-brand-gold)]/20 pb-2">
                      <span className="text-xs font-mono font-bold uppercase text-[var(--color-brand-gold)] tracking-wider">
                        Part 1 // Entrepreneurship Header
                      </span>
                      <span className="text-[10px] text-[var(--color-brand-gold)]/60 font-mono">Big Center Title</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Tag / Badge</label>
                        <input
                          type="text"
                          value={content?.sections?.entrepreneurship?.tag || 'PART 01 // VENTURE LEADERSHIP'}
                          onChange={(e) => updateSection('entrepreneurship', 'tag', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Cursive Accent</label>
                        <input
                          type="text"
                          value={content?.sections?.entrepreneurship?.italicTitle || 'Building'}
                          onChange={(e) => updateSection('entrepreneurship', 'italicTitle', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Main Title (Bold)</label>
                      <input
                        type="text"
                        value={content?.sections?.entrepreneurship?.mainTitle || 'ENTREPRENEURSHIP'}
                        onChange={(e) => updateSection('entrepreneurship', 'mainTitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={content?.sections?.entrepreneurship?.subtitle || ''}
                        onChange={(e) => updateSection('entrepreneurship', 'subtitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Beat 0: Venture Leadership */}
                  {content?.beats?.[0] && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-mono font-bold uppercase text-[var(--color-brand-gold)] tracking-wider">
                          Beat 1 // Venture Operations
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">B&G Healthcare</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Micro Tag</label>
                        <input
                          type="text"
                          value={content.beats[0].microTag || ''}
                          onChange={(e) => updateBeat(0, 'microTag', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Title</label>
                        <input
                          type="text"
                          value={content.beats[0].title || ''}
                          onChange={(e) => updateBeat(0, 'title', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Subtitle</label>
                        <textarea
                          rows={3}
                          value={content.beats[0].subtitle || ''}
                          onChange={(e) => updateBeat(0, 'subtitle', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                        />
                      </div>

                      {/* Operational Metrics */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono text-white/60 uppercase">Operational Metrics</label>
                          <button
                            onClick={() => addMetric(0)}
                            className="text-[10px] font-mono text-[var(--color-brand-gold)] hover:underline"
                          >
                            + Add Metric
                          </button>
                        </div>
                        {content.beats[0].metrics?.map((metric: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={metric}
                              onChange={(e) => updateMetric(0, idx, e.target.value)}
                              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              onClick={() => removeMetric(0, idx)}
                              className="text-white/40 hover:text-red-400 text-xs px-2"
                              title="Delete Metric"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PART 2: Technology Section Header Card */}
                  <div className="rounded-xl border border-[var(--color-brand-cyan)]/30 bg-[var(--color-brand-cyan)]/5 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[var(--color-brand-cyan)]/20 pb-2">
                      <span className="text-xs font-mono font-bold uppercase text-[var(--color-brand-cyan)] tracking-wider">
                        Part 2 // Technology Header
                      </span>
                      <span className="text-[10px] text-[var(--color-brand-cyan)]/60 font-mono">Big Center Title</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Tag / Badge</label>
                        <input
                          type="text"
                          value={content?.sections?.technology?.tag || 'PART 02 // SYSTEMS & RESEARCH'}
                          onChange={(e) => updateSection('technology', 'tag', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Cursive Accent</label>
                        <input
                          type="text"
                          value={content?.sections?.technology?.italicTitle || 'Engineering'}
                          onChange={(e) => updateSection('technology', 'italicTitle', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Main Title (Bold)</label>
                      <input
                        type="text"
                        value={content?.sections?.technology?.mainTitle || 'TECHNOLOGY'}
                        onChange={(e) => updateSection('technology', 'mainTitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={content?.sections?.technology?.subtitle || ''}
                        onChange={(e) => updateSection('technology', 'subtitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Beat 1: AI & VLMs */}
                  {content?.beats?.[1] && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-mono font-bold uppercase text-[var(--color-brand-cyan)] tracking-wider">
                          Beat 2 // AI Research
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">Neural Net Card</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Micro Tag</label>
                        <input
                          type="text"
                          value={content.beats[1].microTag || ''}
                          onChange={(e) => updateBeat(1, 'microTag', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Title</label>
                        <input
                          type="text"
                          value={content.beats[1].title || ''}
                          onChange={(e) => updateBeat(1, 'title', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Subtitle</label>
                        <textarea
                          rows={3}
                          value={content.beats[1].subtitle || ''}
                          onChange={(e) => updateBeat(1, 'subtitle', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                        />
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono text-white/60 uppercase">Feature Badges</label>
                          <button
                            onClick={() => addBadge(1)}
                            className="text-[10px] font-mono text-[var(--color-brand-cyan)] hover:underline"
                          >
                            + Add Badge
                          </button>
                        </div>
                        {content.beats[1].badges?.map((badge: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={badge}
                              onChange={(e) => updateBadge(1, idx, e.target.value)}
                              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              onClick={() => removeBadge(1, idx)}
                              className="text-white/40 hover:text-red-400 text-xs px-2"
                              title="Delete Badge"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PART 3: Community Impact Section Header Card */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider">
                        Part 3 // Community Impact Header
                      </span>
                      <span className="text-[10px] text-emerald-400/60 font-mono">Big Center Title</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Tag / Badge</label>
                        <input
                          type="text"
                          value={content?.sections?.impact?.tag || 'COMMUNITY LEADERSHIP'}
                          onChange={(e) => updateSection('impact', 'tag', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Cursive Accent</label>
                        <input
                          type="text"
                          value={content?.sections?.impact?.italicTitle || 'Community'}
                          onChange={(e) => updateSection('impact', 'italicTitle', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Main Title (Bold)</label>
                      <input
                        type="text"
                        value={content?.sections?.impact?.mainTitle || 'IMPACT'}
                        onChange={(e) => updateSection('impact', 'mainTitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={content?.sections?.impact?.subtitle || ''}
                        onChange={(e) => updateSection('impact', 'subtitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Financial Literacy Club Card Editor */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider">
                        Financial Literacy Club Card
                      </span>
                      <span className="text-[10px] text-emerald-400/60 font-mono">High-Contrast Card</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Club Header</label>
                      <input
                        type="text"
                        value={content?.financialLiteracyClub?.header || ''}
                        onChange={(e) => updateFlc('header', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Role / Subtitle</label>
                      <input
                        type="text"
                        value={content?.financialLiteracyClub?.subtitle || ''}
                        onChange={(e) => updateFlc('subtitle', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-white/50">Summary</label>
                      <textarea
                        rows={3}
                        value={content?.financialLiteracyClub?.summary || ''}
                        onChange={(e) => updateFlc('summary', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                      />
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                      <label className="text-[11px] font-mono text-white/60 uppercase">Stats Row Metrics</label>
                      {content?.financialLiteracyClub?.stats?.map((stat: { value: string; label: string }, idx: number) => (
                        <div key={idx} className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => updateFlcStat(idx, 'value', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                            placeholder="Value (e.g. 300+)"
                          />
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => updateFlcStat(idx, 'label', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                            placeholder="Label (e.g. Students Impacted)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Ticker Items */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                      <label className="text-[11px] font-mono text-white/60 uppercase">Stock Ticker Marquee Items</label>
                      {content?.financialLiteracyClub?.tickerItems?.map((ticker: string, idx: number) => (
                        <input
                          key={idx}
                          type="text"
                          value={ticker}
                          onChange={(e) => updateFlcTicker(idx, e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Beat 2: CTA */}
                  {content?.beats?.[2] && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-mono font-bold uppercase text-[var(--color-brand-emerald)] tracking-wider">
                          Beat 3 // Collaboration & CTA
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">Footer Banner</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Micro Tag</label>
                        <input
                          type="text"
                          value={content.beats[2].microTag || ''}
                          onChange={(e) => updateBeat(2, 'microTag', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Title</label>
                        <input
                          type="text"
                          value={content.beats[2].title || ''}
                          onChange={(e) => updateBeat(2, 'title', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-white/50">Subtitle</label>
                        <textarea
                          rows={2}
                          value={content.beats[2].subtitle || ''}
                          onChange={(e) => updateBeat(2, 'subtitle', e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Primary Button</label>
                          <input
                            type="text"
                            value={content.beats[2].cta?.primary || ''}
                            onChange={(e) => updateCta('primary', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Secondary Button</label>
                          <input
                            type="text"
                            value={content.beats[2].cta?.secondary || ''}
                            onChange={(e) => updateCta('secondary', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ===================== STORY EDITOR ===================== */}
              {(target === 'story-entrepreneurship' || target === 'story-technology') && (
                <>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-mono text-white/60">
                      Milestones ({currentStoryTab.milestones?.length || 0})
                    </span>
                    <button
                      onClick={addMilestone}
                      className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--color-brand-cyan)]/20 text-[var(--color-brand-cyan)] border border-[var(--color-brand-cyan)]/40 hover:bg-[var(--color-brand-cyan)]/30 transition-all font-semibold"
                    >
                      + Add Milestone
                    </button>
                  </div>

                  {currentStoryTab.milestones?.map((milestone: any, mIdx: number) => (
                    <div
                      key={milestone.id || mIdx}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-4 relative group"
                    >
                      {/* Milestone Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">#{mIdx + 1}</span>
                          <span className="text-xs font-semibold text-white/90 truncate max-w-[200px]">
                            {milestone.title || 'Untitled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => moveMilestone(mIdx, 'up')}
                            disabled={mIdx === 0}
                            className="text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveMilestone(mIdx, 'down')}
                            disabled={mIdx === currentStoryTab.milestones.length - 1}
                            className="text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeMilestone(mIdx)}
                            className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            title="Delete Milestone"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Date Tag (Pill)</label>
                          <input
                            type="text"
                            value={milestone.dateTag || ''}
                            onChange={(e) => updateMilestone(mIdx, 'dateTag', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            placeholder="e.g. Summer 2022"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Category / Badge</label>
                          <input
                            type="text"
                            value={milestone.category || ''}
                            onChange={(e) => updateMilestone(mIdx, 'category', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            placeholder="e.g. Venture Inception"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-white/50">Milestone Title</label>
                        <input
                          type="text"
                          value={milestone.title || ''}
                          onChange={(e) => updateMilestone(mIdx, 'title', e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Role / Subtitle</label>
                          <input
                            type="text"
                            value={milestone.role || ''}
                            onChange={(e) => updateMilestone(mIdx, 'role', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            placeholder="e.g. Co-Founder"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Link (optional)</label>
                          <input
                            type="text"
                            value={milestone.link || ''}
                            onChange={(e) => updateMilestone(mIdx, 'link', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            placeholder="e.g. baghealthcare.com"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-white/50">Media Asset URL / Path</label>
                        <input
                          type="text"
                          value={milestone.mediaAsset || ''}
                          onChange={(e) => updateMilestone(mIdx, 'mediaAsset', e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          placeholder="e.g. /story-assets/notewaylogo.png"
                        />
                      </div>

                      {milestone.description !== undefined && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-white/50">Description</label>
                          <textarea
                            rows={3}
                            value={milestone.description || ''}
                            onChange={(e) => updateMilestone(mIdx, 'description', e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                          />
                        </div>
                      )}

                      {/* Sub-Milestone */}
                      <div className="p-3 rounded-lg border border-[var(--color-brand-gold)]/20 bg-[var(--color-brand-gold)]/5 flex flex-col gap-2">
                        <span className="text-[10px] font-mono text-[var(--color-brand-gold)] uppercase tracking-wider">
                          Sub-Milestone Award (Optional)
                        </span>
                        <input
                          type="text"
                          placeholder="Event Tag (e.g. 2024 TiE University Finals)"
                          value={milestone.subMilestone?.eventTag || ''}
                          onChange={(e) => updateMilestoneSub(mIdx, 'eventTag', e.target.value)}
                          className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Achievement text"
                          value={milestone.subMilestone?.achievement || ''}
                          onChange={(e) => updateMilestoneSub(mIdx, 'achievement', e.target.value)}
                          className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>

                      {/* Accolades */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono text-white/60 uppercase">
                            Accolades ({milestone.accolades?.length || 0})
                          </label>
                          <button
                            onClick={() => addMilestoneAccolade(mIdx)}
                            className="text-[10px] font-mono text-[var(--color-brand-gold)] hover:underline"
                          >
                            + Add Accolade
                          </button>
                        </div>
                        {milestone.accolades?.map((acc: string, accIdx: number) => (
                          <div key={accIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={acc}
                              onChange={(e) => updateMilestoneAccolade(mIdx, accIdx, e.target.value)}
                              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                            />
                            <button
                              onClick={() => removeMilestoneAccolade(mIdx, accIdx)}
                              className="text-white/40 hover:text-red-400 text-xs px-1.5"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </aside>
        )}

        {/* ================================================================= */}
        {/* RIGHT COLUMN: LIVE RENDERED PREVIEW                               */}
        {/* ================================================================= */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <main className="flex-1 bg-[#050505] overflow-y-auto h-[calc(100vh-4rem)] relative flex flex-col items-center">
            {/* Live Render Container */}
            <div
              className={`w-full transition-all duration-300 ${
                deviceMode === 'mobile'
                  ? 'max-w-[390px] my-8 rounded-[40px] border-4 border-zinc-700 shadow-2xl overflow-hidden bg-black'
                  : deviceMode === 'tablet'
                  ? 'max-w-[768px] my-8 rounded-[24px] border-4 border-zinc-700 shadow-2xl overflow-hidden bg-black'
                  : 'w-full'
              }`}
            >
              {/* Device Frame Header (for Mobile / Tablet) */}
              {deviceMode !== 'desktop' && (
                <div className="h-6 bg-zinc-900 border-b border-white/10 flex items-center justify-center">
                  <div className="w-16 h-2 rounded-full bg-zinc-700" />
                </div>
              )}

              {/* Render Home or Story Component directly with reactive props */}
              {target === 'home' ? (
                <PortfolioView content={content} isPreview={true} />
              ) : (
                <StoryPageView
                  customStoryData={story}
                  defaultTab={target === 'story-technology' ? 'technology' : 'entrepreneurship'}
                  isPreview={true}
                />
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
