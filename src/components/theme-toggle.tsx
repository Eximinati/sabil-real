'use client';

import { useTheme, Theme } from './theme-provider';
import { useLanguage } from '@/lib/i18n/context';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const options: { value: Theme; label: string }[] = [
    {
      value: 'light',
      label: isUrdu ? 'روشن' : 'Light',
    },
    {
      value: 'dark',
      label: isUrdu ? 'مدھم' : 'Dark',
    },
    {
      value: 'system',
      label: isUrdu ? 'آلہ کے مطابق' : 'System',
    },
  ];

  return (
    <div className="flex items-center gap-1" role="group" aria-label={isUrdu ? 'ظاہری انداز منتخب کریں' : 'Theme selector'}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-pressed={theme === opt.value}
          title={isUrdu ? `${opt.label} انداز` : `${opt.label} mode`}
          className={`p-1.5 rounded-md transition-all ${
            theme === opt.value
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          {opt.value === 'light' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
          {opt.value === 'dark' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {opt.value === 'system' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
