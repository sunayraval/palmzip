import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'content.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'content.json not found' }, { status: 404 });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // In local development, we can write directly to the filesystem
    // We target the data/content.json file at the root of the project
    const filePath = path.join(process.cwd(), 'data', 'content.json');
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Content saved successfully' });
  } catch (error: any) {
    console.error('Error saving content:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save content', error: error.message },
      { status: 500 }
    );
  }
}
