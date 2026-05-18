export default function HadithLoading() {
  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-8">
        <div className="h-9 w-24 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-48 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
        <div className="h-4 w-96 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <div className="h-10 w-48 bg-[var(--color-border)] animate-pulse rounded-lg" />
        <div className="h-10 w-24 bg-[var(--color-border)] animate-pulse rounded-lg" />
        <div className="h-10 w-32 bg-[var(--color-border)] animate-pulse rounded-lg" />
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
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