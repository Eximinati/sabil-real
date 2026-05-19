import { NextResponse } from 'next/server';
import { getTranslations } from '@/lib/qf-api';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  try {
    const translations = await getTranslations();
    return NextResponse.json(translations, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}