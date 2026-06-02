import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';

export default async function AdminDashboard() {
  await requireAdmin();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link 
          href="/admin/journey"
          className="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)] transition-colors"
        >
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Journey Lessons</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Create and manage daily Islamic lessons
          </p>
        </Link>

        <Link
          href="/admin/journey/localization-qa"
          className="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)] transition-colors"
        >
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Localization QA</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Review multilingual emotional readiness and drift risks
          </p>
        </Link>

        <div className="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl opacity-50 cursor-not-allowed">
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Quran Content</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Coming soon
          </p>
        </div>

        <div className="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl opacity-50 cursor-not-allowed">
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Users & Analytics</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
