import { NextResponse } from 'next/server';

interface CachedStatus {
  timestamp: number;
  data: {
    success: boolean;
    source: 'live' | 'fallback';
    statusDate: string | null;
    statusDateIso: string | null;
    statusTitle: string;
    statusDescription: string;
    statusCode: 'normal' | 'two_hour_delay' | 'early_dismissal' | 'closed';
    fetchedAt: string;
  };
}

let cachedHcpssStatus: CachedStatus | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDateToIso(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr} 12:00:00`);
  if (isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET() {
  const now = Date.now();
  if (cachedHcpssStatus && now - cachedHcpssStatus.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedHcpssStatus.data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://status.hcpss.org/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PalmzipScheduleBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    // Extract <section id="status-block" ...>...</section>
    const sectionMatch = html.match(/<section[^>]*id=["']status-block["'][^>]*>([\s\S]*?)<\/section>/i);
    const sectionHtml = sectionMatch ? sectionMatch[1] : html;

    // Extract status-date span
    const dateMatch = sectionHtml.match(/<span[^>]*class=["'][^"']*status-date[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const statusDate = dateMatch ? stripHtml(dateMatch[1]) : null;
    const statusDateIso = parseDateToIso(statusDate);

    // Extract h2 content for the status title
    let statusTitle = 'Normal Operations';
    const h2Match = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (h2Match) {
      const h2Inner = h2Match[1].replace(
        /<span[^>]*class=["'][^"']*status-date[^"']*["'][^>]*>[\s\S]*?<\/span>/i,
        ''
      );
      const cleanedTitle = stripHtml(h2Inner);
      if (cleanedTitle) {
        statusTitle = cleanedTitle;
      }
    }

    // Extract first paragraph description inside status-block
    let statusDescription = 'Staff and students report in accordance with the HCPSS calendar.';
    const pMatch = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) {
      const cleanedP = stripHtml(pMatch[1]);
      if (cleanedP) {
        statusDescription = cleanedP;
      }
    }

    // Determine statusCode from title & description
    const combinedText = `${statusTitle} ${statusDescription}`.toLowerCase();
    let statusCode: 'normal' | 'two_hour_delay' | 'early_dismissal' | 'closed' = 'normal';

    if (
      /schools\s+(?:and\s+offices\s+)?closed|schools\s+are\s+closed/i.test(statusTitle) ||
      /all\s+howard\s+county\s+public\s+schools\s+(?:and\s+offices\s+)?are\s+closed/i.test(combinedText)
    ) {
      statusCode = 'closed';
    } else if (
      /two\s+hours\s+late|2-hour\s+delay|two-hour\s+delay/i.test(statusTitle) ||
      /open\s+two\s+hours\s+late/i.test(combinedText)
    ) {
      statusCode = 'two_hour_delay';
    } else if (
      /early\s+dismissal|close\s+early/i.test(statusTitle) ||
      /close\s+(?:3|three)\s+hours\s+early|3-hour\s+early\s+dismissal/i.test(combinedText)
    ) {
      statusCode = 'early_dismissal';
    }

    const payload: CachedStatus['data'] = {
      success: true,
      source: 'live',
      statusDate,
      statusDateIso,
      statusTitle,
      statusDescription,
      statusCode,
      fetchedAt: new Date().toISOString(),
    };

    cachedHcpssStatus = {
      timestamp: now,
      data: payload,
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      statusDate: null,
      statusDateIso: null,
      statusTitle: 'Normal Operations (Calendar Schedule)',
      statusDescription: 'Using official 2026–2027 HCPSS academic calendar schedule.',
      statusCode: 'normal',
      fetchedAt: new Date().toISOString(),
    });
  }
}
