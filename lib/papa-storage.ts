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

const DATA_DIR = path.join(process.cwd(), 'data');
const PRIMARY_PATH = path.join(DATA_DIR, 'papa-messages.json');
const FALLBACK_PATH = path.join(os.tmpdir(), 'palmzip-papa-messages.json');

const PRIMARY_UPLOADS_DIR = path.join(DATA_DIR, 'papa-uploads');
const FALLBACK_UPLOADS_DIR = path.join(os.tmpdir(), 'palmzip-papa-uploads');

let cachedState: PapaState | null = null;

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
  if (ensureDirectoryExists(PRIMARY_UPLOADS_DIR)) {
    return PRIMARY_UPLOADS_DIR;
  }
  ensureDirectoryExists(FALLBACK_UPLOADS_DIR);
  return FALLBACK_UPLOADS_DIR;
}

function getMessagesFilePath(): string {
  if (ensureDirectoryExists(DATA_DIR)) {
    return PRIMARY_PATH;
  }
  return FALLBACK_PATH;
}

function removeFileIfExists(storageFilename: string): void {
  const cleanName = path.basename(storageFilename);
  const primaryFile = path.join(process.cwd(), 'data', 'papa-uploads', cleanName);
  const fallbackFile = path.join(os.tmpdir(), 'palmzip-papa-uploads', cleanName);

  try {
    if (fs.existsSync(primaryFile)) {
      fs.unlinkSync(primaryFile);
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(fallbackFile)) {
      fs.unlinkSync(fallbackFile);
    }
  } catch {
    // ignore
  }
}

export function getAttachmentFilePath(storageFilename: string): string | null {
  const cleanName = path.basename(storageFilename);
  const primaryFile = path.join(process.cwd(), 'data', 'papa-uploads', cleanName);
  if (fs.existsSync(primaryFile)) {
    return primaryFile;
  }
  const fallbackFile = path.join(os.tmpdir(), 'palmzip-papa-uploads', cleanName);
  if (fs.existsSync(fallbackFile)) {
    return fallbackFile;
  }
  return null;
}

export function loadPapaState(): PapaState {
  if (cachedState) {
    return cachedState;
  }

  const defaultState: PapaState = {
    messages: [
      {
        id: 'welcome-1',
        sender: 'Sunay',
        text: 'Hey Dad! Welcome to our private portal. You can drop photos, documents, or notes here anytime!',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now() - 60000,
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  const filePath = getMessagesFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.messages)) {
        cachedState = {
          messages: parsed.messages,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        return cachedState;
      }
    }
  } catch (err) {
    console.warn('Failed to load papa-messages.json, using default state:', err);
  }

  cachedState = defaultState;
  savePapaState(cachedState);
  return cachedState;
}

export function savePapaState(state: PapaState): void {
  cachedState = state;
  const filePath = getMessagesFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    try {
      fs.writeFileSync(FALLBACK_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write to papa messages storage:', e);
    }
  }
}

export function addPapaMessage(
  sender: 'Sunay' | 'Papa' | string,
  text: string,
  attachment?: PapaAttachment
): { message: PapaMessage; messages: PapaMessage[] } {
  const state = loadPapaState();
  const now = new Date();

  const newMessage: PapaMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: sender === 'Papa' ? 'Papa' : 'Sunay',
    text: text.trim(),
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime(),
    attachment,
  };

  state.messages.push(newMessage);

  // Enforce MAX_MESSAGES (10). Delete physical attachment files for pruned messages!
  if (state.messages.length > MAX_MESSAGES) {
    const excessCount = state.messages.length - MAX_MESSAGES;
    const pruned = state.messages.slice(0, excessCount);
    for (const msg of pruned) {
      if (msg.attachment?.storageFilename) {
        removeFileIfExists(msg.attachment.storageFilename);
      }
    }
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }

  state.lastUpdated = now.toISOString();
  savePapaState(state);
  notifyUpdate(state.messages);

  return { message: newMessage, messages: state.messages };
}

export function deletePapaMessage(messageId: string): PapaMessage[] {
  const state = loadPapaState();
  const target = state.messages.find((m) => m.id === messageId);
  if (target?.attachment?.storageFilename) {
    removeFileIfExists(target.attachment.storageFilename);
  }
  state.messages = state.messages.filter((m) => m.id !== messageId);
  state.lastUpdated = new Date().toISOString();
  savePapaState(state);
  notifyUpdate(state.messages);
  return state.messages;
}

export function clearAllPapaMessages(): PapaMessage[] {
  const state = loadPapaState();
  for (const msg of state.messages) {
    if (msg.attachment?.storageFilename) {
      removeFileIfExists(msg.attachment.storageFilename);
    }
  }
  state.messages = [];
  state.lastUpdated = new Date().toISOString();
  savePapaState(state);
  notifyUpdate(state.messages);
  return state.messages;
}
