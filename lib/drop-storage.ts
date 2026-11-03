import fs from 'fs';
import path from 'path';
import os from 'os';

export interface DropAttachment {
  id: string;
  originalName: string;
  storageFilename: string;
  mimeType: string;
  size: number;
  url: string;
}

export type DropType = 'file' | 'image' | 'text' | 'link' | 'chat';

export interface DropItem {
  id: string;
  type: DropType;
  title?: string;
  content: string;
  createdAt: string;
  timestamp: number;
  device?: string;
  attachment?: DropAttachment;
}

export interface DropState {
  drops: DropItem[];
  lastUpdated: string;
}

export const DROP_PASSWORD = '197577';
export const MAX_DROPS = 10;
export const CLOUD_TOPIC = 'palmzip_drop_vault_197577_prod';

// Local storage fallback paths in os.tmpdir so file changes never trigger Next.js Turbopack watcher loops
const FALLBACK_PATH = path.join(os.tmpdir(), 'palmzip-drop-vault.json');
const FALLBACK_UPLOADS_DIR = path.join(os.tmpdir(), 'palmzip-drop-uploads');

let cachedState: DropState | null = null;
let lastCloudSyncTime = 0;

// SSE Listeners
type DropListener = (data: { type: string; drops: DropItem[] }) => void;
const listeners = new Set<DropListener>();

export function subscribeDrops(listener: DropListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyUpdate(drops: DropItem[]): void {
  for (const listener of listeners) {
    try {
      listener({ type: 'update', drops });
    } catch {
      // ignore
    }
  }
}

export function verifyPassword(pwd?: string | null): boolean {
  if (!pwd) return false;
  return pwd.trim() === DROP_PASSWORD;
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
  const fallbackFile = path.join(os.tmpdir(), 'palmzip-drop-uploads', cleanName);
  if (fs.existsSync(fallbackFile)) {
    return fallbackFile;
  }
  return null;
}

function inferDropType(content: string, attachment?: DropAttachment): DropType {
  if (attachment) {
    if (attachment.mimeType.startsWith('image/')) return 'image';
    return 'file';
  }
  const trimmed = content.trim();
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return 'link';
  }
  return 'text';
}

// Fetch canonical drop history from the cloud topic
export async function syncFromCloud(): Promise<DropItem[]> {
  try {
    const res = await fetch(`https://ntfy.sh/${CLOUD_TOPIC}/json?poll=1&since=all`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const drops: DropItem[] = [];
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

        let item: DropItem | null = null;
        try {
          item = JSON.parse(evt.message);
        } catch {
          const content = evt.message || '';
          item = {
            id: evt.id,
            type: inferDropType(content),
            content,
            createdAt: new Date(evt.time * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: evt.time * 1000,
            device: evt.title || 'Device',
          };
        }

        if (item && evt.attachment) {
          item.attachment = {
            id: evt.id,
            originalName: evt.attachment.name || 'file',
            storageFilename: evt.id,
            mimeType: evt.attachment.type || 'application/octet-stream',
            size: evt.attachment.size || 0,
            url: evt.attachment.url,
          };
          item.type = item.attachment.mimeType.startsWith('image/') ? 'image' : 'file';
        }

        if (item && item.id) {
          drops.push(item);
        }
      } catch {
        // ignore parse error on bad line
      }
    }

    // Filter out cleared or deleted drops
    const active = drops.filter((d) => {
      if (clearAllTimestamp && d.timestamp <= clearAllTimestamp) return false;
      if (deletedIds.has(d.id)) return false;
      return true;
    });

    // Deduplicate by ID
    const uniqueMap = new Map<string, DropItem>();
    for (const d of active) {
      uniqueMap.set(d.id, d);
    }

    const sorted = Array.from(uniqueMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_DROPS);

    return sorted;
  } catch (err) {
    console.warn('Could not sync with drop cloud topic:', err);
    return [];
  }
}

// Load state from memory, cloud sync, or fallback
export async function loadDropStateAsync(): Promise<DropState> {
  const now = Date.now();

  // If cached and synced recently (within 2 seconds), return immediately
  if (cachedState && now - lastCloudSyncTime < 2000) {
    return cachedState;
  }

  // Sync from cloud
  const cloudDrops = await syncFromCloud();

  if (cloudDrops.length > 0) {
    cachedState = {
      drops: cloudDrops,
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

export function loadDropState(): DropState {
  if (cachedState) {
    return cachedState;
  }
  cachedState = loadFromFallback();
  return cachedState;
}

function loadFromFallback(): DropState {
  try {
    if (fs.existsSync(FALLBACK_PATH)) {
      const raw = fs.readFileSync(FALLBACK_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.drops)) {
        return {
          drops: parsed.drops.slice(-MAX_DROPS),
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    drops: [
      {
        id: 'welcome-drop-1',
        type: 'text',
        title: 'Welcome to Drop Can',
        content: 'Drop Can is ready! Drag files onto this screen or paste (Ctrl+V) text, links, or screenshots here. Any authorized device can instantly grab it.',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        device: 'System',
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function saveToFallback(state: DropState): void {
  try {
    fs.writeFileSync(FALLBACK_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // ignore write errors in restricted environments
  }
}

// Add a new drop item and broadcast it to both cloud & local
export async function addDropItemAsync(
  content: string,
  options?: {
    type?: DropType;
    title?: string;
    device?: string;
    attachment?: DropAttachment;
  }
): Promise<{ drop: DropItem; drops: DropItem[] }> {
  const now = new Date();
  const state = await loadDropStateAsync();

  const dropType = options?.type || inferDropType(content, options?.attachment);

  const newDrop: DropItem = {
    id: `drop-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    type: dropType,
    title: options?.title?.trim() || undefined,
    content: content.trim(),
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime(),
    device: options?.device?.trim() || 'Device',
    attachment: options?.attachment,
  };

  state.drops.push(newDrop);

  // Maintain rolling 10
  if (state.drops.length > MAX_DROPS) {
    state.drops = state.drops.slice(-MAX_DROPS);
  }

  state.lastUpdated = now.toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.drops);

  // Broadcast to cloud topic in background so all instances & devices see it instantly
  try {
    fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: newDrop.device || 'Device',
        'X-Tags': `drop_item,${newDrop.type}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDrop),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return { drop: newDrop, drops: state.drops };
}

export async function deleteDropItemAsync(dropId: string): Promise<DropItem[]> {
  const state = await loadDropStateAsync();
  state.drops = state.drops.filter((d) => d.id !== dropId);
  state.lastUpdated = new Date().toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.drops);

  // Broadcast delete signal to cloud topic
  try {
    fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: 'System',
        'X-Tags': 'action_delete',
      },
      body: dropId,
    }).catch(() => {});
  } catch {
    // ignore
  }

  return state.drops;
}

export async function clearAllDropsAsync(): Promise<DropItem[]> {
  const state = await loadDropStateAsync();
  state.drops = [];
  state.lastUpdated = new Date().toISOString();
  cachedState = state;
  saveToFallback(state);
  notifyUpdate(state.drops);

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

  return state.drops;
}
