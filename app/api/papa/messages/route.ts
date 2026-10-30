import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  verifyPassword,
  loadPapaState,
  addPapaMessage,
  deletePapaMessage,
  clearAllPapaMessages,
  getUploadsDir,
  PapaAttachment,
  MAX_MESSAGES,
} from '@/lib/papa-storage';

export const dynamic = 'force-dynamic';

function getAuthToken(request: Request): string | null {
  const headerToken = request.headers.get('x-papa-auth');
  if (headerToken) return headerToken;

  const { searchParams } = new URL(request.url);
  return searchParams.get('auth') || searchParams.get('password');
}

export async function GET(request: Request) {
  const token = getAuthToken(request);
  if (!verifyPassword(token)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Enter passcode 2008.' },
      { status: 401 }
    );
  }

  const state = loadPapaState();
  return NextResponse.json({
    success: true,
    messages: state.messages,
    maxMessages: MAX_MESSAGES,
    totalMessages: state.messages.length,
    lastUpdated: state.lastUpdated,
  });
}

export async function POST(request: Request) {
  const token = getAuthToken(request);
  if (!verifyPassword(token)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Enter passcode 2008.' },
      { status: 401 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let sender = 'Sunay';
    let text = '';
    let attachment: PapaAttachment | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      sender = (formData.get('sender') as string) || 'Sunay';
      text = (formData.get('text') as string) || '';
      const file = formData.get('file') as File | null;

      if (file && file.size > 0) {
        const uploadsDir = getUploadsDir();
        const originalName = file.name || 'attachment';
        const fileExt = path.extname(originalName) || '';
        const baseName = path.basename(originalName, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const storageFilename = `${uniqueId}_${baseName}${fileExt}`;
        const filePath = path.join(uploadsDir, storageFilename);

        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

        attachment = {
          id: uniqueId,
          originalName,
          storageFilename,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          url: `/api/papa/files?file=${encodeURIComponent(storageFilename)}&name=${encodeURIComponent(originalName)}&auth=2008`,
        };
      }
    } else {
      const json = await request.json().catch(() => ({}));
      sender = json.sender || 'Sunay';
      text = json.text || '';
    }

    if (!text.trim() && !attachment) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be completely empty' },
        { status: 400 }
      );
    }

    const { message, messages } = addPapaMessage(sender, text, attachment);

    return NextResponse.json({
      success: true,
      message,
      messages,
      totalMessages: messages.length,
      maxMessages: MAX_MESSAGES,
    });
  } catch (err: any) {
    console.error('Error posting papa message:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to post message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const token = getAuthToken(request);
  if (!verifyPassword(token)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Enter passcode 2008.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const clearAll = searchParams.get('all') === 'true';
  const messageId = searchParams.get('id');

  if (clearAll) {
    const messages = clearAllPapaMessages();
    return NextResponse.json({
      success: true,
      message: 'All messages cleared',
      messages,
    });
  }

  if (!messageId) {
    return NextResponse.json(
      { success: false, error: 'Message ID required for deletion' },
      { status: 400 }
    );
  }

  const messages = deletePapaMessage(messageId);
  return NextResponse.json({
    success: true,
    message: 'Message deleted',
    messages,
  });
}
