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

const PASSCODE = '197577';
const AUTH_STORAGE_KEY = 'palmzip_drop_auth_v2';
const DEVICE_STORAGE_KEY = 'palmzip_drop_device_v1';
const SOUND_STORAGE_KEY = 'palmzip_drop_sound_v1';
const DROPS_CACHE_KEY = 'palmzip_drops_cache_v2';

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

// Subtle tactile mechanical touch click feedback
function playTactileClick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch {
    // Ignore audio permission or restriction errors
  }
}

// Chime on new drop received from another device
function playDropNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio permission or restriction errors
  }
}

// Haptic feedback trigger for touch screens
function triggerHaptic(type: 'tap' | 'success' | 'error' = 'tap') {
  playTactileClick();
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'tap') navigator.vibrate(12);
      else if (type === 'success') navigator.vibrate([15, 40, 25]);
      else if (type === 'error') navigator.vibrate([40, 60, 40]);
    } catch {
      // ignore
    }
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
          className="text-[var(--color-brand-cyan)] underline underline-offset-2 hover:opacity-80 transition-opacity break-all font-mono"
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

  for (const item of currentList) {
    if (item.isSending) {
      map.set(item.id, item);
    }
  }

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
  const [shakeKey, setShakeKey] = useState<number>(0);

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

  useEffect(() => {
    deviceNameRef.current = deviceName;
  }, [deviceName]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Set clean document title on mount (absolutely NO PIN digits in browser tab)
  useEffect(() => {
    document.title = 'Drop Vault';
  }, []);

  // Check saved credentials & preferences on mount
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
            playDropNotificationChime();
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
        // ignore storage quota error
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

    fetchDrops();

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
          // heartbeat ping
        }
      };

      eventSource.onerror = () => {
        // Fallback polling handles it
      };
    } catch {
      // ignore
    }

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

  useEffect(() => {
    if (viewMode === 'chat' && drops.length > 0) {
      scrollToBottom();
    }
  }, [viewMode, drops.length, scrollToBottom]);

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
        triggerHaptic('success');
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

  // Window-wide Paste handler
  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setPendingFile(file);
            triggerHaptic('success');
            return;
          }
        }
      }

      if (!isInput) {
        const text = e.clipboardData?.getData('text');
        if (text && text.trim()) {
          e.preventDefault();
          triggerHaptic('tap');
          handleDirectDropText(text.trim());
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAuthenticated]);

  // Handle 6-Digit Passcode Verification
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
        triggerHaptic('success');
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, PASSCODE);
        setInputPasscode('');
      } else {
        triggerHaptic('error');
        setPassError('Access Denied • Invalid Code');
        setInputPasscode('');
        setShakeKey((prev) => prev + 1);
      }
    } catch {
      triggerHaptic('error');
      setPassError('Connection error. Retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Numpad key tap handler for 6-digit pin
  const handleKeypadPress = (key: string) => {
    triggerHaptic('tap');
    if (key === 'C') {
      setInputPasscode('');
      setPassError('');
    } else if (key === '⌫') {
      setInputPasscode((prev) => prev.slice(0, -1));
      setPassError('');
    } else if (key === '➔') {
      if (inputPasscode.length === 6) {
        handlePasscodeSubmit(inputPasscode);
      }
    } else {
      if (inputPasscode.length < 6) {
        const next = inputPasscode + key;
        setInputPasscode(next);
        setPassError('');
        if (next.length === 6) {
          handlePasscodeSubmit(next);
        }
      }
    }
  };

  // Lock Vault
  const handleLockVault = () => {
    triggerHaptic('tap');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setInputPasscode('');
    setPassError('');
  };

  // Toggle Sound
  const handleToggleSound = () => {
    triggerHaptic('tap');
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    localStorage.setItem(SOUND_STORAGE_KEY, String(next));
  };

  // Save Custom Device Name
  const handleSaveDeviceName = (name: string) => {
    triggerHaptic('tap');
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
    triggerHaptic('tap');

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
        triggerHaptic('success');
        const data = await res.json();
        if (data.drops) {
          applyIncomingDrops(data.drops);
        }
      } else {
        triggerHaptic('error');
        setDrops((prev) => prev.filter((d) => d.id !== tempId));
        alert('Could not deliver drop. Please retry.');
      }
    } catch (err) {
      triggerHaptic('error');
      console.error('Failed to drop:', err);
      setDrops((prev) => prev.filter((d) => d.id !== tempId));
    } finally {
      setIsUploading(false);
      if (viewMode === 'chat') {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  };

  const handleDropSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeDrop(inputText.trim(), pendingFile, viewMode === 'chat' ? 'chat' : undefined);
  };

  const handleDeleteDrop = async (id: string) => {
    triggerHaptic('tap');
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

  const handleClearAll = async () => {
    triggerHaptic('error');
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

  const handleCopyToClipboard = (text: string, id: string) => {
    triggerHaptic('success');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleReadClipboard = async () => {
    triggerHaptic('tap');
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        textareaRef.current?.focus();
      }
    } catch {
      alert('Clipboard access blocked. Use Ctrl+V / Cmd+V directly on the page!');
    }
  };

  /* ======================================================================== */
  /*                         1. BLACK GRIDDY AUTH SCREEN                      */
  /* ======================================================================== */
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-[#000000] text-white flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-black overflow-hidden touch-manipulation font-sans">
        {/* Black Precision Tactical Grid Background (Only on /drop) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: '#000000',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            backgroundPosition: 'center center',
          }}
        />

        {/* Ambient Focal Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,transparent_65%)] pointer-events-none blur-3xl" />

        {/* Tactical Crosshair Accents */}
        <div className="absolute top-6 left-6 font-mono text-[10px] text-white/30 tracking-widest uppercase select-none hidden sm:block">
          SYS.NODE // 1975-ENCRYPT
        </div>
        <div className="absolute top-6 right-6 font-mono text-[10px] text-cyan-400/50 tracking-widest uppercase select-none hidden sm:block">
          ● AIRDROP_VAULT: ARMED
        </div>
        <div className="absolute bottom-6 left-6 font-mono text-[10px] text-white/20 tracking-widest uppercase select-none hidden sm:block">
          COORD [39.18° N, 76.82° W]
        </div>
        <div className="absolute bottom-6 right-6 font-mono text-[10px] text-white/20 tracking-widest uppercase select-none hidden sm:block">
          VER 2.4.0 // TACTICAL
        </div>

        {/* Lock Card Container */}
        <motion.div
          key={shakeKey}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: passError ? [-10, 10, -8, 8, -4, 4, 0] : 0,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm bg-[#050507]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col items-center gap-6"
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.9)',
          }}
        >
          {/* Top Brand Return */}
          <Link
            href="/"
            onClick={() => triggerHaptic('tap')}
            className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1.5 font-mono uppercase tracking-wider active:scale-95 duration-75"
          >
            <span>←</span> Return to Palmzip
          </Link>

          {/* Tactical Vault Icon */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl opacity-40 blur-md animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-black border border-cyan-500/40 flex items-center justify-center text-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
              🔒
            </div>
          </div>

          {/* Heading (Zero PIN numbers revealed!) */}
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-black text-white tracking-tight font-mono uppercase">
              DROP VAULT
            </h1>
            <p className="text-xs text-white/50 tracking-tight">
              Enter 6-digit passcode to unlock clipboard
            </p>
          </div>

          {/* 6 Digit Dot Indicators */}
          <div className="flex items-center gap-3.5 my-1">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = inputPasscode.length > idx;
              return (
                <motion.div
                  key={idx}
                  animate={{
                    scale: isFilled ? [1, 1.25, 1] : 1,
                  }}
                  transition={{ duration: 0.15 }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                    isFilled
                      ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.9)]'
                      : 'bg-white/[0.04] border-white/20'
                  }`}
                />
              );
            })}
          </div>

          {/* Hidden Form for Direct Keyboard Entry */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputPasscode.length === 6) {
                handlePasscodeSubmit(inputPasscode);
              }
            }}
            className="w-full"
          >
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              placeholder="••••••"
              value={inputPasscode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setInputPasscode(val);
                setPassError('');
                triggerHaptic('tap');
                if (val.length === 6) {
                  handlePasscodeSubmit(val);
                }
              }}
              className="w-full bg-black/60 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-center text-lg font-mono tracking-[0.5em] text-cyan-300 placeholder:text-white/20 outline-none transition-all shadow-inner"
            />
          </form>

          {/* Error Banner */}
          {passError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 font-mono flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-xl"
            >
              <span>⚠️</span>
              <span>{passError}</span>
            </motion.div>
          )}

          {/* Touch-Sensitive Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="h-12 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 active:border-cyan-400 active:scale-[0.92] text-white active:text-cyan-300 font-mono font-semibold text-lg transition-all duration-75 flex items-center justify-center cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] select-none"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Subtext - Absolutely NO pin revealed */}
          <div className="text-[11px] text-white/30 font-mono tracking-wider uppercase">
            Encrypted 6-digit clearance
          </div>
        </motion.div>
      </main>
    );
  }

  /* ======================================================================== */
  /*               2. BLACK GRIDDY TOUCH-SENSITIVE VAULT UI                   */
  /* ======================================================================== */
  const clipboardDrops = [...drops].reverse();

  return (
    <main className="relative min-h-screen bg-[#000000] text-white flex flex-col selection:bg-cyan-500 selection:text-black font-sans touch-manipulation">
      {/* Precision Tactical Grid Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: '#000000',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: 'center center',
        }}
      />

      {/* Subtle Cyan Center Illumination */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl z-0" />

      {/* Drag & Drop Fullscreen Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000000]/95 backdrop-blur-2xl flex flex-col items-center justify-center border-4 border-dashed border-cyan-400 p-6 pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-28 h-28 rounded-3xl bg-cyan-950/40 border border-cyan-400 flex items-center justify-center text-5xl mb-4 shadow-[0_0_60px_rgba(6,182,212,0.6)]"
            >
              📥
            </motion.div>
            <h2 className="text-3xl font-black text-white font-mono uppercase tracking-tight mb-2">
              Drop into the Can
            </h2>
            <p className="text-sm text-cyan-300/80 font-mono text-center max-w-sm">
              Release to instantly sync across all your authorized devices.
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
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
              <a
                href={lightboxImage}
                download
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('tap');
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-mono border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>⬇ Download</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  setLightboxImage(null);
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center text-sm font-bold border border-white/20 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Preview"
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
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-[#050508] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xl flex items-center justify-center mx-auto">
                🗑️
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white font-mono uppercase">
                  Empty Drop Can?
                </h3>
                <p className="text-xs text-white/50">
                  This will wipe all 10 stored drops across all your devices.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    setConfirmClearOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-white text-xs font-mono border border-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-mono font-semibold shadow-lg shadow-red-900/40 transition-all cursor-pointer"
                >
                  Confirm Empty
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* 2A. TACTICAL HUD TOP NAVIGATION                                      */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#000000]/85 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
        {/* Left: Branding */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
          <Link
            href="/"
            onClick={() => triggerHaptic('tap')}
            className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-white/[0.05] active:scale-95 duration-75 font-mono"
            title="Return to Palmzip"
          >
            <span>←</span>
            <span className="hidden sm:inline">Palmzip</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-black border border-cyan-500/40 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center text-sm">
                📥
              </div>
              {isConnected && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 border-2 border-black" />
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white font-mono uppercase">
                  Drop Can
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  GRID SYNC
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono tracking-wider">
                UNIVERSAL CLIPBOARD
              </span>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs active:scale-90 transition-all ${
                soundEnabled
                  ? 'border-white/15 text-white bg-white/[0.05]'
                  : 'border-white/5 text-white/30'
              }`}
              title={soundEnabled ? 'Sound On' : 'Muted'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button
              type="button"
              onClick={handleLockVault}
              className="p-2 rounded-xl border border-white/15 text-white/60 hover:text-white text-xs bg-white/[0.05] active:scale-90 transition-all"
              title="Lock vault"
            >
              🔒
            </button>
          </div>
        </div>

        {/* Center: Tactile Mode Switcher Pill */}
        <div className="flex items-center p-1 rounded-2xl bg-[#08080c] border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setViewMode('can');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-75 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              viewMode === 'can'
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>📥</span>
            <span>Drop Can</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setViewMode('chat');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-75 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              viewMode === 'chat'
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>💬</span>
            <span>Chat Mode</span>
          </button>
        </div>

        {/* Right: Storage Gauge + Device + Actions */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 overflow-x-auto pb-1 sm:pb-0">
          {/* Storage Capacity Gauge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-mono text-white/70"
            title="Rolling memory: holds past 10 drops"
          >
            <span className="text-cyan-400">💾</span>
            <span className="text-white font-bold">{drops.length}/10</span>
          </div>

          {/* Device Rename Pill */}
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
                placeholder="Device label"
                className="bg-black border border-cyan-400 rounded-xl px-2 py-0.5 text-xs text-white outline-none w-24 font-mono"
              />
              <button
                type="submit"
                className="text-[10px] font-mono text-cyan-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
              >
                Set
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                setTempDeviceInput(deviceName);
                setEditingDevice(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-[11px] font-mono text-white/80 transition-all cursor-pointer"
              title="Click to rename device label"
            >
              <span className="text-cyan-400">⚡</span>
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{deviceName}</span>
            </button>
          )}

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs active:scale-90 transition-all cursor-pointer ${
                soundEnabled
                  ? 'border-white/15 text-white bg-white/[0.04] hover:bg-white/[0.08]'
                  : 'border-white/5 text-white/30 hover:text-white/50'
              }`}
              title={soundEnabled ? 'Mute' : 'Enable sound'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>

            {drops.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  setConfirmClearOpen(true);
                }}
                className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/20 text-xs active:scale-90 transition-all cursor-pointer"
                title="Clear all"
              >
                🗑️
              </button>
            )}

            <button
              type="button"
              onClick={handleLockVault}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 text-xs font-mono transition-all cursor-pointer"
              title="Lock Vault"
            >
              <span>🔒 Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hidden file pickers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setPendingFile(e.target.files[0]);
            triggerHaptic('success');
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
            triggerHaptic('success');
          }
        }}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* 2B. MODE 1: DROP CAN & TACTICAL CLIPBOARD (PRIMARY VIEW)             */}
      {/* ==================================================================== */}
      {viewMode === 'can' && (
        <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
          {/* THE TACTICAL DROP CAN (TOUCH-SENSITIVE HUD) */}
          <div
            onClick={() => {
              triggerHaptic('tap');
              fileInputRef.current?.click();
            }}
            className="relative group cursor-pointer rounded-3xl p-6 sm:p-10 border border-white/15 hover:border-cyan-400/80 bg-[#040407]/90 backdrop-blur-xl transition-all duration-150 shadow-[0_15px_50px_rgba(0,0,0,0.9)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] active:scale-[0.99] flex flex-col items-center justify-center text-center gap-4 overflow-hidden"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.9)',
            }}
          >
            {/* Tech Corner Crosshairs HUD */}
            <span className="absolute top-3 left-3 font-mono text-[9px] text-white/20 select-none">
              ┌ CAN_ID: 01
            </span>
            <span className="absolute top-3 right-3 font-mono text-[9px] text-cyan-400/40 select-none">
              SECURE_SYNC ┐
            </span>
            <span className="absolute bottom-3 left-3 font-mono text-[9px] text-white/20 select-none">
              └ ROLLING_10
            </span>
            <span className="absolute bottom-3 right-3 font-mono text-[9px] text-white/20 select-none">
              TOUCH_ACTIVE ┘
            </span>

            {/* Tactical Icon */}
            <div className="relative my-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black border border-cyan-500/40 flex items-center justify-center text-4xl sm:text-5xl shadow-[0_0_30px_rgba(6,182,212,0.2)] group-hover:scale-105 group-hover:border-cyan-400 transition-all">
                📥
              </div>
            </div>

            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
                Drop Files Into The Can
              </h2>
              <p className="text-xs sm:text-sm text-white/50">
                Click to browse, drag & drop files, or paste anywhere with{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-cyan-300">
                  Ctrl+V
                </kbd>
              </p>
            </div>

            {/* Tactile Action Buttons */}
            <div
              className="flex items-center gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 active:scale-95 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span>📁</span>
                <span>Browse File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  cameraInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/15 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>📷</span>
                <span>Camera / Scan</span>
              </button>

              <button
                type="button"
                onClick={handleReadClipboard}
                className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/15 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer hidden sm:flex"
                title="Paste from clipboard"
              >
                <span>📋</span>
                <span>Paste Clipboard</span>
              </button>
            </div>
          </div>

          {/* QUICK TEXT / LINK DROP COMPOSER */}
          <div className="bg-[#050508]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
            {/* Attachment preview if pending */}
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
                    onClick={() => {
                      triggerHaptic('tap');
                      setPendingFile(null);
                    }}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={handleDropSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Drop a note, URL, code, or message to the can..."
                  className="w-full bg-black border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors shadow-inner font-mono text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    fileInputRef.current?.click();
                  }}
                  className="h-11 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 border border-white/15 text-white/80 hover:text-white text-base transition-all flex items-center justify-center cursor-pointer"
                  title="Attach file"
                >
                  📎
                </button>

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !pendingFile) || isUploading}
                  className="h-11 flex-1 sm:flex-none px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  CLIPBOARD VAULT
                </h3>
                <span className="text-[11px] font-mono text-white/40">
                  [{drops.length}/10 ITEMS]
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/40 hidden sm:inline uppercase">
                Tap Copy or Download on any device
              </span>
            </div>

            {/* Empty State */}
            {drops.length === 0 && (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3 border border-dashed border-white/10 rounded-3xl bg-[#040407]/50">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl text-white/40">
                  🪣
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-mono font-bold text-white/70 uppercase">
                    Drop Can is Empty
                  </h4>
                  <p className="text-xs text-white/40 max-w-xs">
                    Drop a file, photo, or paste text above to start your shared clipboard!
                  </p>
                </div>
              </div>
            )}

            {/* Drops Cards Grid */}
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
                    transition={{ duration: 0.15 }}
                    className="group bg-[#040407] hover:bg-[#08080c] border border-white/10 hover:border-cyan-400/40 rounded-2xl p-4 transition-all shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Image Thumbnail */}
                      {isImage && drop.attachment && (
                        <div
                          onClick={() => {
                            triggerHaptic('tap');
                            setLightboxImage(drop.attachment!.url);
                          }}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 shrink-0 bg-black cursor-zoom-in group/thumb relative active:scale-95 transition-transform"
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

                      {/* Text Icon */}
                      {!drop.attachment && !isLink && (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 flex items-center justify-center text-lg shrink-0">
                          📝
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-white/60 border border-white/5">
                            {drop.device || 'Device'}
                          </span>
                          <span className="text-[10px] font-mono text-white/35">
                            {drop.createdAt}
                          </span>
                          {drop.attachment && (
                            <span className="text-[10px] font-mono text-cyan-300">
                              {formatFileSize(drop.attachment.size)}
                            </span>
                          )}
                        </div>

                        {drop.attachment ? (
                          <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-full font-mono">
                            {drop.attachment.originalName}
                          </span>
                        ) : isLink ? (
                          <a
                            href={drop.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-semibold text-cyan-300 hover:underline truncate max-w-full font-mono"
                          >
                            {drop.content}
                          </a>
                        ) : (
                          <p className="text-xs sm:text-sm text-white/90 whitespace-pre-wrap break-words line-clamp-3 font-mono">
                            {renderTextWithLinks(drop.content)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyToClipboard(
                            drop.attachment ? drop.attachment.url : drop.content,
                            drop.id
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 active:scale-90 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                            : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white'
                        }`}
                        title="Copy to clipboard"
                      >
                        <span>{isCopied ? '✅' : '📋'}</span>
                        <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                      </button>

                      {drop.attachment && (
                        <a
                          href={drop.attachment.url}
                          download={drop.attachment.originalName}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic('tap')}
                          className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 active:scale-90 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>⬇</span>
                          <span>DOWNLOAD</span>
                        </a>
                      )}

                      {isLink && (
                        <a
                          href={drop.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic('tap')}
                          className="px-3 py-1.5 rounded-xl bg-teal-950/70 hover:bg-teal-900 active:scale-90 border border-teal-500/30 text-teal-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>↗</span>
                          <span>OPEN</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDrop(drop.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-950/20 active:scale-90 transition-all cursor-pointer"
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
      {/* 2C. MODE 2: CHAT MODE (SECONDARY VIEW)                               */}
      {/* ==================================================================== */}
      {viewMode === 'chat' && (
        <div className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            <div className="mx-auto text-center px-4 py-2 rounded-2xl bg-[#040407] border border-white/10 max-w-md">
              <p className="text-[11px] font-mono text-white/40 uppercase tracking-wider leading-relaxed">
                💬 CHAT STREAM // ITEMS AUTOMATICALLY MIRROR TO DROP CAN
              </p>
            </div>

            {drops.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl text-white/40">
                  💬
                </div>
                <h4 className="text-xs font-mono font-bold text-white/70 uppercase">
                  No messages recorded
                </h4>
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col group ${isMyDevice ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${
                      isMyDevice ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <span className="font-mono text-cyan-400 flex items-center gap-1 text-[11px]">
                      <span>{msg.device || 'Device'}</span>
                      {isMyDevice && <span className="text-[10px] text-white/40">(Self)</span>}
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
                        ? 'bg-gradient-to-br from-cyan-950/80 via-[#0a1622] to-[#044b36]/90 border border-cyan-500/30 text-white rounded-tr-sm'
                        : 'bg-[#08080c] border border-white/10 text-white/95 rounded-tl-sm'
                    }`}
                  >
                    {msg.isSending && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/50">
                        <span className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    )}

                    {msg.attachment && msg.attachment.mimeType.startsWith('image/') && (
                      <div className="mb-3 overflow-hidden rounded-2xl border border-white/15 bg-black group/img relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.originalName}
                          className="max-h-72 w-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                          onClick={() => {
                            triggerHaptic('tap');
                            setLightboxImage(msg.attachment!.url);
                          }}
                        />
                      </div>
                    )}

                    {msg.attachment && !msg.attachment.mimeType.startsWith('image/') && (
                      <div className="mb-3 p-3 rounded-2xl bg-black border border-white/15 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                            📄
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-xs text-white truncate max-w-[200px]">
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
                          onClick={() => triggerHaptic('tap')}
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white text-xs font-mono transition-all cursor-pointer"
                        >
                          ⬇
                        </a>
                      </div>
                    )}

                    {msg.content && (
                      <div className="whitespace-pre-wrap break-words font-mono text-xs sm:text-sm">
                        {renderTextWithLinks(msg.content)}
                      </div>
                    )}

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
                          className="text-[10px] font-mono text-white/40 hover:text-white active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
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

          {/* Composer Footer */}
          <footer className="sticky bottom-0 z-40 bg-[#000000]/95 backdrop-blur-2xl border-t border-white/10 p-3 sm:p-4 w-full">
            <AnimatePresence>
              {pendingFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2.5 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3"
                >
                  <span className="text-xs font-mono text-white truncate max-w-[240px]">
                    📎 {pendingFile.name} ({formatFileSize(pendingFile.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      setPendingFile(null);
                    }}
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
                onClick={() => {
                  triggerHaptic('tap');
                  fileInputRef.current?.click();
                }}
                className="h-11 w-11 shrink-0 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 border border-white/10 flex items-center justify-center text-white/80 hover:text-white text-lg transition-all cursor-pointer"
                title="Attach file"
              >
                📎
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  placeholder="Drop a note or message... (Enter to send)"
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleDropSubmit();
                    }
                  }}
                  className="w-full bg-black border border-white/15 focus:border-cyan-400 rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-white placeholder:text-white/30 outline-none resize-none min-h-[44px] max-h-32 transition-colors shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={(!inputText.trim() && !pendingFile) || isUploading}
                className="h-11 px-5 shrink-0 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Drop</span>
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
