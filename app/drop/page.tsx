'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface DropAttachment {
  id: string;
  originalName: string;
  storageFilename: string;
  mimeType: string;
  size: number;
  url: string;
}

export type DropType = 'file' | 'image' | 'text' | 'link' | 'chat';

interface DropItem {
  id: string;
  type: DropType;
  title?: string;
  content: string;
  createdAt: string;
  timestamp: number;
  device?: string;
  attachment?: DropAttachment;
  isSending?: boolean;
}

const PASSCODE = '2008';
const AUTH_STORAGE_KEY = 'palmzip_drop_auth_v1';
const DEVICE_STORAGE_KEY = 'palmzip_drop_device_v1';
const SOUND_STORAGE_KEY = 'palmzip_drop_sound_v1';
const DROPS_CACHE_KEY = 'palmzip_drops_cache_v1';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function detectDefaultDevice(): string {
  if (typeof window === 'undefined') return 'Device';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Browser';
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio permission or restriction errors
  }
}

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-brand-cyan)] underline underline-offset-2 hover:opacity-80 transition-opacity break-all font-medium"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function mergeDropLists(currentList: DropItem[], incomingList: DropItem[]): DropItem[] {
  const map = new Map<string, DropItem>();

  // Keep optimistic in-flight drops
  for (const item of currentList) {
    if (item.isSending) {
      map.set(item.id, item);
    }
  }

  // Add / overwrite with server-confirmed drops
  for (const item of incomingList) {
    for (const [key, curr] of Array.from(map.entries())) {
      if (
        curr.isSending &&
        curr.content === item.content &&
        Math.abs(curr.timestamp - item.timestamp) < 15000
      ) {
        map.delete(key);
      }
    }
    map.set(item.id, item);
  }

  // Sort chronologically (oldest to newest for chat, newest first for clipboard)
  const sorted = Array.from(map.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-10);

  return sorted;
}

export default function DropPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPasscode, setInputPasscode] = useState<string>('');
  const [passError, setPassError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showPass, setShowPass] = useState<boolean>(false);

  // View Mode: 'can' (Clipboard / Drop Can) vs 'chat' (Secondary Live Chat)
  const [viewMode, setViewMode] = useState<'can' | 'chat'>('can');

  // Drops State
  const [drops, setDrops] = useState<DropItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('Device');
  const [editingDevice, setEditingDevice] = useState<boolean>(false);
  const [tempDeviceInput, setTempDeviceInput] = useState<string>('');

  // Drop / File State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const seenDropIdsRef = useRef<Set<string>>(new Set());
  const initialLoadedRef = useRef<boolean>(false);
  const deviceNameRef = useRef<string>('Device');
  const soundEnabledRef = useRef<boolean>(true);

  // Keep refs updated
  useEffect(() => {
    deviceNameRef.current = deviceName;
  }, [deviceName]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Check saved preferences on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth === PASSCODE) {
      setIsAuthenticated(true);
    }

    const savedDevice = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (savedDevice && savedDevice.trim()) {
      setDeviceName(savedDevice.trim());
      deviceNameRef.current = savedDevice.trim();
    } else {
      const detected = detectDefaultDevice();
      setDeviceName(detected);
      deviceNameRef.current = detected;
    }

    const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
    if (savedSound !== null) {
      const isSound = savedSound === 'true';
      setSoundEnabled(isSound);
      soundEnabledRef.current = isSound;
    }
  }, []);

  // Sync scroll for chat mode
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Merge and apply incoming drops
  const applyIncomingDrops = useCallback((incoming: DropItem[]) => {
    if (!Array.isArray(incoming)) return;

    if (initialLoadedRef.current) {
      for (const d of incoming) {
        if (!seenDropIdsRef.current.has(d.id)) {
          if (d.device !== deviceNameRef.current && soundEnabledRef.current) {
            playNotificationChime();
          }
        }
      }
    }

    for (const d of incoming) {
      seenDropIdsRef.current.add(d.id);
    }
    initialLoadedRef.current = true;

    setDrops((prev) => {
      const merged = mergeDropLists(prev, incoming);
      try {
        localStorage.setItem(DROPS_CACHE_KEY, JSON.stringify(merged));
      } catch {
        // ignore storage error
      }
      return merged;
    });
    setIsConnected(true);
  }, []);

  // Fetch drops from server
  const fetchDrops = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(`/api/drop/items?auth=${PASSCODE}`, {
        cache: 'no-store',
        headers: { 'x-drop-auth': PASSCODE },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.drops && Array.isArray(data.drops)) {
          applyIncomingDrops(data.drops);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch drops:', err);
      setIsConnected(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [applyIncomingDrops]);

  // Set up live sync when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Immediately load cached drops for instant display
    try {
      const cached = localStorage.getItem(DROPS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDrops(parsed);
          for (const d of parsed) {
            seenDropIdsRef.current.add(d.id);
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Initial fetch
    fetchDrops();

    // 3. Connect to live SSE Stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/drop/stream?auth=${PASSCODE}`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.drops && Array.isArray(payload.drops)) {
            applyIncomingDrops(payload.drops);
          }
        } catch {
          // ignore heartbeat ping
        }
      };

      eventSource.onerror = () => {
        // Falls back to polling
      };
    } catch {
      // ignore
    }

    // 4. Polling fallback every 2.5s
    const pollInterval = setInterval(() => {
      fetchDrops();
    }, 2500);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, fetchDrops, applyIncomingDrops]);

  // Auto-scroll on chat mode
  useEffect(() => {
    if (viewMode === 'chat' && drops.length > 0) {
      scrollToBottom();
    }
  }, [viewMode, drops.length, scrollToBottom]);

  // Handle file preview URL
  useEffect(() => {
    if (!pendingFile) {
      setFilePreviewUrl(null);
      return;
    }

    if (pendingFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(pendingFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  }, [pendingFile]);

  // Window-wide Drag and Drop handler
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        setIsDraggingOver(false);
        dragCounterRef.current = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        setPendingFile(file);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [isAuthenticated]);

  // Window-wide Paste handler (files, images, or text)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePaste = (e: ClipboardEvent) => {
      // If user is actively typing in a textarea or input, allow normal paste inside it
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      const items = e.clipboardData?.items;
      if (!items) return;

      // 1. Check for file or image paste
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setPendingFile(file);
            return;
          }
        }
      }

      // 2. If not focusing an input, paste text directly as a drop item
      if (!isInput) {
        const text = e.clipboardData?.getData('text');
        if (text && text.trim()) {
          e.preventDefault();
          handleDirectDropText(text.trim());
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAuthenticated]);

  // Handle Passcode Submission
  const handlePasscodeSubmit = async (codeToTry = inputPasscode) => {
    setPassError('');
    if (!codeToTry.trim()) return;

    setIsVerifying(true);
    try {
      const res = await fetch('/api/drop/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: codeToTry.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, PASSCODE);
        setInputPasscode('');
      } else {
        setPassError('Incorrect passcode. Try again.');
        setInputPasscode('');
      }
    } catch {
      setPassError('Network error. Check connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Lock Vault
  const handleLockVault = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setInputPasscode('');
    setPassError('');
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    localStorage.setItem(SOUND_STORAGE_KEY, String(next));
  };

  // Save Custom Device Name
  const handleSaveDeviceName = (name: string) => {
    const trimmed = name.trim() || 'Device';
    setDeviceName(trimmed);
    deviceNameRef.current = trimmed;
    localStorage.setItem(DEVICE_STORAGE_KEY, trimmed);
    setEditingDevice(false);
  };

  // Direct drop of text / note
  const handleDirectDropText = async (text: string) => {
    if (!text.trim() || isUploading) return;
    executeDrop(text.trim(), null, viewMode === 'chat' ? 'chat' : undefined);
  };

  // Execute drop / upload
  const executeDrop = async (textToSend: string, fileToSend: File | null, customType?: DropType) => {
    if ((!textToSend && !fileToSend) || isUploading) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticDrop: DropItem = {
      id: tempId,
      type: fileToSend
        ? fileToSend.type.startsWith('image/')
          ? 'image'
          : 'file'
        : /^https?:\/\/[^\s]+$/i.test(textToSend)
        ? 'link'
        : customType || 'text',
      content: textToSend || fileToSend?.name || 'File',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      device: deviceName,
      isSending: true,
      attachment: fileToSend
        ? {
            id: tempId,
            originalName: fileToSend.name,
            storageFilename: '',
            mimeType: fileToSend.type,
            size: fileToSend.size,
            url: filePreviewUrl || '',
          }
        : undefined,
    };

    seenDropIdsRef.current.add(tempId);
    setDrops((prev) => {
      const next = [...prev, optimisticDrop].slice(-10);
      try {
        localStorage.setItem(DROPS_CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setInputText('');
    setPendingFile(null);
    setIsUploading(true);

    try {
      let res: Response;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('content', textToSend);
        formData.append('device', deviceName);
        if (customType) formData.append('type', customType);
        formData.append('file', fileToSend);

        res = await fetch('/api/drop/items', {
          method: 'POST',
          headers: { 'x-drop-auth': PASSCODE },
          body: formData,
        });
      } else {
        res = await fetch('/api/drop/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-drop-auth': PASSCODE,
          },
          body: JSON.stringify({
            content: textToSend,
            device: deviceName,
            type: customType,
          }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.drops) {
          applyIncomingDrops(data.drops);
        }
      } else {
        setDrops((prev) => prev.filter((d) => d.id !== tempId));
        alert('Could not deliver drop. Please retry.');
      }
    } catch (err) {
      console.error('Failed to drop:', err);
      setDrops((prev) => prev.filter((d) => d.id !== tempId));
    } finally {
      setIsUploading(false);
      if (viewMode === 'chat') {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  };

  // Submit form drop
  const handleDropSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeDrop(inputText.trim(), pendingFile, viewMode === 'chat' ? 'chat' : undefined);
  };

  // Delete Individual Drop
  const handleDeleteDrop = async (id: string) => {
    setDrops((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(DROPS_CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch(`/api/drop/items?id=${id}&auth=${PASSCODE}`, {
        method: 'DELETE',
        headers: { 'x-drop-auth': PASSCODE },
      });
    } catch (err) {
      console.error('Failed to delete drop:', err);
    }
  };

  // Clear Entire Can
  const handleClearAll = async () => {
    setDrops([]);
    try {
      localStorage.removeItem(DROPS_CACHE_KEY);
    } catch {}
    setConfirmClearOpen(false);

    try {
      await fetch(`/api/drop/items?all=true&auth=${PASSCODE}`, {
        method: 'DELETE',
        headers: { 'x-drop-auth': PASSCODE },
      });
    } catch (err) {
      console.error('Failed to clear drop can:', err);
    }
  };

  // Copy Content / URL to clipboard
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Paste from device clipboard into drop input
  const handleReadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        textareaRef.current?.focus();
      }
    } catch {
      alert('Clipboard read permission denied. Use Ctrl+V / Cmd+V to paste directly!');
    }
  };

  /* ======================================================================== */
  /*                         1. PASSWORD GATE SCREEN                          */
  /* ======================================================================== */
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-[#06080d] flex items-center justify-center p-4 selection:bg-[var(--color-brand-cyan)] selection:text-white overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(4,75,54,0.15)_0%,transparent_70%)] pointer-events-none blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md bg-[#0c1017]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center flex flex-col items-center gap-6"
        >
          {/* Top Back Link */}
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5 font-mono uppercase tracking-wider mb-1"
          >
            <span>←</span> Back to Palmzip
          </Link>

          {/* Glowing Drop Can Vault Icon */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] rounded-2xl opacity-40 blur-lg animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-black/60 border border-white/20 flex items-center justify-center text-3xl shadow-xl">
              📥
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Drop Can
            </h1>
            <p className="text-xs sm:text-sm text-white/60">
              Universal clipboard & drop vault. Drop on one device, grab from any other.
            </p>
          </div>

          {/* Passcode Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePasscodeSubmit();
            }}
            className="w-full flex flex-col items-center gap-4"
          >
            <div className="w-full relative">
              <input
                type={showPass ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                placeholder="Enter passcode (2008)"
                value={inputPasscode}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputPasscode(val);
                  setPassError('');
                  if (val === PASSCODE) {
                    handlePasscodeSubmit(val);
                  }
                }}
                className={`w-full bg-black/50 border ${
                  passError
                    ? 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'border-white/15 focus:border-[var(--color-brand-cyan)] shadow-inner'
                } rounded-2xl px-5 py-4 text-center text-2xl font-mono tracking-[0.3em] text-white placeholder:text-white/25 placeholder:text-sm placeholder:tracking-normal outline-none transition-all`}
              />

              {inputPasscode && (
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              )}
            </div>

            {/* Error Message */}
            {passError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 font-medium flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-xl"
              >
                <span>⚠️</span>
                <span>{passError}</span>
              </motion.div>
            )}

            {/* Numeric Quick Pad for Mobile */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] my-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '➔'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') {
                      setInputPasscode('');
                      setPassError('');
                    } else if (key === '➔') {
                      handlePasscodeSubmit();
                    } else {
                      const next = inputPasscode + key;
                      setInputPasscode(next);
                      if (next === PASSCODE) {
                        handlePasscodeSubmit(next);
                      }
                    }
                  }}
                  className="h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] active:scale-95 border border-white/5 text-white font-mono font-medium text-base transition-all flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isVerifying || !inputPasscode}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] hover:opacity-95 active:scale-[0.98] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Opening Can...</span>
                </>
              ) : (
                <>
                  <span>Unlock Drop Can</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="text-[11px] text-white/35 font-mono">
            PIN 2008 required • Encrypted Universal Sync
          </div>
        </motion.div>
      </main>
    );
  }

  /* ======================================================================== */
  /*                       2. MAIN DROP CAN & VAULT UI                        */
  /* ======================================================================== */
  // Sort drops: newest first for clipboard grid, chronological for chat
  const clipboardDrops = [...drops].reverse();

  return (
    <main className="relative min-h-screen bg-[#07090e] text-white flex flex-col selection:bg-[var(--color-brand-cyan)] selection:text-white">
      {/* Drag & Drop Fullscreen Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090e]/92 backdrop-blur-xl flex flex-col items-center justify-center border-4 border-dashed border-[var(--color-brand-cyan)] p-6 pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="w-28 h-28 rounded-3xl bg-[var(--color-brand-cyan)]/20 border border-[var(--color-brand-cyan)]/50 flex items-center justify-center text-5xl mb-4 shadow-[0_0_60px_rgba(6,182,212,0.4)]"
            >
              📥
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">Drop it in the Can!</h2>
            <p className="text-sm text-white/70 text-center max-w-sm">
              Release to instantly send this item to all your connected devices.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
              <a
                href={lightboxImage}
                download
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>⬇ Download</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold border border-white/15 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Full preview"
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {confirmClearOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#0f141d] border border-white/15 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xl flex items-center justify-center mx-auto">
                🗑️
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white">Empty Drop Can?</h3>
                <p className="text-xs text-white/60">
                  This will clear all 10 stored drops across all your devices.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-900/40 transition-colors cursor-pointer"
                >
                  Yes, Empty Can
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* 2A. TOP NAVIGATION BAR                                               */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#07090e]/85 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
            title="Return to Palmzip"
          >
            <span>←</span>
            <span className="hidden sm:inline">Palmzip</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] p-[1.5px] shadow-md">
                <div className="w-full h-full bg-[#0c1017] rounded-[14px] flex items-center justify-center text-sm">
                  📥
                </div>
              </div>
              {isConnected && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#07090e]" />
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  Drop Can
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <span className="text-[11px] text-white/45">Universal Clipboard & Vault</span>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                soundEnabled
                  ? 'border-white/10 text-white/80 bg-white/5'
                  : 'border-white/5 text-white/30'
              }`}
              title={soundEnabled ? 'Sound On' : 'Muted'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button
              type="button"
              onClick={handleLockVault}
              className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs bg-white/5"
              title="Lock vault"
            >
              🔒
            </button>
          </div>
        </div>

        {/* Center: Mode Switcher Pill (Drop Can vs Chat Mode) */}
        <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('can')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'can'
                ? 'bg-gradient-to-r from-[var(--color-brand-cyan)] to-teal-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>📥</span>
            <span>Drop Can (Clipboard)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'chat'
                ? 'bg-gradient-to-r from-teal-500 to-[var(--color-brand-emerald)] text-white shadow-[0_0_15px_rgba(4,75,54,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>💬</span>
            <span>Live Chat</span>
          </button>
        </div>

        {/* Right: Storage Meter + Device Badge + Actions */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
          {/* Storage Meter */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/70"
            title="Keeps the last 10 drops rolling automatically"
          >
            <span className="text-cyan-400">💾</span>
            <span className="font-mono text-white font-medium">{drops.length}/10</span>
            <span className="hidden md:inline text-white/40">items</span>
          </div>

          {/* Device Label / Rename Pill */}
          {editingDevice ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveDeviceName(tempDeviceInput);
              }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                autoFocus
                maxLength={20}
                value={tempDeviceInput}
                onChange={(e) => setTempDeviceInput(e.target.value)}
                placeholder="Device name"
                className="bg-black/60 border border-[var(--color-brand-cyan)] rounded-xl px-2 py-0.5 text-xs text-white outline-none w-24"
              />
              <button
                type="submit"
                className="text-[10px] text-cyan-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10"
              >
                Save
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempDeviceInput(deviceName);
                setEditingDevice(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[11px] text-white/75 hover:text-white transition-colors cursor-pointer"
              title="Click to rename this device"
            >
              <span className="text-white/40">📱</span>
              <span className="font-medium truncate max-w-[80px] sm:max-w-[120px]">
                {deviceName}
              </span>
              <span className="text-[9px] text-white/30">✎</span>
            </button>
          )}

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? 'border-white/15 text-white/90 bg-white/5 hover:bg-white/10'
                  : 'border-white/5 text-white/30 hover:text-white/50'
              }`}
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>

            {drops.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/20 text-xs transition-colors cursor-pointer"
                title="Empty drop can"
              >
                🗑️
              </button>
            )}

            <button
              type="button"
              onClick={handleLockVault}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock vault"
            >
              <span>🔒</span>
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hidden Global Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setPendingFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setPendingFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* 2B. MODE 1: DROP CAN & UNIVERSAL CLIPBOARD (PRIMARY VIEW)            */}
      {/* ==================================================================== */}
      {viewMode === 'can' && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
          {/* THE DROP CAN TARGET ZONE */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer rounded-3xl p-6 sm:p-10 border-2 border-dashed border-cyan-500/30 hover:border-[var(--color-brand-cyan)] bg-gradient-to-b from-[#0e1622]/80 via-[#0a1017]/70 to-[#07090e]/90 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.18)] flex flex-col items-center justify-center text-center gap-4 overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity" />

            {/* Glowing Can Icon */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black/60 border border-cyan-500/30 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl group-hover:scale-105 group-hover:border-[var(--color-brand-cyan)] transition-all">
                📥
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[var(--color-brand-cyan)] text-black text-[10px] font-bold font-mono uppercase tracking-wider shadow">
                Drop Zone
              </span>
            </div>

            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                Drop any file or paste anywhere
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                Click to browse files, drag and drop into this can, or press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">
                  Ctrl+V
                </kbd>{' '}
                to paste screenshots, text, or docs.
              </p>
            </div>

            {/* Action buttons inside can */}
            <div
              className="flex items-center gap-2.5 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>📁</span>
                <span>Choose File</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>📷</span>
                <span>Camera / Scan</span>
              </button>

              <button
                type="button"
                onClick={handleReadClipboard}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hidden sm:flex"
                title="Paste from clipboard"
              >
                <span>📋</span>
                <span>Paste Clipboard</span>
              </button>
            </div>
          </div>

          {/* QUICK TEXT / LINK DROP COMPOSER */}
          <div className="bg-[#0c111a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
            {/* Attachment preview if selected */}
            <AnimatePresence>
              {pendingFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {filePreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                        📎
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[400px]">
                        {pendingFile.name}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        {formatFileSize(pendingFile.size)} • Ready to drop
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleDropSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Drop a note, URL, code, or message into the can..."
                  className="w-full bg-black/60 border border-white/15 focus:border-[var(--color-brand-cyan)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white text-base transition-colors flex items-center justify-center cursor-pointer"
                  title="Attach file"
                >
                  📎
                </button>

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !pendingFile) || isUploading}
                  className="h-11 flex-1 sm:flex-none px-5 rounded-xl bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] hover:opacity-95 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-950/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Dropping...</span>
                    </>
                  ) : (
                    <>
                      <span>Drop to Vault</span>
                      <span>➔</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* PAST 10 DROPS (THE UNIVERSAL CLIPBOARD FEED) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Clipboard Vault
                </h3>
                <span className="text-[11px] text-white/40">
                  (Past {drops.length} {drops.length === 1 ? 'drop' : 'drops'})
                </span>
              </div>
              <span className="text-[11px] text-white/40 hidden sm:inline">
                Tap Copy or Download on any device
              </span>
            </div>

            {/* Empty state */}
            {drops.length === 0 && (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl text-white/50">
                  🪣
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-white/70">The Drop Can is empty</h4>
                  <p className="text-xs text-white/40 max-w-xs">
                    Drop a file, screenshot, or paste text above to start your shared clipboard!
                  </p>
                </div>
              </div>
            )}

            {/* Drops Cards Grid / Feed */}
            <div className="grid grid-cols-1 gap-3">
              {clipboardDrops.map((drop) => {
                const isImage = drop.attachment?.mimeType.startsWith('image/');
                const isFile = drop.attachment && !isImage;
                const isLink = drop.type === 'link';
                const isCopied = copiedId === drop.id;

                return (
                  <motion.div
                    key={drop.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-[#0d121b]/90 hover:bg-[#101722] border border-white/10 hover:border-cyan-500/30 rounded-2xl p-4 transition-all shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Left: Icon / Thumbnail & Content */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Image Thumbnail */}
                      {isImage && drop.attachment && (
                        <div
                          onClick={() => setLightboxImage(drop.attachment!.url)}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 shrink-0 bg-black/40 cursor-zoom-in group/thumb relative"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={drop.attachment.url}
                            alt={drop.attachment.originalName}
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                          />
                        </div>
                      )}

                      {/* File Icon */}
                      {isFile && (
                        <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xl shrink-0">
                          📄
                        </div>
                      )}

                      {/* Link Icon */}
                      {isLink && (
                        <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-300 flex items-center justify-center text-xl shrink-0">
                          🔗
                        </div>
                      )}

                      {/* Text / Note Icon */}
                      {!drop.attachment && !isLink && (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 flex items-center justify-center text-lg shrink-0">
                          📝
                        </div>
                      )}

                      {/* Text details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-white/60 border border-white/5">
                            {drop.device || 'Device'}
                          </span>
                          <span className="text-[10px] font-mono text-white/35">
                            {drop.createdAt}
                          </span>
                          {drop.attachment && (
                            <span className="text-[10px] font-mono text-cyan-400">
                              {formatFileSize(drop.attachment.size)}
                            </span>
                          )}
                        </div>

                        {/* Drop content / title */}
                        {drop.attachment ? (
                          <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-full">
                            {drop.attachment.originalName}
                          </span>
                        ) : isLink ? (
                          <a
                            href={drop.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-semibold text-cyan-300 hover:underline truncate max-w-full"
                          >
                            {drop.content}
                          </a>
                        ) : (
                          <p className="text-xs sm:text-sm text-white/90 whitespace-pre-wrap break-words line-clamp-3">
                            {renderTextWithLinks(drop.content)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Instant Grab / Clipboard Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Copy Button (for text, links, or file URLs) */}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyToClipboard(
                            drop.attachment ? drop.attachment.url : drop.content,
                            drop.id
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                            : 'bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white'
                        }`}
                        title="Copy to clipboard"
                      >
                        <span>{isCopied ? '✅' : '📋'}</span>
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>

                      {/* Download Button (if file / attachment) */}
                      {drop.attachment && (
                        <a
                          href={drop.attachment.url}
                          download={drop.attachment.originalName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>⬇</span>
                          <span>Download</span>
                        </a>
                      )}

                      {/* Open Link Button (if URL) */}
                      {isLink && (
                        <a
                          href={drop.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/30 text-teal-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>↗</span>
                          <span>Open</span>
                        </a>
                      )}

                      {/* Delete Drop Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDrop(drop.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                        title="Delete drop"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2C. MODE 2: LIVE CHAT STREAM (SECONDARY VIEW)                        */}
      {/* ==================================================================== */}
      {viewMode === 'chat' && (
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            <div className="mx-auto text-center px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 max-w-md">
              <p className="text-[11px] text-white/40 leading-relaxed">
                💬 <strong>Chat Stream:</strong> Instant communication mode. Items dropped here also appear in your Drop Can.
              </p>
            </div>

            {drops.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl text-white/50">
                  💬
                </div>
                <h4 className="text-sm font-bold text-white/70">No messages yet</h4>
                <p className="text-xs text-white/40 max-w-xs">
                  Type a message or attach a file below to chat across your devices!
                </p>
              </div>
            )}

            {drops.map((msg) => {
              const isMyDevice = msg.device === deviceName;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col group ${isMyDevice ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${
                      isMyDevice ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <span className="font-semibold text-cyan-400 flex items-center gap-1">
                      <span>{msg.device || 'Device'}</span>
                      {isMyDevice && <span className="text-[10px] text-white/40">(This device)</span>}
                    </span>
                    <span className="text-white/35 font-mono text-[10px]">{msg.createdAt}</span>

                    <button
                      type="button"
                      onClick={() => handleDeleteDrop(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 p-0.5 rounded cursor-pointer"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>

                  <div
                    className={`relative max-w-[88%] sm:max-w-[75%] rounded-3xl p-4 shadow-xl text-sm leading-relaxed ${
                      isMyDevice
                        ? 'bg-gradient-to-br from-cyan-950/80 via-[#0c242c] to-[#044b36]/90 border border-cyan-500/30 text-white rounded-tr-sm'
                        : 'bg-[#10141d]/90 backdrop-blur-xl border border-white/10 text-white/95 rounded-tl-sm'
                    }`}
                  >
                    {msg.isSending && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/50">
                        <span className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.attachment && msg.attachment.mimeType.startsWith('image/') && (
                      <div className="mb-3 overflow-hidden rounded-2xl border border-white/15 bg-black/40 group/img relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.originalName}
                          className="max-h-72 w-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                          onClick={() => setLightboxImage(msg.attachment!.url)}
                        />
                      </div>
                    )}

                    {/* File Attachment */}
                    {msg.attachment && !msg.attachment.mimeType.startsWith('image/') && (
                      <div className="mb-3 p-3 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                            📄
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-xs text-white truncate max-w-[200px]">
                              {msg.attachment.originalName}
                            </span>
                            <span className="text-[10px] text-white/50 font-mono">
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>

                        <a
                          href={msg.attachment.url}
                          download={msg.attachment.originalName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                        >
                          ⬇
                        </a>
                      </div>
                    )}

                    {/* Text */}
                    {msg.content && (
                      <div className="whitespace-pre-wrap break-words font-normal">
                        {renderTextWithLinks(msg.content)}
                      </div>
                    )}

                    {/* Quick copy text */}
                    {msg.content && (
                      <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyToClipboard(
                              msg.attachment ? msg.attachment.url : msg.content,
                              msg.id
                            )
                          }
                          className="text-[10px] text-white/40 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{copiedId === msg.id ? '✅ Copied' : '📋 Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Composer Bar */}
          <footer className="sticky bottom-0 z-40 bg-[#07090e]/95 backdrop-blur-2xl border-t border-white/10 p-3 sm:p-4 w-full">
            <AnimatePresence>
              {pendingFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2.5 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3"
                >
                  <span className="text-xs text-white truncate max-w-[240px]">
                    📎 {pendingFile.name} ({formatFileSize(pendingFile.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    className="text-xs text-white/60 hover:text-white px-2 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleDropSubmit} className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 w-11 shrink-0 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/80 hover:text-white text-lg transition-colors cursor-pointer"
                title="Attach file"
              >
                📎
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  placeholder="Message or drop note... (Enter to send)"
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleDropSubmit();
                    }
                  }}
                  className="w-full bg-black/60 border border-white/15 focus:border-[var(--color-brand-cyan)] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none resize-none min-h-[44px] max-h-32 transition-colors shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={(!inputText.trim() && !pendingFile) || isUploading}
                className="h-11 px-5 shrink-0 rounded-2xl font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-lg bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] shadow-cyan-900/30 hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <span className="text-xs">➔</span>
                  </>
                )}
              </button>
            </form>
          </footer>
        </div>
      )}
    </main>
  );
}
