import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf';

export async function POST(request: Request) {
  if (!validateCsrf(request).valid) {
    return csrfErrorResponse();
  }

  try {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/login', url.origin));
  } catch (error) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/login', url.origin));
  }
}