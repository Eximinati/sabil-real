'use client';

import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import type { LanguageCode } from '@/lib/i18n/config';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const ORDERED_LANGUAGES: LanguageCode[] = ['en', 'ur'];

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const copy = useCopy();
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-1 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
      aria-label={copy.common.language.label}
    >
      {ORDERED_LANGUAGES.map((code) => {
        const isActive = code === language;
        const label = code === 'en' ? copy.common.language.english : copy.common.language.urdu;

        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              isActive
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            aria-pressed={isActive}
            aria-label={`${copy.common.language.switchTo}: ${label}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
