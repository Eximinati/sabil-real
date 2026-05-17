import { NextResponse } from 'next/server';
import { getTafsirs } from '@/lib/qf-api';

export async function GET() {
  try {
    const tafsirs = await getTafsirs();
    console.log('Tafsirs API response:', JSON.stringify(tafsirs).slice(0, 300));
    return NextResponse.json(tafsirs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}