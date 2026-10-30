import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/papa-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (verifyPassword(password)) {
      return NextResponse.json({
        success: true,
        authorized: true,
        message: 'Access granted',
      });
    }

    return NextResponse.json(
      {
        success: false,
        authorized: false,
        error: 'Incorrect passcode. Please try again.',
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
