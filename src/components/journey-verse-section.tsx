'use client';

import { useState } from 'react';

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
  loadingAudio?: boolean;
}

export function JourneyVerseSection({
  verses,
  reciterId,
  onPlayAudio,
  currentPlayingVerse,
  isPlaying,
  loadingAudio,
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
          reciterId={reciterId}
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
  reciterId: number;
  onPlayAudio: (verseKey: string, audioUrl: string, index: number) => void;
  currentPlayingVerse?: string | null;
  isPlaying?: boolean;
}

function JourneyVerseCard({
  verse,
  chapterName,
  verseKey,
  audioUrl,
  reciterId,
  onPlayAudio,
  currentPlayingVerse,
  isPlaying,
}: JourneyVerseCardProps) {
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const verseNumber = verseKey.split(':')[1];
  const chapterId = verseKey.split(':')[0];
  const isCurrentlyPlaying = currentPlayingVerse === verseKey && isPlaying;

  const handleTafsirToggle = async () => {
    if (showTafsir) {
      setShowTafsir(false);
      return;
    }

    setShowTafsir(true);
    if (tafsirText) return;

    setLoadingTafsir(true);
    try {
      const tafsirId = localStorage.getItem('sabil-tafsir-id') || '169';
      const res = await fetch(`/api/tafsirs/${tafsirId}/${chapterId}`);
      const data = await res.json();
      
      const tafsirs = data.tafsirs || data;
      const verseTafsir = tafsirs.find((t: any) => 
        t.verse_number === parseInt(verseNumber) || 
        t.verse_key === verseKey
      );
      
      if (verseTafsir?.text) {
        setTafsirText(verseTafsir.text);
      } else if (tafsirs.length > 0) {
        setTafsirText('Tafsir available but not found for this specific verse.');
      } else {
        setTafsirText('No tafsir available for this chapter.');
      }
    } catch (e) {
      console.error('Tafsir fetch error:', e);
      setTafsirText('Unable to load tafsir. Please try again.');
    }
    setLoadingTafsir(false);
  };

  return (
    <div className={`bg-[var(--color-surface)] border rounded-xl overflow-hidden mb-4 transition-all ${
      isCurrentlyPlaying ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)]'
    }`}>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
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
              className="font-arabic text-[22px] md:text-[28px] text-right text-[var(--color-text)] leading-[2.4]"
              dir="rtl"
            >
              {verse.text_uthmani}
            </p>
            <div className="border-t border-[var(--color-border)] pt-4 mt-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                {verse.translations?.[0]?.resource_name || 'Translation'}
              </p>
              <p className="text-[14px] md:text-[15px] leading-[1.8] text-[var(--color-text-secondary)]">
                {verse.translations?.[0]?.text || 'No translation available'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-[var(--color-text-muted)]">Verse not available</p>
        )}

        <button
          onClick={handleTafsirToggle}
          className="mt-4 flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {showTafsir ? 'Hide Tafsir' : 'Show Tafsir'}
        </button>

        {showTafsir && (
          <div className="mt-4 p-4 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-2">Tafsir</h4>
            {loadingTafsir ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading tafsir...
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {tafsirText || 'No tafsir available for this verse.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}