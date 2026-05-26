import { NextResponse } from 'next/server';
import { getTafsirs } from '@/lib/qf-api';
import {
  FALLBACK_TAFSIRS,
  normalizeApiErrorMessage,
  shouldFallbackFromError,
} from '@/lib/qf-fallbacks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const tafsirs = await getTafsirs();

    if (!Array.isArray(tafsirs) || tafsirs.length === 0) {
      return NextResponse.json({
        tafsirs: FALLBACK_TAFSIRS,
        fallbackUsed: true,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=900, s-maxage=900',
        },
      });
    }

    return NextResponse.json({ tafsirs }, {
      headers: {
        'Cache-Control': 'public, max-age=900, s-maxage=900',
      },
    });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);
    console.error('Tafsirs API error:', message);

    if (shouldFallbackFromError(error)) {
      return NextResponse.json({
        tafsirs: FALLBACK_TAFSIRS,
        fallbackUsed: true,
        warning: message,
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    return NextResponse.json({ error: message, tafsirs: [] }, { status: 500 });
  }
}
