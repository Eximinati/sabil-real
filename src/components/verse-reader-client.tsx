'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAudioPlayerContext } from './audio-player-provider';
import { useFocusMode } from './focus-mode-provider';
import { useToast } from '@/hooks/use-toast';
import { getStoredReciterId } from '@/hooks/use-audio-player';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useReadingHistory } from '@/hooks/use-reading-history';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { CopyButton } from './copy-button';
import { FocusModeToggle } from './focus-mode-toggle';
import { SurahControls } from './surah-controls';
import { AudioPlayer } from './audio-player';
import { getApiUrl } from '@/lib/api-url';
import { useCopy, useI18nText } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

interface VerseCardProps {
  verse: {
    id: number;
    verse_key: string;
    text_uthmani: string;
    translations?: Array<{
      text: string;
      resource_id: number;
      resource_name: string;
    }>;
  };
  verseNumber: number;
  verseIndex: number;
  chapterId: number;
  translatorLabel: string;
  translationId: number;
}

function estimateReadingTimeMinutes(verseCount: number): number {
  return Math.ceil(verseCount * 0.17);
}

export function VerseReaderClient({
  verses,
  chapterId,
  chapterName,
  chapterNameArabic,
  versesCount,
  revelationPlace,
  translatorLabel,
  translationId,
  prevChapter,
  nextChapter,
}: {
  verses: any[];
  chapterId: number;
  chapterName: string;
  chapterNameArabic: string;
  versesCount: number;
  revelationPlace: string;
  translatorLabel: string;
  translationId: number;
  prevChapter: number | null;
  nextChapter: number | null;
}) {
  const { state, playSurah } = useAudioPlayerContext();
  const { isFocusMode } = useFocusMode();
  const toast = useToast();
  const copy = useCopy();
  const { interpolate } = useI18nText();
  const { language } = useLanguage();
  const { updateProgress, getPositionForSurah } = useReadingProgress(chapterId);
  const { addToHistory } = useReadingHistory();
  const { bookmarks } = useBookmarks();
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<Record<number, AudioFile[]>>({});
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  const showBismillah = chapterId !== 1 && chapterId !== 9;
  const readingTimeMinutes = estimateReadingTimeMinutes(versesCount);
  const isMaccan = revelationPlace === 'Meccan';
  const verseFrame = language === 'ur'
    ? {
        sourceLabel: 'اصل قرآنی متن',
        sourceHint: 'یہ آیت کا اصل عربی متن ہے۔',
        translationLabel: 'فہم کے لیے ترجمہ',
        translationHint: 'یہ حصہ معنی سمجھنے کے لیے ہے، اصل متن نہیں۔',
      }
    : {
        sourceLabel: 'Sacred source text',
        sourceHint: 'This is the Arabic source wording of the verse.',
        translationLabel: 'Meaning translation',
        translationHint: 'This helps understanding and is not source wording.',
      };

  const isActive = (verseKey: string) => state.currentVerseKey === verseKey;
  const isPlaying = (verseKey: string) => isActive(verseKey) && state.isPlaying;

  useEffect(() => {
    const chapterBookmarks = bookmarks.filter(b => b.surah_id === chapterId);
    const bookmarked = new Set<string>(
      chapterBookmarks.map(b => `verse-${b.verse_number}`)
    );
    setBookmarkedVerses(bookmarked);
  }, [bookmarks, chapterId]);

  useEffect(() => {
    addToHistory({
      surahId: chapterId,
      surahName: chapterName,
      surahNameArabic: chapterNameArabic,
      lastVerse: 1,
      timestamp: Date.now(),
    });
  }, [chapterId, chapterName, chapterNameArabic, addToHistory]);

  useEffect(() => {
    if (!hasRestoredScroll.current && verses.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const scrollParam = params.get('scroll');
      const verseParam = params.get('verse');
      
      const targetScroll = scrollParam ? parseInt(scrollParam, 10) : null;
      const targetVerse = verseParam ? parseInt(verseParam, 10) : 1;
      
      if (targetScroll !== null && targetScroll > 0) {
        setTimeout(() => {
          window.scrollTo({ top: targetScroll, behavior: 'auto' });
          lastSavedPosition.current = targetScroll;
          lastSavedVerse.current = targetVerse;
          hasRestoredScroll.current = true;
        }, 100);
      } else {
        const progress = getPositionForSurah(chapterId);
        if (progress && progress.scroll_position > 0) {
          setTimeout(() => {
            window.scrollTo({ top: progress.scroll_position, behavior: 'auto' });
            lastSavedPosition.current = progress.scroll_position;
            lastSavedVerse.current = progress.verse_number;
            hasRestoredScroll.current = true;
          }, 100);
        } else {
          hasRestoredScroll.current = true;
        }
      }
    }
  }, [verses, chapterId, getPositionForSurah]);

  const lastSavedPosition = useRef(0);
  const lastSavedVerse = useRef(1);
  
  const handleScroll = useCallback(() => {
    if (!chapterId) return;
    
    const currentScrollY = window.scrollY;
    const currentVerse = Math.max(1, Math.floor(currentScrollY / 400) + 1);
    
    const scrollDiff = Math.abs(currentScrollY - lastSavedPosition.current);
    const verseDiff = Math.abs(currentVerse - lastSavedVerse.current);
    
    if (scrollDiff >= 100 || verseDiff >= 1) {
      lastSavedPosition.current = currentScrollY;
      lastSavedVerse.current = currentVerse;
      updateProgress(currentVerse, currentScrollY);
    }
  }, [chapterId, updateProgress]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handlePlayVerse = async (verseKey: string, files: AudioFile[]) => {
    if (files.length > 0) {
      playSurah(chapterId, getStoredReciterId() || 5, files);
    }
  };

  const handleLoadAndPlay = async (verseKey: string) => {
    const reciterId = getStoredReciterId() || 5;
    let files = cachedAudio[reciterId];

    if (!files) {
      setLoadingAudio(true);
      try {
        const res = await fetch(getApiUrl(`/audio/${reciterId}/${chapterId}`));
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        files = data.audio_files || [];
        setCachedAudio(prev => ({ ...prev, [reciterId]: files }));
      } catch {
        toast.error(copy.quran.audioFailed);
        setLoadingAudio(false);
        return;
      }
      setLoadingAudio(false);
    }

handlePlayVerse(verseKey, files);
  };

  const toggleBookmark = async (verseNumber: number) => {
    const verseKey = `verse-${verseNumber}`;
    const isCurrentlyBookmarked = bookmarkedVerses.has(verseKey);

    setBookmarkedVerses(prev => {
      const updated = new Set(prev);
      if (isCurrentlyBookmarked) {
        updated.delete(verseKey);
      } else {
        updated.add(verseKey);
      }
      return updated;
    });

    try {
      const method = isCurrentlyBookmarked ? 'DELETE' : 'POST';
      await fetch('/api/bookmarks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surah_id: chapterId, verse_number: verseNumber }),
      });
      toast.success(isCurrentlyBookmarked ? copy.quran.bookmarkRemoved : copy.quran.bookmarkAdded);
    } catch {
      setBookmarkedVerses(prev => {
        const updated = new Set(prev);
        if (isCurrentlyBookmarked) {
          updated.add(verseKey);
        } else {
          updated.delete(verseKey);
        }
        return updated;
      });
      toast.error(copy.quran.bookmarkUpdateFailed);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen pb-32 md:pb-24 transition-all duration-300 ease-in-out ${
        isFocusMode ? 'md:ml-0' : 'md:ml-[240px]'
      }`}
      data-script-direction={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div
        className="z-20 transition-all duration-300 md:sticky md:top-0"
      >
        <div
          className={`mx-auto px-4 pt-3 md:pt-6 transition-all duration-300 ${
            isFocusMode ? 'px-4 md:px-8 max-w-[850px]' : 'px-4 md:px-6 max-w-3xl'
          }`}
        >
          <div className="quiet-controls rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 px-4 py-3.5 backdrop-blur-sm md:px-5 md:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href="/quran"
                  className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  {copy.quran.backToQuran}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm md:text-base">
                  <span className="font-medium text-[var(--color-text)]">{chapterName}</span>
                  <span className="hidden text-[var(--color-text-muted)] md:inline">•</span>
                  <span className="font-arabic text-[var(--color-accent)]" dir="rtl">
                    {chapterNameArabic}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-[1.7] text-[var(--color-text-muted)] md:text-sm">
                  {isMaccan ? copy.quran.revealedMakkah : copy.quran.revealedMadinah}
                  <span className="mx-2">•</span>
                  {interpolate(copy.quran.aboutReading, {
                    time: `${readingTimeMinutes} ${copy.common.labels.minutesSuffix}`,
                  })}
                </p>
              </div>

              <div className="quiet-controls flex shrink-0 items-center gap-2">
                <SurahControls chapterId={chapterId} />
                <FocusModeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main
        className={`reading-screen py-6 md:py-10 transition-all duration-300 ${
          isFocusMode ? 'px-4 md:px-8 max-w-[850px] mx-auto' : 'px-4 md:px-6 max-w-3xl mx-auto'
        }`}
      >
        {/* Surah Header */}
        <header className="reading-section text-center mb-8 md:mb-12">
          <span
            className="font-arabic text-[36px] md:text-[42px] text-[var(--color-accent)] block mb-4"
            dir="rtl"
          >
            {chapterNameArabic}
          </span>
          <h1 className="text-[var(--color-text)] text-[22px] md:text-2xl font-medium leading-[1.3]">
            {chapterName}
          </h1>
        </header>

        {/* Bismillah */}
        {showBismillah && (
          <div className="text-center mb-8 md:mb-12 py-4">
            <p
              className={`reading-arabic font-arabic text-[24px] md:text-[26px] text-[var(--color-text)] ${
                isFocusMode ? 'arabic-text-focus' : 'arabic-text'
              }`}
              dir="rtl"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
          </div>
        )}

        {/* Verses */}
        <div
          className={`space-y-5 md:space-y-6 ${
            isFocusMode ? 'space-y-6 md:space-y-8' : ''
          }`}
        >
          {verses.map((verse, index) => {
            const verseNumber = parseInt(verse.verse_key.split(':')[1], 10);
            const active = isActive(verse.verse_key);
            const playing = isPlaying(verse.verse_key);
            const translation = verse.translations?.find(
              (t: any) => t.resource_id === translationId
            );

            return (
              <article
                key={verse.id}
                className={`bg-[var(--color-surface)] rounded-xl md:rounded-2xl p-5 md:p-7 transition-all duration-300 ${
                  isFocusMode ? 'p-6 md:p-8' : ''
                } ${
                  active
                    ? 'border-2 border-[var(--color-primary)]/60 shadow-[0_0_20px_-6px_var(--color-primary)]/30 bg-[var(--color-primary)]/[0.02]'
                    : 'border border-[var(--color-border)]/80 hover:border-[var(--color-primary)]/40'
                }`}
              >
                {/* Verse Controls */}
                <div className="quiet-controls flex items-start justify-between mb-4 md:mb-6">
                  <span
                    className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    }`}
                  >
                    {verseNumber}
                  </span>
                  <div className="flex items-center gap-2 md:gap-3 -mt-1">
                    <button
                      onClick={() => toggleBookmark(verseNumber)}
                      className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all ${
                        bookmarkedVerses.has(`verse-${verseNumber}`)
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)]'
                      }`}
                      aria-label={bookmarkedVerses.has(`verse-${verseNumber}`) ? copy.quran.removeBookmark : copy.quran.addBookmark}
                    >
                      <svg
                        className="w-4 h-4"
                        fill={bookmarkedVerses.has(`verse-${verseNumber}`) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleLoadAndPlay(verse.verse_key)}
                      disabled={loadingAudio}
                      className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all ${
                        active
                          ? 'bg-[var(--color-primary)] text-white shadow-lg'
                          : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]'
                      } ${playing ? 'animate-pulse-soft' : ''}`}
                      aria-label={playing ? copy.quran.pauseVerse : copy.quran.playVerse}
                    >
                      {loadingAudio ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : playing ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <CopyButton
                      text={verse.text_uthmani}
                      translation={translation?.text}
                      className="quiet-controls"
                    />
                  </div>
                </div>

                {/* Arabic Text */}
                <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/35 p-4 md:p-5">
                  <p className="text-[11px] md:text-xs font-medium text-[var(--color-primary)]">
                    {verseFrame.sourceLabel}
                  </p>
                  <p className="mt-0.5 text-[11px] md:text-xs text-[var(--color-text-muted)]">
                    {verseFrame.sourceHint}
                  </p>
                  <p
                    className={`reading-arabic font-arabic text-right mt-4 transition-all duration-300 ${
                      isFocusMode
                        ? 'text-[26px] md:text-[32px] leading-[2.5]'
                        : 'text-[22px] md:text-[28px] leading-[2.3]'
                    } ${
                      isFocusMode ? 'arabic-text-focus' : 'arabic-text'
                    } text-[var(--color-text)]`}
                    dir="rtl"
                  >
                    {verse.text_uthmani}
                  </p>
                </div>

                {/* Translation */}
                <div className="border-t border-[var(--color-border)]/60 pt-4 md:pt-5">
                  <p className="text-[11px] md:text-xs font-medium text-[var(--color-primary)] mb-0.5">
                    {verseFrame.translationLabel}
                  </p>
                  <p className="text-[11px] md:text-xs text-[var(--color-text-muted)] mb-2">
                    {verseFrame.translationHint}
                  </p>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)] mb-2">
                    {translatorLabel}
                  </p>
                  <p
                    className={`text-[var(--color-text-secondary)] ${
                      isFocusMode ? 'text-[15px] md:text-base leading-[1.95]' : 'text-[15px] md:text-[15px] leading-[1.95]'
                    }`}
                  >
                    {translation?.text || copy.quran.translationUnavailable}
                  </p>
                  <div className="mt-4 text-right">
                    <Link
                      href={`/tafsir?surah=${chapterId}&verse=${verseNumber}`}
                    className="rtl-ready-arrow text-xs text-[var(--color-primary)] hover:underline"
                    data-script-direction={language === 'ur' ? 'rtl' : 'ltr'}
                  >
                    {copy.quran.tafsirLink} →
                  </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 text-center border-t border-[var(--color-border)]/60 pt-8">
          <p
            className="font-arabic text-xl text-[var(--color-accent)] mb-6"
            dir="rtl"
          >
            {chapterNameArabic}
          </p>
          <div className="flex justify-center gap-4 md:gap-8">
            {prevChapter ? (
                <Link
                  href={`/quran/${prevChapter}`}
                  className="text-[var(--color-primary)] hover:underline text-sm"
                >
                  ← {copy.quran.previousSurah}
                </Link>
            ) : (
              <span className="text-[var(--color-text-muted)]" />
            )}
            {nextChapter ? (
                <Link
                  href={`/quran/${nextChapter}`}
                  className="text-[var(--color-primary)] hover:underline text-sm"
                >
                  {copy.quran.nextSurah} →
                </Link>
            ) : (
              <span className="text-[var(--color-text-muted)]" />
            )}
          </div>
        </footer>
      </main>

      {/* Mobile Navigation */}
      {!isFocusMode && (
        <div className="quiet-controls fixed bottom-0 left-0 right-0 rounded-t-[20px] border-t border-[var(--color-border)] bg-[var(--color-surface)]/88 p-3 backdrop-blur-sm md:hidden safe-area-bottom">
          <div className="flex justify-between max-w-3xl mx-auto">
            {prevChapter ? (
                <Link
                  href={`/quran/${prevChapter}`}
                  className="text-[var(--color-primary)] text-sm flex items-center gap-1"
                >
                  ← {copy.quran.mobilePrev}
                </Link>
            ) : (
              <span />
            )}
            {nextChapter ? (
                <Link
                  href={`/quran/${nextChapter}`}
                  className="text-[var(--color-primary)] text-sm flex items-center gap-1"
                >
                  {copy.quran.mobileNext} →
                </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}

      <AudioPlayer />
    </div>
  );
}
