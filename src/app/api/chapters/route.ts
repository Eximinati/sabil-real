import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/qf-api';

export async function GET() {
  try {
    const chapters = await getChapters();
    return NextResponse.json(chapters);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}