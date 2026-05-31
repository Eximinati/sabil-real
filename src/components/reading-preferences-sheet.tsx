'use client';

import { useState, useEffect, useCallback } from 'react';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { JourneyReciterSelector } from './journey-reciter-selector';
import { TafsirLibrarySheet } from './tafsir-library-sheet';
import type { TafsirLanguagePreference } from '@/lib/tafsir-preferences';

interface ReadingPreferencesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTranslationId: number;
  currentReciterId: number;
  selectedJourneyLanguage?: 'auto' | 'en' | 'ur';
  onTranslationChange: (id: number) => void;
  onReciterChange: (id: number) => void;
  onJourneyLanguageChange?: (value: 'auto' | 'en' | 'ur') => void;
  onOpenTranslationLibrary: () => void;
  onOpenReciterLibrary: () => void;
  currentTafsirId?: number;
  onTafsirChange?: (id: number) => void;
  tafsirPreferredLanguage?: TafsirLanguagePreference;
  onTafsirLanguageChange?: (lang: TafsirLanguagePreference) => void;
  hideJourneyLanguage?: boolean;
  copy: {
    readingPreferences: string;
    journeyLanguage?: string;
    auto?: string;
    english?: string;
    urdu?: string;
    translation: string;
    reciter: string;
    tafsir?: string;
    manageTranslations: string;
    manageReciters: string;
    manageTafsirScholars?: string;
    readingStyle: string;
    comfortable: string;
    focused: string;
    largeText: string;
    audio: string;
    enabled: string;
    manageAudio: string;
    close: string;
    tafsirLibrary?: string;
  };
}

export function ReadingPreferencesSheet({
  isOpen,
  onClose,
  currentTranslationId,
  currentReciterId,
  selectedJourneyLanguage = 'auto',
  onTranslationChange,
  onReciterChange,
  onJourneyLanguageChange,
  onOpenTranslationLibrary,
  onOpenReciterLibrary,
  currentTafsirId,
  onTafsirChange,
  tafsirPreferredLanguage,
  onTafsirLanguageChange,
  hideJourneyLanguage = false,
  copy,
}: ReadingPreferencesSheetProps) {
  const [closing, setClosing] = useState(false);
  const [readingStyle, setReadingStyle] = useState<'comfortable' | 'focused' | 'large'>('comfortable');
  const [showTafsirLibrary, setShowTafsirLibrary] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 200);
  }, [onClose]);

  if (!isOpen && !closing) return null;

  const styleOptions = [
    { value: 'comfortable' as const, label: copy.comfortable },
    { value: 'focused' as const, label: copy.focused },
    { value: 'large' as const, label: copy.largeText },
  ];

  return (
    <>
      <button
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in-fast"
        onClick={handleClose}
        aria-label={copy.close}
      />

      <div
        className={`fixed z-50 bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl overflow-y-auto overscroll-contain transition-all duration-200 ${
          closing ? 'opacity-0 scale-95 translate-y-4 md:translate-y-0' : 'opacity-100 scale-100 translate-y-0'
        } bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[28px] border-t md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:right-auto md:max-h-[85vh] md:w-[480px] md:max-w-[90vw] md:rounded-[24px] md:border`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {copy.readingPreferences}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 transition-colors"
            aria-label={copy.close}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {!hideJourneyLanguage && (
            <>
              <section>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  {copy.journeyLanguage || 'Journey Language'}
                </h3>
                <div className="flex gap-2">
                  {[
                    { value: 'auto' as const, label: copy.auto || 'Auto' },
                    { value: 'en' as const, label: copy.english || 'English' },
                    { value: 'ur' as const, label: copy.urdu || 'Urdu' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => onJourneyLanguageChange?.(value)}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        selectedJourneyLanguage === value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              <hr className="border-[var(--color-border)]" />
            </>
          )}

          {/* Translation */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {copy.translation}
            </h3>
            <JourneyTranslationSelector
              currentTranslationId={currentTranslationId}
              onTranslationChange={onTranslationChange}
              variant="inline"
              onOpenLibrary={onOpenTranslationLibrary}
            />
          </section>

          <hr className="border-[var(--color-border)]" />

          {/* Reciter */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {copy.reciter}
            </h3>
            <JourneyReciterSelector
              currentReciterId={currentReciterId}
              onReciterChange={onReciterChange}
              variant="inline"
              onOpenLibrary={onOpenReciterLibrary}
            />
          </section>

          <hr className="border-[var(--color-border)]" />

          {/* Tafsir Scholar */}
          {onTafsirChange && (
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {copy.tafsir || 'Tafsir Scholar'}
              </h3>
              <button
                onClick={() => setShowTafsirLibrary(true)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-3 text-left transition-colors hover:border-[var(--color-primary)]/30"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {currentTafsirId ? `Scholar #${currentTafsirId}` : copy.manageTafsirScholars || 'Browse Scholars'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {copy.manageTafsirScholars || 'Manage Tafsir Scholars'}
                  </p>
                </div>
                <svg className="h-4 w-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </section>
          )}

          {onTafsirChange && <hr className="border-[var(--color-border)]" />}

          {/* Reading Style (UI-only) */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {copy.readingStyle}
            </h3>
            <div className="space-y-2">
              {styleOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setReadingStyle(value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    readingStyle === value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                    readingStyle === value
                      ? 'border-[var(--color-primary)]'
                      : 'border-[var(--color-text-muted)]'
                  }`}>
                    {readingStyle === value && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>

          <hr className="border-[var(--color-border)]" />

          {/* Audio (placeholder) */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {copy.audio}
            </h3>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">{copy.enabled}</p>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {copy.manageAudio}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-[var(--color-border)] px-5 py-4">
          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            {copy.close}
          </button>
        </div>
      </div>

      {onTafsirChange && (
        <TafsirLibrarySheet
          isOpen={showTafsirLibrary}
          onClose={() => setShowTafsirLibrary(false)}
          currentTafsirId={currentTafsirId || 169}
          onSelect={onTafsirChange}
          preferredLanguage={tafsirPreferredLanguage || 'auto'}
          onLanguageChange={onTafsirLanguageChange || (() => {})}
          copy={{
            tafsirLibrary: copy.tafsirLibrary || 'Tafsir Library',
            searchPlaceholder: copy.tafsirLibrary || 'Search language or scholar',
            currentScholar: copy.tafsir || 'Current Scholar',
            recentlyUsed: copy.manageTafsirScholars || 'Recently Used',
            recommended: copy.manageTafsirScholars || 'Recommended',
            allScholars: copy.manageTafsirScholars || 'All Scholars',
            languageFilter: copy.tafsir || 'Language',
            auto: copy.auto || 'Auto',
            english: copy.english || 'English',
            urdu: copy.urdu || 'Urdu',
            arabic: copy.auto || 'Arabic',
            noResults: copy.tafsir || 'No results found.',
          }}
        />
      )}
    </>
  );
}
