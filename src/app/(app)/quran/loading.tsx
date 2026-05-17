export default function QuranLoading() {
  return (
    <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
      <div className="text-center mb-10">
        <div className="h-9 w-48 bg-[#E8E0D5] animate-pulse rounded mx-auto" />
        <div className="h-5 w-32 bg-[#E8E0D5] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="max-w-md mx-auto mb-8">
        <div className="h-12 bg-[#E8E0D5] animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#E8E0D5] rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#E8E0D5] rounded-full" />
              <div className="flex-1">
                <div className="h-6 w-24 bg-[#E8E0D5] rounded mb-2" />
                <div className="h-4 w-16 bg-[#E8E0D5] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}