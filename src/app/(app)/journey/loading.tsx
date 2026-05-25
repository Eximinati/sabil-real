export default function JourneyLoading() {
  return (
    <div className="reading-screen mx-auto max-w-[960px] px-4 md:px-8 lg:px-16 pt-8 md:pt-12 pb-20 md:pb-16">
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">Preparing today&apos;s journey...</p>
      <div className="mb-8 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10">
        <div className="h-4 w-24 rounded bg-[var(--color-border)] animate-pulse" />
        <div className="mt-6 h-8 w-3/4 rounded bg-[var(--color-border)] animate-pulse" />
        <div className="mt-3 h-4 w-2/3 rounded bg-[var(--color-border)] animate-pulse" />
        <div className="mt-8 h-12 w-40 rounded-full bg-[var(--color-border)] animate-pulse" />
      </div>

      <div className="mb-8 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="h-4 w-32 rounded bg-[var(--color-border)] animate-pulse" />
        <div className="mt-4 h-6 w-full rounded bg-[var(--color-border)] animate-pulse" />
        <div className="mt-2 h-6 w-5/6 rounded bg-[var(--color-border)] animate-pulse" />
      </div>

      <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
        <div className="mb-5 h-5 w-56 rounded bg-[var(--color-border)] animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:p-5 animate-pulse"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-7 w-16 rounded-full bg-[var(--color-border)]" />
                  <div>
                    <div className="mb-2 h-5 w-32 rounded bg-[var(--color-border)]" />
                    <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-4 w-16 rounded bg-[var(--color-border)]" />
                  <div className="h-5 w-14 rounded bg-[var(--color-border)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
