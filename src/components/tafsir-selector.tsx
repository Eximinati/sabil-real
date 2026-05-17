'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tafsir {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

interface TafsirSelectorProps {
  initialTafsirs: Tafsir[];
}

export function TafsirSelector({ initialTafsirs }: TafsirSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tafsirs] = useState<Tafsir[]>(initialTafsirs);
  
  const currentTafsir = searchParams.get('tafsir') || (tafsirs[0]?.id.toString() || '');

  const handleSelect = (tafsirId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tafsir', tafsirId);
    router.push(`/tafsir?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[#6B7280] mb-3">Select Tafsir</h3>
      <div className="space-y-2">
        {tafsirs.map((tafsir) => (
          <button
            key={tafsir.id}
            onClick={() => handleSelect(tafsir.id.toString())}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              currentTafsir === tafsir.id.toString()
                ? 'border-[#2D6A4F] bg-[#F0F9F4]'
                : 'border-[#E8E0D5] hover:border-[#2D6A4F]'
            }`}
          >
            <p className="font-medium text-[#1A1A1A]">{tafsir.author_name}</p>
            <p className="text-sm text-[#6B7280]">{tafsir.language_name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}