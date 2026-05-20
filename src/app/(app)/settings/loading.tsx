export default function SettingsLoading() {
  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-10">
        <div className="h-9 w-24 bg-[var(--color-border)] animate-pulse rounded mx-auto" />
        <div className="h-5 w-32 bg-[var(--color-border)] animate-pulse rounded mx-auto mt-3" />
      </div>
      <div className="max-w-[680px] mx-auto space-y-8">
        <div>
          <div className="h-6 w-32 bg-[var(--color-border)] rounded mb-3" />
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[var(--color-border)] rounded-full" />
              <div>
                <div className="h-4 w-48 bg-[var(--color-border)] rounded mb-2" />
                <div className="h-3 w-16 bg-[var(--color-border)] rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
              <div>
                <div className="h-3 w-16 bg-[var(--color-border)] rounded mb-2" />
                <div className="h-4 w-48 bg-[var(--color-border)] rounded" />
              </div>
              <div>
                <div className="h-3 w-24 bg-[var(--color-border)] rounded mb-2" />
                <div className="h-4 w-32 bg-[var(--color-border)] rounded" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="h-6 w-40 bg-[var(--color-border)] rounded mb-3" />
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 animate-pulse">
            <div className="h-4 w-40 bg-[var(--color-border)] rounded mb-4" />
            <div className="h-10 w-full bg-[var(--color-border)] rounded-lg" />
            <div className="h-4 w-32 bg-[var(--color-border)] rounded mt-4 mb-2" />
            <div className="h-10 w-full bg-[var(--color-border)] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}