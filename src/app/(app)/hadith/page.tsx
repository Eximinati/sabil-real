import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import { HadithBrowser } from '@/components/hadith-browser';
import { getCachedHadithCollections } from '@/lib/api-utils';

interface PageProps {
  searchParams: Promise<{ collection?: string; number?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function HadithPage({ searchParams }: PageProps) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  const { collection, number } = await searchParams;
  const initialCollections = await getCachedHadithCollections().catch(() => undefined);

  return (
    <HadithBrowser
      initialCollection={collection}
      initialNumber={number}
      initialCollections={initialCollections}
    />
  );
}