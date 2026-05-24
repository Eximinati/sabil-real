import { getServerDictionary } from '@/lib/i18n/server';

export default async function BookmarksLoading() {
  const { dictionary: copy } = await getServerDictionary();

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <p className="mb-4 text-sm text-[var(--color-text-muted)] text-center">{copy.journey.loading.bookmarks}</p>
      <div className="text-center mb-10">
        <div className="h-9 w-24 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>
      <div className="max-w-[720px] mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 animate-pulse">
            <div className="h-5 w-32 bg-[var(--color-border)] rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4">
                  <div className="flex justify-end mb-2">
                    <div className="w-6 h-6 bg-[var(--color-border)] rounded-full" />
                  </div>
                  <div className="h-5 w-full bg-[var(--color-border)] rounded mb-2" />
                  <div className="h-4 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                  <div className="border-t border-[var(--color-border)] pt-3">
                    <div className="h-3 w-24 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-4 w-full bg-[var(--color-border)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
