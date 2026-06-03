import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { AppShell } from '@/components/app-shell';
import { PageProgress } from '@/components/page-progress';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <PageProgress />
      <AppShell userEmail={user.email || ''}>{children}</AppShell>
    </>
  );
}