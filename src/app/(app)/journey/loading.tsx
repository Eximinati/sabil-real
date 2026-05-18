export default function JourneyLoading() {
  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-10">
        <div className="h-9 w-24 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
        <div className="h-4 w-64 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="max-w-[480px] mx-auto mb-12">
        <div className="h-4 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto mb-2" />
        <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden" />
        <div className="h-4 w-40 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="max-w-[680px] mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-5 animate-pulse"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-9 md:w-[36px] h-9 md:h-[36px] bg-[var(--color-border)] rounded-full" />
                <div>
                  <div className="h-5 w-32 bg-[var(--color-border)] rounded mb-2" />
                  <div className="h-4 w-24 bg-[var(--color-border)] rounded" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-4 w-16 bg-[var(--color-border)] rounded" />
                <div className="h-9 w-20 bg-[var(--color-border)] rounded-lg" />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <div className="h-6 w-20 bg-[var(--color-border)] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}