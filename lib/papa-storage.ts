import fs from 'fs';
import path from 'path';
import os from 'os';

export interface PapaAttachment {
  id: string;
  originalName: string;
  storageFilename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface PapaMessage {
  id: string;
  sender: 'Sunay' | 'Papa' | string;
  text: string;
  createdAt: string;
  timestamp: number;
  attachment?: PapaAttachment;
}

export interface PapaState {
  messages: PapaMessage[];
  lastUpdated: string;
}

export const PAPA_PASSWORD = '2008';
export const MAX_MESSAGES = 10;
export const CLOUD_TOPIC = 'palmzip_papa_sunay_vault_2008_prod';

// Local storage fallback paths (in os.tmpdir so file changes never trigger Next.js Turbopack watcher loops)
const FALLBACK_PATH = path.join(os.tmpdir(), 'palmzip-papa-messages.json');
const FALLBACK_UPLOADS_DIR = path.join(os.tmpdir(), 'palmzip-papa-uploads');

let cachedState: PapaState | null = null;
let lastCloudSyncTime = 0;

// SSE Listeners
type MessageListener = (data: { type: string; messages: PapaMessage[] }) => void;
const listeners = new Set<MessageListener>();

export function subscribeMessages(listener: MessageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyUpdate(messages: PapaMessage[]): void {
  for (const listener of listeners) {
    try {
      listener({ type: 'update', messages });
    } catch {
      // ignore
    }
  }
}

export function verifyPassword(pwd?: string | null): boolean {
  if (!pwd) return false;
  return pwd.trim() === PAPA_PASSWORD;
}

function ensureDirectoryExists(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

export function getUploadsDir(): string {
  ensureDirectoryExists(FALLBACK_UPLOADS_DIR);
  return FALLBACK_UPLOADS_DIR;
}

export function getAttachmentFilePath(storageFilename: string): string | null {
  const cleanName = path.basename(storageFilename);
  const fallbackFile = path.join(os.tmpdir(), 'palmzip-papa-uploads', cleanName);
  if (fs.existsSync(fallbackFile)) {
    return fallbackFile;
  }
  return null;
}

// Fetch canonical message history from the cloud topic
export async function syncFromCloud(): Promise<PapaMessage[]> {
  try {
    const res = await fetch(`https://ntfy.sh/${CLOUD_TOPIC}/json?poll=1&since=all`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const messages: PapaMessage[] = [];
    const deletedIds = new Set<string>();
    let clearAllTimestamp = 0;

    for (const line of lines) {
      try {
        const evt = JSON.parse(line);
        if (evt.event !== 'message') continue;

        // Check for clear all signal
        if (evt.tags && evt.tags.includes('action_clear')) {
          clearAllTimestamp = evt.time * 1000;
          continue;
        }

        // Check for single delete signal
        if (evt.tags && evt.tags.includes('action_delete') && evt.message) {
          deletedIds.add(evt.message.trim());
          continue;
        }

        let msg: PapaMessage | null = null;
        try {
          msg = JSON.parse(evt.message);
        } catch {
          msg = {
            id: evt.id,
            sender: evt.title === 'Papa' ? 'Papa' : 'Sunay',
            text: evt.message || '',
            createdAt: new Date(evt.time * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: evt.time * 1000,
          };
        }

        if (msg && evt.attachment) {
          msg.attachment = {
            id: evt.id,
            originalName: evt.attachment.name || 'file',
            storageFilename: evt.id,
            mimeType: evt.attachment.type || 'application/octet-stream',
            size: evt.attachment.size || 0,
            url: evt.attachment.url,
          };
        }

        if (msg && msg.id) {
          messages.push(msg);
        }
      } catch {
        // ignore parse error on bad line
      }
    }

    // Filter out cleared or deleted messages
    const active = messages.filter((m) => {
      if (clearAllTimestamp && m.timestamp <= clearAllTimestamp) return false;
      if (deletedIds.has(m.id)) return false;
      return true;
    });

    // Deduplicate by ID
    const uniqueMap = new Map<string, PapaMessage>();
    for (const m of active) {
      uniqueMap.set(m.id, m);
    }

    const sorted = Array.from(uniqueMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_MESSAGES);

    return sorted;
  } catch (err) {
    console.warn('Could not sync with cloud topic:', err);
    return [];
  }
}

// Load state from memory, cloud sync, or fallback
export async function loadPapaStateAsync(): Promise<PapaState> {
  const now = Date.now();

  // If cached and synced recently (within 2 seconds), return immediately
  if (cachedState && now - lastCloudSyncTime < 2000) {
    return cachedState;
  }

  // Sync from cloud
  const cloudMessages = await syncFromCloud();

  if (cloudMessages.length > 0) {
    cachedState = {
      messages: cloudMessages,
      lastUpdated: new Date().toISOString(),
    };
    lastCloudSyncTime = now;
    saveToFallback(cachedState);
    return cachedState;
  }

  // Fallback to local file if cloud returned empty
  if (!cachedState) {
    cachedState = loadFromFallback();
  }

  return cachedState;
}

export function loadPapaState(): PapaState {
  if (cachedState) {
    return cachedState;
  }
  cachedState = loadFromFallback();
  return cachedState;
}

function loadFromFallback(): PapaState {
  try {
    if (fs.existsSync(FALLBACK_PATH)) {
      const raw = fs.readFileSync(FALLBACK_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.messages)) {
        return {
          messages: parsed.messages.slice(-MAX_MESSAGES),
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    messages: [
      {
        id: 'welcome-1',
        sender: 'Sunay',
        text: 'Hey Dad! Welcome to our private portal. You can drop photos, documents, or notes here anytime! 🚀',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function saveToFallback(state: PapaState): void {
  try {
    fs.writeFileSync(FALLBACK_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // ignore write errors in restricted environments
  }
}

// Add a new message and broadcast it to both cloud & local
export async function addPapaMessageAsync(
  sender: 'Sunay' | 'Papa' | string,
  text: string,
  attachment?: PapaAttachment
): Promise<{ message: PapaMessage; messages: PapaMessage[] }> {
  const now = new Date();
  const state = await loadPapaStateAsync();

  const newMessage: PapaMessage = {
    id: `msg-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: sender === 'Papa' ? 'Papa' : 'Sunay',
    text: text.trim(),
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime(),
    attachment,
  };

  state.messages.push(newMessage);

  // Maintain rolling 10
  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }

  state.lastUpdated = now.toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.messages);

  // Broadcast to cloud topic in background so all instances & devices see it instantly
  try {
    fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: newMessage.sender,
        'X-Tags': 'chat_message',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMessage),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return { message: newMessage, messages: state.messages };
}

export function addPapaMessage(
  sender: 'Sunay' | 'Papa' | string,
  text: string,
  attachment?: PapaAttachment
): { message: PapaMessage; messages: PapaMessage[] } {
  const now = new Date();
  const state = loadPapaState();

  const newMessage: PapaMessage = {
    id: `msg-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: sender === 'Papa' ? 'Papa' : 'Sunay',
    text: text.trim(),
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime(),
    attachment,
  };

  state.messages.push(newMessage);

  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }

  state.lastUpdated = now.toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.messages);

  try {
    fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: newMessage.sender,
        'X-Tags': 'chat_message',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMessage),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return { message: newMessage, messages: state.messages };
}

export async function deletePapaMessageAsync(messageId: string): Promise<PapaMessage[]> {
  const state = await loadPapaStateAsync();
  state.messages = state.messages.filter((m) => m.id !== messageId);
  state.lastUpdated = new Date().toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.messages);

  // Broadcast delete signal to cloud topic
  try {
    fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: 'System',
        'X-Tags': 'action_delete',
      },
      body: messageId,
    }).catch(() => {});
  } catch {
    // ignore
  }

  return state.messages;
}

export async function clearAllPapaMessagesAsync(): Promise<PapaMessage[]> {
  const state = await loadPapaStateAsync();
  state.messages = [];
  state.lastUpdated = new Date().toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.messages);

  // Broadcast clear signal to cloud topic
  try {
    fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: 'System',
        'X-Tags': 'action_clear',
      },
      body: 'clear_all',
    }).catch(() => {});
  } catch {
    // ignore
  }

  return state.messages;
}
