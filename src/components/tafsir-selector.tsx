'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

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
  const copy = useCopy();
  const { language } = useLanguage();
  const [tafsirs] = useState<Tafsir[]>(initialTafsirs);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  
  const currentTafsir = searchParams.get('tafsir') || (tafsirs[0]?.id.toString() || '');

  const preferredLanguage = language === 'ur' ? 'urdu' : 'english';

  const recommendedTafsirs = useMemo(() => {
    return [...tafsirs]
      .sort((a, b) => {
        const aLang = (a.language_name || '').toLowerCase() === preferredLanguage ? 0 : 1;
        const bLang = (b.language_name || '').toLowerCase() === preferredLanguage ? 0 : 1;
        if (aLang !== bLang) {
          return aLang - bLang;
        }

        return (a.author_name || a.name || '').localeCompare(b.author_name || b.name || '');
      })
      .slice(0, 5);
  }, [preferredLanguage, tafsirs]);

  const filteredTafsirs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return [...tafsirs].sort((a, b) => (a.language_name || '').localeCompare(b.language_name || ''));
    }

    return tafsirs.filter((tafsir) => {
      return (
        (tafsir.author_name || '').toLowerCase().includes(needle) ||
        (tafsir.name || '').toLowerCase().includes(needle) ||
        (tafsir.language_name || '').toLowerCase().includes(needle)
      );
    });
  }, [search, tafsirs]);

  const handleSelect = (tafsirId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tafsir', tafsirId);
    router.push(`/tafsir?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">{copy.tafsir.selectTafsir}</h3>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-3 quiet-controls">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Recommended
        </p>
        <div className="space-y-2">
          {recommendedTafsirs.map((tafsir) => (
            <button
              key={tafsir.id}
              onClick={() => handleSelect(tafsir.id.toString())}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                currentTafsir === tafsir.id.toString()
                  ? 'border-[var(--color-primary)] bg-[var(--color-bg)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }`}
            >
              <p className="font-medium text-[var(--color-text)]">{tafsir.author_name || tafsir.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{tafsir.language_name}</p>
            </button>
          ))}
        </div>

        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
          >
            {showAll ? 'Hide full tafsir list' : 'Show full tafsir list'}
          </button>

          {showAll && (
            <div className="mt-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tafsir source"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {filteredTafsirs.map((tafsir) => (
                  <button
                    key={`all-${tafsir.id}`}
                    onClick={() => handleSelect(tafsir.id.toString())}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentTafsir === tafsir.id.toString()
                        ? 'border-[var(--color-primary)] bg-[var(--color-bg)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <p className="font-medium text-[var(--color-text)]">{tafsir.author_name || tafsir.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{tafsir.language_name}</p>
                  </button>
                ))}
                {filteredTafsirs.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No tafsir sources found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
