export default function TafsirLoading() {
  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-8">
        <div className="h-9 w-32 bg-[#E8E0D5] animate-pulse rounded mx-auto" />
        <div className="h-5 w-32 bg-[#E8E0D5] animate-pulse rounded mx-auto mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="h-5 w-24 bg-[#E8E0D5] animate-pulse rounded mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#E8E0D5] animate-pulse rounded-lg mb-2" />
          ))}
        </div>
        <div>
          <div className="h-5 w-24 bg-[#E8E0D5] animate-pulse rounded mb-3" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#E8E0D5] animate-pulse rounded-lg mb-2" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#E8E0D5] rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-[#E8E0D5] rounded-full" />
              <div className="h-4 w-20 bg-[#E8E0D5] rounded" />
            </div>
            <div className="h-4 w-full bg-[#E8E0D5] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[#E8E0D5] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}