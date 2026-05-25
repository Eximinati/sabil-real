import { getServerDictionary } from '@/lib/i18n/server';

export default async function TafsirLoading() {
  const { dictionary: copy } = await getServerDictionary();

  return (
    <div className="reading-screen px-4 md:px-16 pt-8 md:pt-12 pb-20 md:pb-12">
      <p className="mb-4 text-sm text-[var(--color-text-muted)] text-center">{copy.journey.loading.tafsir}</p>
      <div className="text-center mb-8">
        <div className="h-9 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 mb-8 max-w-4xl mx-auto">
        <div>
          <div className="h-5 w-24 bg-[var(--color-border)] animate-pulse rounded mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[var(--color-border)] animate-pulse rounded-lg mb-2" />
          ))}
        </div>
        <div>
          <div className="h-5 w-24 bg-[var(--color-border)] animate-pulse rounded mb-3" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--color-border)] animate-pulse rounded-lg mb-2" />
          ))}
        </div>
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-[var(--color-border)] rounded-full" />
              <div className="h-4 w-20 bg-[var(--color-border)] rounded" />
            </div>
            <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[var(--color-border)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
