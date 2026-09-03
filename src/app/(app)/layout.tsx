import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import { AppShell } from '@/components/app-shell';
import { PageProgress } from '@/components/page-progress';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

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