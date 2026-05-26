import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/qf-api';
import {
  FALLBACK_CHAPTERS,
  normalizeApiErrorMessage,
  shouldFallbackFromError,
} from '@/lib/qf-fallbacks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const chapters = await getChapters();

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        { chapters: FALLBACK_CHAPTERS, fallbackUsed: true },
        {
          headers: {
            'Cache-Control': 'public, max-age=1800, s-maxage=1800',
          },
        }
      );
    }

    return NextResponse.json({ chapters }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);
    console.error('Chapters API error:', message);

    if (shouldFallbackFromError(error)) {
      return NextResponse.json(
        {
          chapters: FALLBACK_CHAPTERS,
          fallbackUsed: true,
          warning: message,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        }
      );
    }

    return NextResponse.json(
      { error: message, chapters: [] },
      { status: 500 }
    );
  }
}
