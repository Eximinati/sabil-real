export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}