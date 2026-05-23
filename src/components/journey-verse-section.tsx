'use client';

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
    <div className="mb-8">
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
  const verseNumber = verseKey.split(':')[1];
  const isCurrentlyPlaying = currentPlayingVerse === verseKey && isPlaying;

  return (
    <div className={`mb-5 overflow-hidden rounded-[28px] border bg-[var(--color-surface)] transition-all ${
      isCurrentlyPlaying ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)]'
    }`}>
      <div className="p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--color-accent)]">
            {chapterName} · Verse {verseNumber}
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
                aria-label="Play audio"
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
            <p
              className="font-arabic text-[24px] md:text-[30px] text-right text-[var(--color-text)] leading-[2.5]"
              dir="rtl"
            >
              {verse.text_uthmani}
            </p>
            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                {verse.translations?.[0]?.resource_name || 'Translation'}
              </p>
              <p className="text-[15px] md:text-[16px] leading-[1.95] text-[var(--color-text-secondary)]">
                {verse.translations?.[0]?.text || 'No translation available'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-[var(--color-text-muted)]">Verse not available</p>
        )}
      </div>
    </div>
  );
}
