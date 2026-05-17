import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { HadithBrowser } from '@/components/hadith-browser';

interface PageProps {
  searchParams: Promise<{ collection?: string; number?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function HadithPage({ searchParams }: PageProps) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { collection, number } = await searchParams;

  return <HadithBrowser initialCollection={collection} initialNumber={number} />;
}