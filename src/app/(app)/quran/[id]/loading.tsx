export default function VerseLoading() {
  return (
    <div className="px-6 md:px-[64px] pt-[32px] pb-[48px]">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-6 w-16 bg-[var(--color-border)] animate-pulse rounded" />
      </div>

      <div className="text-center mb-10">
        <div className="h-9 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-24 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 animate-pulse">
            <div className="flex items-start mb-4">
              <div className="w-7 h-7 bg-[var(--color-border)] rounded-full" />
            </div>
            <div className="h-6 w-full bg-[var(--color-border)] rounded mb-3" />
            <div className="h-6 w-3/4 bg-[var(--color-border)] rounded mb-4" />
            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="h-4 w-24 bg-[var(--color-border)] rounded mb-2" />
              <div className="h-4 w-full bg-[var(--color-border)] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}