import { NextResponse } from 'next/server';
import { getTafsirForSurah } from '@/lib/qf-api';
import {
  normalizeApiErrorMessage,
  shouldFallbackFromError,
} from '@/lib/qf-fallbacks';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tafsirId: string; chapterId: string }> }
) {
  try {
    const { tafsirId, chapterId } = await params;
    const parsedTafsirId = parseInt(tafsirId, 10);
    const parsedChapterId = parseInt(chapterId, 10);

    if (!Number.isFinite(parsedTafsirId) || !Number.isFinite(parsedChapterId)) {
      return NextResponse.json({ error: 'Invalid tafsirId or chapterId', tafsirs: [] }, { status: 400 });
    }

    const tafsirData = await getTafsirForSurah(parsedTafsirId, parsedChapterId);

    if (!Array.isArray(tafsirData?.tafsirs)) {
      return NextResponse.json(
        {
          tafsirs: [],
          pagination: null,
          fallbackUsed: true,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=180, s-maxage=180',
          },
        }
      );
    }

    return NextResponse.json(tafsirData, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);

    if (shouldFallbackFromError(error)) {
      return NextResponse.json(
        {
          tafsirs: [],
          pagination: null,
          fallbackUsed: true,
          warning: message,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=180, s-maxage=180',
          },
        }
      );
    }

    return NextResponse.json({ error: message, tafsirs: [] }, { status: 500 });
  }
}
