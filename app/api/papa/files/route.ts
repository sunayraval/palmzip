import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyPassword, getAttachmentFilePath } from '@/lib/papa-storage';

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
      { success: false, error: 'Unauthorized. Passcode 2008 required.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const download = searchParams.get('download') === 'true';
  const originalName = searchParams.get('name') || file || 'download';

  if (!file) {
    return NextResponse.json(
      { success: false, error: 'Missing file parameter' },
      { status: 400 }
    );
  }

  // Prevent path traversal
  const safeFilename = path.basename(file);
  const filePath = getAttachmentFilePath(safeFilename);

  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json(
      { success: false, error: 'File not found or expired from storage' },
      { status: 404 }
    );
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain; charset=utf-8',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const disposition = download ? 'attachment' : 'inline';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(originalName)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Error reading attachment file:', err);
    return NextResponse.json(
      { success: false, error: 'Error streaming file' },
      { status: 500 }
    );
  }
}
