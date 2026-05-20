export default function LessonLoading() {
  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12 max-w-[740px] mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-[var(--color-border)] animate-pulse rounded mb-2" />
        <div className="h-5 w-64 bg-[var(--color-border)] animate-pulse rounded mb-1" />
        <div className="h-4 w-32 bg-[var(--color-border)] animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 animate-pulse">
          <div className="h-5 w-24 bg-[var(--color-border)] rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-[var(--color-border)] rounded" />
            <div className="h-4 w-3/4 bg-[var(--color-border)] rounded" />
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 animate-pulse">
          <div className="flex justify-end mb-3">
            <div className="h-4 w-8 bg-[var(--color-border)] rounded-full" />
          </div>
          <div className="h-8 w-full bg-[var(--color-border)] rounded mb-3" />
          <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
          <div className="h-4 w-4/5 bg-[var(--color-border)] rounded" />
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 animate-pulse">
          <div className="h-6 w-32 bg-[var(--color-border)] rounded mb-4" />
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="h-5 w-24 bg-[var(--color-border)] rounded mb-3" />
            <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
            <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[var(--color-border)] rounded" />
          </div>
        </div>

        <div className="h-10 w-40 bg-[var(--color-border)] animate-pulse rounded-lg" />
      </div>
    </div>
  );
}