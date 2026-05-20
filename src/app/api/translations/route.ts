import { NextResponse } from 'next/server';
import { getTranslations } from '@/lib/qf-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const translations = await getTranslations();
    return NextResponse.json({ translations }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Translations API error:', message);
    return NextResponse.json({ error: message, translations: [] }, { status: 500 });
  }
}