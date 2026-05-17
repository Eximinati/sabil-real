export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F1] p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-xl border border-[#E8E0D5] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}