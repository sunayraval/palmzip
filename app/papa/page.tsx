'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface PapaAttachment {
  id: string;
  originalName: string;
  storageFilename: string;
  mimeType: string;
  size: number;
  url: string;
}

interface PapaMessage {
  id: string;
  sender: 'Sunay' | 'Papa' | string;
  text: string;
  createdAt: string;
  timestamp: number;
  attachment?: PapaAttachment;
  isSending?: boolean;
}

const PASSCODE = '2008';
const AUTH_STORAGE_KEY = 'palmzip_papa_auth_v1';
const SENDER_STORAGE_KEY = 'palmzip_papa_sender_v1';
const SOUND_STORAGE_KEY = 'palmzip_papa_sound_v1';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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

export default function PapaChatPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPasscode, setInputPasscode] = useState<string>('');
  const [passError, setPassError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showPass, setShowPass] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<PapaMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [currentSender, setCurrentSender] = useState<'Sunay' | 'Papa'>('Sunay');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  const dragCounterRef = useRef<number>(0);

  // Check saved credentials & preferences on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth === PASSCODE) {
      setIsAuthenticated(true);
    }

    const savedSender = localStorage.getItem(SENDER_STORAGE_KEY);
    if (savedSender === 'Papa' || savedSender === 'Sunay') {
      setCurrentSender(savedSender);
    }

    const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
  }, []);

  // Sync scroll to bottom when messages update
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Fetch messages from backend
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/papa/messages?auth=${PASSCODE}`, {
        cache: 'no-store',
        headers: { 'x-papa-auth': PASSCODE },
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          // Check if new incoming message from the OTHER person
          if (
            lastMessageCountRef.current > 0 &&
            data.messages.length > lastMessageCountRef.current
          ) {
            const newestMsg = data.messages[data.messages.length - 1];
            if (newestMsg && newestMsg.sender !== currentSender && soundEnabled) {
              playNotificationChime();
            }
          }
          lastMessageCountRef.current = data.messages.length;
          setMessages(data.messages);
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch messages:', err);
      setIsConnected(false);
    }
  }, [currentSender, soundEnabled]);

  // Set up Live SSE Stream + fallback polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchMessages();

    // 1. Establish SSE Live Connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/papa/stream?auth=${PASSCODE}`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.messages && Array.isArray(payload.messages)) {
            if (
              lastMessageCountRef.current > 0 &&
              payload.messages.length > lastMessageCountRef.current
            ) {
              const latest = payload.messages[payload.messages.length - 1];
              if (latest && latest.sender !== currentSender && soundEnabled) {
                playNotificationChime();
              }
            }
            lastMessageCountRef.current = payload.messages.length;
            setMessages(payload.messages);
            setIsConnected(true);
          }
        } catch {
          // ignore heartbeat ping
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Will rely on fallback polling below
      };
    } catch (e) {
      console.warn('SSE not supported or failed to initialize:', e);
    }

    // 2. High-reliability Polling Fallback (every 2 seconds)
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, fetchMessages, currentSender, soundEnabled]);

  // Auto-scroll on initial load or message addition
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Handle file preview URL creation/cleanup
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

  // Handle Drag and Drop anywhere on the window
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

  // Handle Clipboard Paste for instant image & file sharing
  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setPendingFile(file);
            break;
          }
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
      const res = await fetch('/api/papa/auth', {
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

  // Lock Portal
  const handleLockPortal = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setInputPasscode('');
    setPassError('');
  };

  // Toggle Sender Identity
  const handleToggleSender = (sender: 'Sunay' | 'Papa') => {
    setCurrentSender(sender);
    localStorage.setItem(SENDER_STORAGE_KEY, sender);
  };

  // Toggle Notification Sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_STORAGE_KEY, String(next));
  };

  // Send Message & File
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !pendingFile) || isUploading) return;

    const textToSend = inputText.trim();
    const fileToSend = pendingFile;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: PapaMessage = {
      id: tempId,
      sender: currentSender,
      text: textToSend,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
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

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setPendingFile(null);
    setIsUploading(true);

    try {
      let res: Response;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('sender', currentSender);
        formData.append('text', textToSend);
        formData.append('file', fileToSend);

        res = await fetch('/api/papa/messages', {
          method: 'POST',
          headers: {
            'x-papa-auth': PASSCODE,
          },
          body: formData,
        });
      } else {
        res = await fetch('/api/papa/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-papa-auth': PASSCODE,
          },
          body: JSON.stringify({
            sender: currentSender,
            text: textToSend,
          }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          lastMessageCountRef.current = data.messages.length;
          setMessages(data.messages);
        }
      } else {
        // Rollback optimistic message if failed
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert('Could not deliver message. Please retry.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsUploading(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  // Delete Individual Message
  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/papa/messages?id=${id}&auth=${PASSCODE}`, {
        method: 'DELETE',
        headers: { 'x-papa-auth': PASSCODE },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Clear Entire Chat
  const handleClearAll = async () => {
    try {
      const res = await fetch(`/api/papa/messages?all=true&auth=${PASSCODE}`, {
        method: 'DELETE',
        headers: { 'x-papa-auth': PASSCODE },
      });
      if (res.ok) {
        setMessages([]);
        setConfirmClearOpen(false);
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // Quick Reply helper
  const handleQuickReply = (text: string) => {
    setInputText(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Copy message text to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  /* ======================================================================== */
  /*                         1. PASSWORD GATE SCREEN                          */
  /* ======================================================================== */
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-[#06080d] flex items-center justify-center p-4 selection:bg-[var(--color-brand-cyan)] selection:text-white overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(195,154,63,0.1)_0%,transparent_70%)] pointer-events-none blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md bg-[#0c1017]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center flex flex-col items-center gap-6"
        >
          {/* Top Brand Link */}
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5 font-mono uppercase tracking-wider mb-1"
          >
            <span>←</span> Back to Palmzip
          </Link>

          {/* Glowing Shield / Padlock Icon */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-gold)] rounded-2xl opacity-40 blur-lg animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-black/60 border border-white/20 flex items-center justify-center text-3xl shadow-xl">
              🔒
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Papa & Sunay Portal
            </h1>
            <p className="text-xs sm:text-sm text-white/60">
              Private live channel for instant notes, photos, and file drops.
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

            {/* Error Message with Shake Animation */}
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

            {/* Numeric Quick Pad (For fast mobile entry) */}
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
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <span>Unlock Chat Portal</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Discrete Passcode Hint */}
          <div className="text-[11px] text-white/35 font-mono">
            Family PIN required • Access restricted
          </div>
        </motion.div>
      </main>
    );
  }

  /* ======================================================================== */
  /*                            2. LIVE CHAT ROOM                             */
  /* ======================================================================== */
  return (
    <main className="relative min-h-screen bg-[#07090e] text-white flex flex-col selection:bg-[var(--color-brand-cyan)] selection:text-white">
      {/* Drag & Drop Visual Glow Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090e]/90 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-[var(--color-brand-cyan)] p-6 pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-24 h-24 rounded-3xl bg-[var(--color-brand-cyan)]/20 border border-[var(--color-brand-cyan)]/50 flex items-center justify-center text-4xl mb-4 shadow-[0_0_50px_rgba(6,182,212,0.4)]"
            >
              🚀
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Drop files right here</h2>
            <p className="text-sm text-white/70 text-center max-w-sm">
              Instantly share photos, documents, or notes with Papa!
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
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                <h3 className="text-lg font-bold text-white">Clear entire chat?</h3>
                <p className="text-xs text-white/60">
                  This will delete all current messages and stored attachments for both Sunay and Papa.
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
                  Yes, Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* 2A. TOP NAVIGATION / STATUS BAR                                      */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#07090e]/85 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Back Button */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
            title="Return to Home"
          >
            <span>←</span>
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--color-brand-cyan)] to-[var(--color-brand-gold)] p-[1.5px] shadow-md">
                <div className="w-full h-full bg-[#0c1017] rounded-[14px] flex items-center justify-center text-sm">
                  🤝
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
                  Papa & Sunay
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <span className="text-[11px] text-white/45">
                Private family drop • Live instant updates
              </span>
            </div>
          </div>

          {/* Mobile Right Controls: Lock & Sound */}
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
              onClick={handleLockPortal}
              className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs bg-white/5"
              title="Lock portal"
            >
              🔒
            </button>
          </div>
        </div>

        {/* Right: Storage Meter + Sender Toggle + Actions */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
          {/* Storage Quota Gauge (Max 10 messages) */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/70"
            title="Auto-prunes oldest messages when over 10 to keep storage clean and fast"
          >
            <span className="text-amber-400">💾</span>
            <span className="font-mono text-white font-medium">{messages.length}/10</span>
            <span className="hidden md:inline text-white/40">kept</span>
          </div>

          {/* Sender Switcher Pills */}
          <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-white/10 shadow-inner">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 px-2 hidden lg:inline">
              I am:
            </span>
            <button
              type="button"
              onClick={() => handleToggleSender('Sunay')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentSender === 'Sunay'
                  ? 'bg-gradient-to-r from-[var(--color-brand-cyan)] to-teal-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>👦</span>
              <span>Sunay</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleSender('Papa')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentSender === 'Papa'
                  ? 'bg-gradient-to-r from-[var(--color-brand-gold)] to-amber-600 text-white shadow-[0_0_15px_rgba(195,154,63,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>👨</span>
              <span>Papa</span>
            </button>
          </div>

          {/* Desktop Actions: Sound, Clear Chat, Lock */}
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

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/20 text-xs transition-colors cursor-pointer"
                title="Clear all messages"
              >
                🗑️
              </button>
            )}

            <button
              type="button"
              onClick={handleLockPortal}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock chat portal"
            >
              <span>🔒</span>
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2B. CHAT FEED CONTAINER                                              */}
      {/* ==================================================================== */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-6 max-w-4xl w-full mx-auto flex flex-col gap-4">
        {/* Storage Info Banner */}
        <div className="mx-auto text-center px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 max-w-md">
          <p className="text-[11px] text-white/40 leading-relaxed">
            💬 <strong>Rolling Memory:</strong> To keep things tidy and fast, the 10 most recent messages are kept. Older items rotate out automatically.
          </p>
        </div>

        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-3xl">
              ✉️
            </div>
            <h3 className="text-base font-bold text-white/80">The chat is clear</h3>
            <p className="text-xs text-white/50 max-w-xs">
              Say hello or drag and drop any photo or file to send it to {currentSender === 'Sunay' ? 'Papa' : 'Sunay'}!
            </p>
          </div>
        )}

        {/* Messages Stream */}
        {messages.map((msg) => {
          const isMe = msg.sender === currentSender;
          const isSunay = msg.sender === 'Sunay';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Name & Timestamp Header */}
              <div
                className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isSunay ? 'text-[var(--color-brand-cyan)]' : 'text-[var(--color-brand-gold)]'
                  }`}
                >
                  <span>{isSunay ? '👦 Sunay' : '👨 Papa'}</span>
                  {isMe && <span className="text-[10px] text-white/40 font-normal">(You)</span>}
                </span>
                <span className="text-white/35 font-mono text-[10px]">{msg.createdAt}</span>

                {/* Delete button (shows on hover) */}
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 p-0.5 rounded cursor-pointer"
                  title="Delete message"
                >
                  ✕
                </button>
              </div>

              {/* Message Bubble */}
              <div
                className={`relative max-w-[88%] sm:max-w-[75%] rounded-3xl p-4 shadow-xl text-sm leading-relaxed ${
                  isMe
                    ? isSunay
                      ? 'bg-gradient-to-br from-cyan-950/80 via-[#0c242c] to-[#044b36]/90 border border-cyan-500/30 text-white rounded-tr-sm shadow-[0_4px_25px_rgba(6,182,212,0.15)]'
                      : 'bg-gradient-to-br from-amber-950/80 via-[#271d0e] to-[#422e06]/90 border border-amber-500/30 text-white rounded-tr-sm shadow-[0_4px_25px_rgba(195,154,63,0.15)]'
                    : 'bg-[#10141d]/90 backdrop-blur-xl border border-white/10 text-white/95 rounded-tl-sm shadow-black/40'
                }`}
              >
                {/* Sending Spinner */}
                {msg.isSending && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/50">
                    <span className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Delivering...</span>
                  </div>
                )}

                {/* Attachment: Image Preview */}
                {msg.attachment && msg.attachment.mimeType.startsWith('image/') && (
                  <div className="mb-3 overflow-hidden rounded-2xl border border-white/15 bg-black/40 group/img relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.attachment.url}
                      alt={msg.attachment.originalName}
                      className="max-h-72 w-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                      onClick={() => setLightboxImage(msg.attachment!.url)}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <a
                        href={msg.attachment.url}
                        download={msg.attachment.originalName}
                        className="px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-[11px] font-medium text-white border border-white/20 backdrop-blur-md shadow-lg"
                      >
                        ⬇ Download
                      </a>
                    </div>
                  </div>
                )}

                {/* Attachment: Audio Player */}
                {msg.attachment && msg.attachment.mimeType.startsWith('audio/') && (
                  <div className="mb-3 p-2 rounded-2xl bg-black/40 border border-white/15 flex flex-col gap-1.5">
                    <span className="text-xs text-white/70 font-mono truncate">
                      🎵 {msg.attachment.originalName}
                    </span>
                    <audio
                      controls
                      src={msg.attachment.url}
                      className="w-full h-8"
                      preload="metadata"
                    />
                  </div>
                )}

                {/* Attachment: Generic Document / PDF / File */}
                {msg.attachment &&
                  !msg.attachment.mimeType.startsWith('image/') &&
                  !msg.attachment.mimeType.startsWith('audio/') && (
                    <div className="mb-3 p-3 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                          📄
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-xs text-white truncate max-w-[200px] sm:max-w-[280px]">
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
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>⬇</span>
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </div>
                  )}

                {/* Message Text Content */}
                {msg.text && (
                  <div className="whitespace-pre-wrap break-words font-normal">
                    {renderTextWithLinks(msg.text)}
                  </div>
                )}

                {/* Quick Copy Text Button */}
                {msg.text && (
                  <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.text)}
                      className="text-[10px] text-white/40 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy text"
                    >
                      <span>📋</span> Copy
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================================================================== */}
      {/* 2C. COMPOSER / INPUT BAR                                             */}
      {/* ==================================================================== */}
      <footer className="sticky bottom-0 z-40 bg-[#07090e]/95 backdrop-blur-2xl border-t border-white/10 p-3 sm:p-4 max-w-4xl w-full mx-auto">
        {/* Pending Attachment Preview Tray */}
        <AnimatePresence>
          {pendingFile && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="mb-2.5 p-2.5 rounded-2xl bg-white/[0.05] border border-white/15 flex items-center justify-between gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {filePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filePreviewUrl}
                    alt="Pending preview"
                    className="w-10 h-10 object-cover rounded-xl border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                    📎
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-[400px]">
                    {pendingFile.name}
                  </span>
                  <span className="text-[10px] text-white/50 font-mono">
                    {formatFileSize(pendingFile.size)} • Ready to send
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPendingFile(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Remove attachment"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Reply Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {[
            '👋 Hey Dad!',
            '📷 Check this photo',
            '📄 Important doc',
            '❤️ Love you!',
            '✅ All set!',
            '📞 Call when free',
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleQuickReply(chip)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white transition-all active:scale-95 text-[11px] cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input & Action Bar */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          {/* Hidden File Pickers */}
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

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 shrink-0 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/80 hover:text-white text-lg transition-colors cursor-pointer"
            title="Attach file, photo or document"
          >
            📎
          </button>

          {/* Quick Photo / Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="h-11 w-11 shrink-0 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/80 hover:text-white text-base transition-colors cursor-pointer hidden sm:flex"
            title="Capture photo"
          >
            📷
          </button>

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              placeholder={`Message as ${currentSender}... (Ctrl+V to paste photos, drag & drop files)`}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-black/60 border border-white/15 focus:border-[var(--color-brand-cyan)] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none resize-none min-h-[44px] max-h-32 transition-colors shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !pendingFile) || isUploading}
            className={`h-11 px-4 sm:px-5 shrink-0 rounded-2xl font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
              currentSender === 'Sunay'
                ? 'bg-gradient-to-r from-[var(--color-brand-cyan)] to-[var(--color-brand-emerald)] shadow-cyan-900/30 hover:opacity-95'
                : 'bg-gradient-to-r from-[var(--color-brand-gold)] to-amber-600 shadow-amber-900/30 hover:opacity-95'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
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
    </main>
  );
}
