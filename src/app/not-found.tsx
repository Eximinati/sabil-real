import { cookies } from 'next/headers';
import { getSystemCopy } from '@/lib/i18n/system-copy';
import { LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config';

export default async function NotFound() {
  const cookieStore = await cookies();
  const copy = getSystemCopy(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value).notFound;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="max-w-md w-full text-center p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-medium text-[var(--color-text)] mb-2">
          {copy.title}
        </h1>
        
        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          {copy.description}
        </p>
        
        <a
          href="/journey"
          className="inline-block px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity font-medium text-sm"
        >
          {copy.goToJourney}
        </a>
        
        <p className="text-xs text-[var(--color-text-subtle)] mt-6" dir="rtl">
          {copy.verse}
        </p>
      </div>
    </div>
  );
}
