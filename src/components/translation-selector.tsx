'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

export function TranslationSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTranslation = searchParams.get('translation') || '131';

  useEffect(() => {
    fetch('/api/translations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTranslations(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('translation', e.target.value);
    router.push(`/quran/${searchParams.get('chapterId') || '1'}?${params.toString()}`);
  };

  if (loading) {
    return <span className="text-sm text-[#6B7280]">Loading...</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#6B7280]">Translation:</span>
      <select
        value={currentTranslation}
        onChange={handleChange}
        className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F]"
      >
        {translations.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.author_name})
          </option>
        ))}
      </select>
    </div>
  );
}