import { supabaseServer } from './supabase-server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emails = getAdminEmails();
  if (emails.length === 0) return false;
  return emails.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  if (!isAdminEmail(user.email)) {
    redirect('/journey');
  }

  return { userId: user.id, email: user.email };
}

export async function requireAdminApi(): Promise<
  { userId: string; email: string } | NextResponse
> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  return { userId: user.id, email: user.email };
}
