import { redirect } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { supabaseServer } from '@/lib/supabase-server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/journey');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 relative">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher compact />
      </div>
      <div className="w-full max-w-[420px]">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
