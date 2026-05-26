import { NextResponse } from 'next/server';
import { getTranslations } from '@/lib/qf-api';
import {
  FALLBACK_TRANSLATIONS,
  normalizeApiErrorMessage,
  shouldFallbackFromError,
} from '@/lib/qf-fallbacks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const translations = await getTranslations();

    if (!Array.isArray(translations) || translations.length === 0) {
      return NextResponse.json({
        translations: FALLBACK_TRANSLATIONS,
        fallbackUsed: true,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=900, s-maxage=900',
        },
      });
    }

    return NextResponse.json({ translations }, {
      headers: {
        'Cache-Control': 'public, max-age=900, s-maxage=900',
      },
    });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);
    console.error('Translations API error:', message);

    if (shouldFallbackFromError(error)) {
      return NextResponse.json({
        translations: FALLBACK_TRANSLATIONS,
        fallbackUsed: true,
        warning: message,
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    return NextResponse.json({ error: message, translations: [] }, { status: 500 });
  }
}
