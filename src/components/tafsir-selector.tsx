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
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Select Tafsir</h3>
      <div className="space-y-2">
        {tafsirs.map((tafsir) => (
          <button
            key={tafsir.id}
            onClick={() => handleSelect(tafsir.id.toString())}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              currentTafsir === tafsir.id.toString()
                ? 'border-[var(--color-primary)] bg-[var(--color-bg)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }`}
          >
            <p className="font-medium text-[var(--color-text)]">{tafsir.author_name}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{tafsir.language_name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}