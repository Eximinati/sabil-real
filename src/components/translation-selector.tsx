'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

export function TranslationSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);

  const chapterId = params.id as string;
  const currentTranslation = searchParams.get('translation') || '203';

  useEffect(() => {
    fetch('/api/translations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTranslations(data);
        } else if (data.translations && Array.isArray(data.translations)) {
          setTranslations(data.translations);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams();
    newParams.set('translation', e.target.value);
    router.push(`/quran/${chapterId}?${newParams.toString()}`);
  };

  if (loading) {
    return <span className="text-sm text-[var(--color-text-muted)]">Loading...</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-text-muted)] hidden sm:inline">Translation:</span>
      <select
        value={currentTranslation}
        onChange={handleChange}
        className="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
      >
        {translations.map((t) => (
          <option key={t.id} value={t.id}>
            {t.author_name} ({t.language_name})
          </option>
        ))}
      </select>
    </div>
  );
}