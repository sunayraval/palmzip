import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface RecentContribution {
  factor: string;
  amount: number;
  time: string;
  timestamp?: number;
}

interface ClientQuota {
  contributed: number;
  resetAt: number;
  hasContributedBefore?: boolean;
}

interface GlobalSenioritisState {
  globalBoost: number;
  totalContributors: number;
  totalBoosts: number;
  lastUpdated: string;
  recentContributions: RecentContribution[];
  quotas: Record<string, ClientQuota>;
}

const MAX_DAILY_QUOTA = 5.0; // Max 5.0% boost per individual senior per 24 hours
const MAX_SINGLE_BOOST = 1.0; // Max boost in a single transaction
const QUOTA_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Storage fallback paths
const PRIMARY_PATH = path.join(process.cwd(), 'data', 'senioritis-global.json');
const FALLBACK_PATH = path.join(os.tmpdir(), 'palmzip-senioritis-global.json');

// In-memory cache for fast read/write
let cachedState: GlobalSenioritisState | null = null;

function getStoragePath(): string {
  try {
    const dir = path.dirname(PRIMARY_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return PRIMARY_PATH;
  } catch {
    return FALLBACK_PATH;
  }
}

function loadState(): GlobalSenioritisState {
  if (cachedState) {
    return cachedState;
  }

  const defaultState: GlobalSenioritisState = {
    globalBoost: 33.5, // Seed with live active college apps season boost
    totalContributors: 52,
    totalBoosts: 248,
    lastUpdated: new Date().toISOString(),
    recentContributions: [
      { factor: 'College Apps Crunch', amount: 0.5, time: '2m ago', timestamp: Date.now() - 120000 },
      { factor: 'Nov 1 EA/ED Panic', amount: 0.5, time: '5m ago', timestamp: Date.now() - 300000 },
      { factor: 'Skipping 1st Period', amount: 0.5, time: '12m ago', timestamp: Date.now() - 720000 },
      { factor: 'Tap to Heat', amount: 0.5, time: '18m ago', timestamp: Date.now() - 1080000 },
    ],
    quotas: {},
  };

  const filePath = getStoragePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      cachedState = {
        globalBoost: typeof parsed.globalBoost === 'number' ? parsed.globalBoost : defaultState.globalBoost,
        totalContributors: typeof parsed.totalContributors === 'number' ? parsed.totalContributors : defaultState.totalContributors,
        totalBoosts: typeof parsed.totalBoosts === 'number' ? parsed.totalBoosts : defaultState.totalBoosts,
        lastUpdated: parsed.lastUpdated || defaultState.lastUpdated,
        recentContributions: Array.isArray(parsed.recentContributions) ? parsed.recentContributions : defaultState.recentContributions,
        quotas: parsed.quotas && typeof parsed.quotas === 'object' ? parsed.quotas : {},
      };
      return cachedState;
    }
  } catch (err) {
    console.warn('Failed to load senioritis-global.json, using default state:', err);
  }

  cachedState = defaultState;
  saveState(cachedState);
  return cachedState;
}

function saveState(state: GlobalSenioritisState): void {
  cachedState = state;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    // If primary write fails, try fallback tmp directory
    try {
      fs.writeFileSync(FALLBACK_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write to fallback storage:', e);
    }
  }
}

function getClientIdentifier(request: Request, clientToken?: string): string {
  if (clientToken && typeof clientToken === 'string' && clientToken.trim().length > 0) {
    return `token_${clientToken.trim()}`;
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'local-user';
  return `ip_${ip}`;
}

function cleanExpiredQuotas(state: GlobalSenioritisState): void {
  const now = Date.now();
  const quotaKeys = Object.keys(state.quotas);
  if (quotaKeys.length > 500) {
    for (const key of quotaKeys) {
      // Remove quotas older than 48 hours to conserve memory
      if (state.quotas[key].resetAt + QUOTA_DURATION_MS < now) {
        delete state.quotas[key];
      }
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientToken = searchParams.get('clientToken') || undefined;

  const state = loadState();
  const clientId = getClientIdentifier(request, clientToken);
  const now = Date.now();

  const userQuota = state.quotas[clientId];
  let contributed = 0;
  let resetAt = now + QUOTA_DURATION_MS;

  if (userQuota) {
    if (userQuota.resetAt <= now) {
      // Quota reset period passed
      userQuota.contributed = 0;
      userQuota.resetAt = now + QUOTA_DURATION_MS;
      saveState(state);
    }
    contributed = userQuota.contributed;
    resetAt = userQuota.resetAt;
  }

  const remainingQuota = Math.max(0, MAX_DAILY_QUOTA - contributed);
  const hoursUntilReset = Math.max(0, (resetAt - now) / (1000 * 60 * 60));

  return NextResponse.json({
    success: true,
    globalBoost: state.globalBoost,
    totalContributors: state.totalContributors,
    totalBoosts: state.totalBoosts,
    lastUpdated: state.lastUpdated,
    maxDailyQuota: MAX_DAILY_QUOTA,
    userContributed: parseFloat(contributed.toFixed(2)),
    userRemainingQuota: parseFloat(remainingQuota.toFixed(2)),
    hoursUntilReset: parseFloat(hoursUntilReset.toFixed(1)),
    recentContributions: state.recentContributions.slice(0, 6),
  });
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      try {
        const rawText = await request.text();
        if (rawText) body = JSON.parse(rawText);
      } catch {
        body = {};
      }
    }
    const { clientToken, factor, amount: reqAmount } = body || {};

    const state = loadState();
    const clientId = getClientIdentifier(request, clientToken);
    const now = Date.now();

    cleanExpiredQuotas(state);

    if (!state.quotas[clientId]) {
      state.quotas[clientId] = {
        contributed: 0,
        resetAt: now + QUOTA_DURATION_MS,
        hasContributedBefore: false,
      };
    }

    const quota = state.quotas[clientId];

    // Reset quota if window has expired
    if (quota.resetAt <= now) {
      quota.contributed = 0;
      quota.resetAt = now + QUOTA_DURATION_MS;
    }

    const remainingQuota = Math.max(0, MAX_DAILY_QUOTA - quota.contributed);

    if (remainingQuota <= 0) {
      const hoursUntilReset = Math.max(0, (quota.resetAt - now) / (1000 * 60 * 60));
      return NextResponse.json(
        {
          success: false,
          error: 'Daily quota reached',
          message: `You have reached your collective contribution quota of ${MAX_DAILY_QUOTA}% for today. Resets in ${hoursUntilReset.toFixed(1)}h.`,
          globalBoost: state.globalBoost,
          userContributed: parseFloat(quota.contributed.toFixed(2)),
          userRemainingQuota: 0,
          hoursUntilReset: parseFloat(hoursUntilReset.toFixed(1)),
        },
        { status: 429 }
      );
    }

    // Determine safe boost amount
    const rawBoost = typeof reqAmount === 'number' && reqAmount > 0 ? reqAmount : 0.5;
    const boundedBoost = Math.min(rawBoost, MAX_SINGLE_BOOST);
    const actualBoost = Math.min(boundedBoost, remainingQuota);

    // Apply boost to user quota and global total
    quota.contributed = parseFloat((quota.contributed + actualBoost).toFixed(2));
    
    // Check if first-time contributor
    if (!quota.hasContributedBefore) {
      quota.hasContributedBefore = true;
      state.totalContributors += 1;
    }

    // Global boost capped at +80% (so effective heat doesn't exceed 100%)
    state.globalBoost = parseFloat(Math.min(80.5, state.globalBoost + actualBoost).toFixed(2));
    state.totalBoosts += 1;
    state.lastUpdated = new Date().toISOString();

    // Log recent contribution
    const factorLabel = factor && typeof factor === 'string' ? factor.trim() : 'Class Heat Contribution';
    state.recentContributions.unshift({
      factor: factorLabel,
      amount: actualBoost,
      time: 'Just now',
      timestamp: now,
    });

    if (state.recentContributions.length > 10) {
      state.recentContributions = state.recentContributions.slice(0, 10);
    }

    saveState(state);

    const hoursUntilReset = Math.max(0, (quota.resetAt - now) / (1000 * 60 * 60));

    return NextResponse.json({
      success: true,
      boostAdded: actualBoost,
      globalBoost: state.globalBoost,
      totalContributors: state.totalContributors,
      totalBoosts: state.totalBoosts,
      maxDailyQuota: MAX_DAILY_QUOTA,
      userContributed: quota.contributed,
      userRemainingQuota: parseFloat((MAX_DAILY_QUOTA - quota.contributed).toFixed(2)),
      hoursUntilReset: parseFloat(hoursUntilReset.toFixed(1)),
      recentContributions: state.recentContributions.slice(0, 6),
    });
  } catch (err: any) {
    console.error('Error handling senioritis POST:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: err?.message || 'Failed to update boost' },
      { status: 500 }
    );
  }
}
