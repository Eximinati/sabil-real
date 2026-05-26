import { NextResponse } from 'next/server';
import { FALLBACK_HADITH_COLLECTIONS } from '@/lib/qf-fallbacks';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json({
    collections: FALLBACK_HADITH_COLLECTIONS,
    fallbackUsed: true,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
