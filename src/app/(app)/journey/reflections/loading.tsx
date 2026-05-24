export default function ReflectionsLoading() {
  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="max-w-2xl mx-auto">
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">Opening your reflection space...</p>
        <div className="mb-8">
          <div className="h-8 w-40 bg-[var(--color-border)] animate-pulse rounded mb-2" />
          <div className="h-5 w-64 bg-[var(--color-border)] animate-pulse rounded" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[var(--color-border)] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-[var(--color-border)] rounded mb-1" />
                  <div className="h-3 w-32 bg-[var(--color-border)] rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[var(--color-border)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
