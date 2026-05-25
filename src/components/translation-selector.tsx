'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';

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
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const uiCopy = language === 'ur'
    ? {
        loading: 'لوڈ ہو رہا ہے...',
        label: 'ترجمہ',
        hint: 'پڑھتے وقت ایک ترجمہ مستقل رکھیں تاکہ توجہ برقرار رہے۔',
      }
    : {
        loading: 'Loading...',
        label: 'Translation',
        hint: 'Keep one translation as your quiet default while reading.',
      };

  const chapterId = params.id as string;
  const currentTranslation = searchParams.get('translation') || '203';

  const sortedTranslations = useMemo(() => {
    const preferredLanguage = language === 'ur' ? 'urdu' : 'english';

    return [...translations].sort((a, b) => {
      const aPreferred = (a.language_name || '').toLowerCase() === preferredLanguage ? 1 : 0;
      const bPreferred = (b.language_name || '').toLowerCase() === preferredLanguage ? 1 : 0;

      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred;
      }

      return (a.author_name || '').localeCompare(b.author_name || '');
    });
  }, [language, translations]);

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
    return <span className="text-sm text-[var(--color-text-muted)]">{uiCopy.loading}</span>;
  }

  return (
    <div className="quiet-controls flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)] hidden sm:inline">{uiCopy.label}:</span>
        <select
          value={currentTranslation}
          onChange={handleChange}
          className="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
        >
          {sortedTranslations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.author_name} ({t.language_name})
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] hidden md:block">
        {uiCopy.hint}
      </p>
    </div>
  );
}
