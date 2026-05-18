'use client';

import { useAudioPlayerContext } from './audio-player-provider';
import { reciters, SPEEDS } from '@/data/reciters';
import { useState } from 'react';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
  const {
    state,
    toggle,
    seek,
    nextVerse,
    previousVerse,
    setPlaybackSpeed,
    resetPlayer,
    replaySurah,
    audioFiles,
  } = useAudioPlayerContext();
  const [minimized, setMinimized] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const currentReciter = state.reciterId
    ? reciters.find(r => r.id === state.reciterId)
    : null;

  if (!state.currentVerseKey && !state.isCompleted) {
    return null;
  }

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const hasNext = audioFiles && state.currentVerseIndex < audioFiles.length - 1;
  const hasPrev = audioFiles && state.currentVerseIndex > 0;

  const handleClose = () => {
    resetPlayer();
  };

  if (state.isCompleted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:left-[240px]">
        <div className="bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] safe-area-bottom">
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="text-center">
              <p className="text-[var(--color-text)] text-lg font-medium mb-1">
                Surah Complete
              </p>
              {currentReciter && (
                <p className="text-[var(--color-text-muted)] text-sm mb-4">
                  Recited by {currentReciter.name}
                </p>
              )}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={replaySurah}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Replay Surah
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-full hover:bg-[var(--color-border)]/50 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:left-[240px]">
      <div className="bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] safe-area-bottom rounded-t-2xl md:rounded-t-3xl">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            {audioFiles && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={previousVerse}
                  disabled={!hasPrev || state.isLoading}
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-border)]/50 disabled:opacity-30 transition-colors"
                  aria-label="Previous verse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextVerse}
                  disabled={!hasNext || state.isLoading}
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-border)]/50 disabled:opacity-30 transition-colors"
                  aria-label="Next verse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={toggle}
              disabled={state.isLoading}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isLoading ? (
                <svg className="w-5 h-5 md:w-6 md:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : state.isPlaying ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm md:text-base font-medium text-[var(--color-text)] truncate">
                    Verse {state.currentVerseKey?.split(':')[1]}
                  </p>
                  {audioFiles && state.totalVerses > 0 && (
                    <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                      ({state.currentVerseIndex + 1}/{state.totalVerses})
                    </span>
                  )}
                </div>
                {currentReciter && (
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)] ml-2 flex-shrink-0 hidden md:block">
                    {currentReciter.name}
                  </p>
                )}
              </div>

              {!minimized && (
                <>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={state.duration || 100}
                      value={state.currentTime}
                      onChange={(e) => seek(parseFloat(e.target.value))}
                      disabled={state.isLoading}
                      className="w-full h-1.5 md:h-2 bg-[var(--color-border)] rounded-full appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 md:[&::-webkit-slider-thumb]:w-4 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary) ${progress}%, var(--color-border) ${progress}%)`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between mt-1 md:mt-2">
                    <span className="text-xs md:text-sm text-[var(--color-text-muted)]">
                      {formatTime(state.currentTime)}
                    </span>
                    <span className="text-xs md:text-sm text-[var(--color-text-muted)]">
                      {formatTime(state.duration)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2 py-1 text-xs md:text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 rounded-lg transition-colors"
                >
                  {state.playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
                    {SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`px-4 py-2 text-sm hover:bg-[var(--color-border)]/50 transition-colors w-full text-left ${
                          state.playbackSpeed === speed
                            ? 'text-[var(--color-primary)] font-medium'
                            : 'text-[var(--color-text)]'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 rounded-lg transition-colors"
                aria-label={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 rounded-lg transition-colors"
                aria-label="Close player"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}