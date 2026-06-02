import { requireAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

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
              <a href="/admin/journey/localization-qa" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                Localization QA
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
