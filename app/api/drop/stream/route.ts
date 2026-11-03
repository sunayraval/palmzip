import { NextResponse } from 'next/server';
import { verifyPassword, loadDropStateAsync, subscribeDrops } from '@/lib/drop-storage';

export const dynamic = 'force-dynamic';

function getAuthToken(request: Request): string | null {
  const headerToken = request.headers.get('x-drop-auth');
  if (headerToken) return headerToken;

  const { searchParams } = new URL(request.url);
  return searchParams.get('auth') || searchParams.get('password');
}

export async function GET(request: Request) {
  const token = getAuthToken(request);
  if (!verifyPassword(token)) {
    return new NextResponse('Unauthorized. Enter passcode 2008.', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      try {
        const state = await loadDropStateAsync();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'init', drops: state.drops })}\n\n`)
        );
      } catch {
        // ignore initial error
      }

      // Heartbeat ping
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      // Subscribe to local updates
      const unsubscribe = subscribeDrops((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
