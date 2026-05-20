'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=/admin');
        return;
      }

      const isAdmin = ADMIN_EMAILS.length > 0 
        ? ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')
        : user.email?.endsWith('@quran.foundation');

      if (!isAdmin) {
        router.push('/journey');
        return;
      }
    };

    checkAdmin();
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xl font-semibold text-[var(--color-text)]">
              Admin Dashboard
            </a>
            <nav className="flex items-center gap-4 ml-8">
              <a href="/admin/journey" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                Lessons
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <a href="/journey" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
              ← Back to App
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}