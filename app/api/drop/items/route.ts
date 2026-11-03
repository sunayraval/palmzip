import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  verifyPassword,
  loadDropStateAsync,
  addDropItemAsync,
  deleteDropItemAsync,
  clearAllDropsAsync,
  getUploadsDir,
  DropAttachment,
  DropType,
  MAX_DROPS,
} from '@/lib/drop-storage';

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
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Enter passcode 2008.' },
      { status: 401 }
    );
  }

  const state = await loadDropStateAsync();
  return NextResponse.json({
    success: true,
    drops: state.drops,
    maxDrops: MAX_DROPS,
    totalDrops: state.drops.length,
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
    let content = '';
    let title: string | undefined = undefined;
    let device = 'Device';
    let type: DropType | undefined = undefined;
    let attachment: DropAttachment | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = (formData.get('content') as string) || (formData.get('text') as string) || '';
      title = (formData.get('title') as string) || undefined;
      device = (formData.get('device') as string) || 'Device';
      const customType = formData.get('type') as string | null;
      if (customType) type = customType as DropType;

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
        const buffer = Buffer.from(arrayBuffer);

        // Save local copy
        try {
          fs.writeFileSync(filePath, buffer);
        } catch {
          // ignore write errors in restricted environments
        }

        let publicFileUrl = `/api/drop/files?file=${encodeURIComponent(storageFilename)}&name=${encodeURIComponent(originalName)}&auth=2008`;

        // Upload to cloud host for seamless cross-device mobile/desktop access
        try {
          const catboxForm = new FormData();
          catboxForm.append('reqtype', 'fileupload');
          catboxForm.append(
            'fileToUpload',
            new Blob([buffer], { type: file.type || 'application/octet-stream' }),
            originalName
          );

          const catboxRes = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: catboxForm,
          });

          if (catboxRes.ok) {
            const uploadedUrl = (await catboxRes.text()).trim();
            if (uploadedUrl.startsWith('http')) {
              publicFileUrl = uploadedUrl;
            }
          }
        } catch (err) {
          console.warn('Fallback to local file route for drop:', err);
        }

        attachment = {
          id: uniqueId,
          originalName,
          storageFilename,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          url: publicFileUrl,
        };

        if (!content.trim()) {
          content = originalName;
        }
      }
    } else {
      const json = await request.json().catch(() => ({}));
      content = json.content || json.text || '';
      title = json.title;
      device = json.device || 'Device';
      type = json.type;
    }

    if (!content.trim() && !attachment) {
      return NextResponse.json(
        { success: false, error: 'Cannot drop empty item' },
        { status: 400 }
      );
    }

    const { drop, drops } = await addDropItemAsync(content, {
      type,
      title,
      device,
      attachment,
    });

    return NextResponse.json({
      success: true,
      drop,
      drops,
      totalDrops: drops.length,
      maxDrops: MAX_DROPS,
    });
  } catch (err: any) {
    console.error('Error posting drop item:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to post drop' },
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
  const dropId = searchParams.get('id');

  if (clearAll) {
    const drops = await clearAllDropsAsync();
    return NextResponse.json({
      success: true,
      message: 'Drop can cleared',
      drops,
    });
  }

  if (!dropId) {
    return NextResponse.json(
      { success: false, error: 'Drop ID required for deletion' },
      { status: 400 }
    );
  }

  const drops = await deleteDropItemAsync(dropId);
  return NextResponse.json({
    success: true,
    message: 'Drop item deleted',
    drops,
  });
}
