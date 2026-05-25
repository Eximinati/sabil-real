import { getServerDictionary } from '@/lib/i18n/server';

export default async function HadithLoading() {
  const { dictionary: copy } = await getServerDictionary();

  return (
    <div className="reading-screen px-4 md:px-16 pt-8 md:pt-12 pb-20 md:pb-12">
      <p className="mb-4 text-sm text-[var(--color-text-muted)] text-center">{copy.journey.loading.hadith}</p>
      <div className="text-center mb-10">
        <div className="h-9 w-24 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-48 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
        <div className="h-4 w-96 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="flex justify-center gap-4 mb-8 max-w-[680px] mx-auto">
        <div className="h-10 w-48 bg-[var(--color-border)] animate-pulse rounded-lg" />
        <div className="h-10 w-24 bg-[var(--color-border)] animate-pulse rounded-lg" />
        <div className="h-10 w-32 bg-[var(--color-border)] animate-pulse rounded-lg" />
      </div>

      <div className="max-w-[680px] mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-32 bg-[var(--color-border)] rounded" />
              <div className="w-6 h-6 bg-[var(--color-border)] rounded-full" />
            </div>
            <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[var(--color-border)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
