'use client';

import { useLanguage } from '@/lib/i18n/context';

interface VerseData {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{
    resource_name: string;
    text: string;
  }>;
}

interface JourneyVerseSectionProps {
  verses: Array<{
    verse: VerseData | null;
    chapterName: string;
    verseKey: string;
    audioUrl?: string;
  }>;
  reciterId: number;
  onPlayAudio: (verseKey: string, audioUrl: string, index: number) => void;
  currentPlayingVerse?: string | null;
  isPlaying?: boolean;
}

export function JourneyVerseSection({
  verses,
  onPlayAudio,
  currentPlayingVerse,
  isPlaying,
}: JourneyVerseSectionProps) {
  return (
    <div className="reading-section">
      {verses.map(({ verse, chapterName, verseKey, audioUrl }, idx) => (
        <JourneyVerseCard
          key={idx}
          verse={verse}
          chapterName={chapterName}
          verseKey={verseKey}
          audioUrl={audioUrl}
          onPlayAudio={onPlayAudio}
          currentPlayingVerse={currentPlayingVerse}
          isPlaying={isPlaying}
        />
      ))}
    </div>
  );
}

interface JourneyVerseCardProps {
  verse: VerseData | null;
  chapterName: string;
  verseKey: string;
  audioUrl?: string;
  onPlayAudio: (verseKey: string, audioUrl: string, index: number) => void;
  currentPlayingVerse?: string | null;
  isPlaying?: boolean;
}

function JourneyVerseCard({
  verse,
  chapterName,
  verseKey,
  audioUrl,
  onPlayAudio,
  currentPlayingVerse,
  isPlaying,
}: JourneyVerseCardProps) {
  const { language } = useLanguage();
  const verseNumber = verseKey.split(':')[1];
  const isCurrentlyPlaying = currentPlayingVerse === verseKey && isPlaying;
  const verseFrame = language === 'ur'
    ? {
        chapterFallback: 'قرآن',
        verseWord: 'آیت',
        playAudio: 'آڈیو چلائیں',
        sourceLabel: 'اصل آیت',
        sourceHint: 'یہ قرآن کا اصل عربی متن ہے۔',
        translationLabel: 'فہم کے لیے ترجمہ',
        translationHint: 'یہ حصہ معنی سمجھنے کے لیے ہے۔',
        translationFallback: 'ترجمہ',
        translationUnavailable: 'ترجمہ دستیاب نہیں',
        verseUnavailable: 'آیت دستیاب نہیں',
      }
    : {
        chapterFallback: 'Quran',
        verseWord: 'Verse',
        playAudio: 'Play audio',
        sourceLabel: 'Source verse text',
        sourceHint: 'This is the Arabic source wording.',
        translationLabel: 'Meaning translation',
        translationHint: 'This supports understanding.',
        translationFallback: 'Translation',
        translationUnavailable: 'No translation available',
        verseUnavailable: 'Verse not available',
      };

  return (
    <div className={`mb-5 overflow-hidden rounded-[28px] border bg-[var(--color-surface)]/88 transition-all ${
      isCurrentlyPlaying ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)]'
    }`}>
      <div className="p-5 md:p-7">
        <div className="quiet-controls mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--color-accent)]">
            {(chapterName || verseFrame.chapterFallback)} · {verseFrame.verseWord} {verseNumber}
          </span>
          <div className="flex items-center gap-2">
            {audioUrl && (
              <button
                onClick={() => onPlayAudio(verseKey, audioUrl, 0)}
                className={`p-2 rounded-full transition-colors ${
                  isCurrentlyPlaying
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                }`}
                aria-label={verseFrame.playAudio}
              >
                {isCurrentlyPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        
        {verse ? (
          <>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/35 p-4">
              <p className="text-xs font-medium text-[var(--color-primary)]">{verseFrame.sourceLabel}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mb-2">{verseFrame.sourceHint}</p>
              <p
                className="reading-arabic font-arabic text-[24px] md:text-[30px] text-right text-[var(--color-text)] leading-[2.5]"
                dir="rtl"
              >
                {verse.text_uthmani}
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-medium text-[var(--color-primary)] mb-0.5">
                {verseFrame.translationLabel}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mb-2">
                {verseFrame.translationHint}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                {verse.translations?.[0]?.resource_name || verseFrame.translationFallback}
              </p>
              <p className="text-[15px] md:text-[16px] leading-[2] text-[var(--color-text-secondary)]">
                {verse.translations?.[0]?.text || verseFrame.translationUnavailable}
              </p>
            </div>
          </>
        ) : (
          <p className="text-[var(--color-text-muted)]">{verseFrame.verseUnavailable}</p>
        )}
      </div>
    </div>
  );
}
