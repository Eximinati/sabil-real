import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/qf-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const chapters = await getChapters();
    return NextResponse.json({ chapters }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chapters API error:', message);
    return NextResponse.json(
      { error: message, chapters: [] },
      { status: 500 }
    );
  }
}