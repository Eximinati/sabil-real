import { NextResponse } from 'next/server';
import { getChapterRecitationAudio } from '@/lib/qf-api';

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ recitationId: string; chapterId: string }> }
) {
  try {
    const { recitationId, chapterId } = await params;
    const audioFiles = await getChapterRecitationAudio(
      parseInt(recitationId, 10),
      parseInt(chapterId, 10)
    );
    return NextResponse.json({ audio_files: audioFiles }, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}