import { NextResponse } from 'next/server';
import { getTranslations } from '@/lib/qf-api';

export async function GET() {
  try {
    const translations = await getTranslations();
    return NextResponse.json(translations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}