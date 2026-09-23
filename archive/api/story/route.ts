import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'story.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'story.json not found' }, { status: 404 });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error reading story content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'story.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'Story content saved successfully' });
  } catch (error: any) {
    console.error('Error saving story content:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save story content', error: error.message },
      { status: 500 }
    );
  }
}
