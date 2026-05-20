import { NextResponse } from 'next/server';
import { getTafsirs } from '@/lib/qf-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const tafsirs = await getTafsirs();
    return NextResponse.json({ tafsirs }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tafsirs API error:', message);
    return NextResponse.json({ error: message, tafsirs: [] }, { status: 500 });
  }
}