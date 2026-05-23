'use client';

import { useState, useRef, useEffect } from 'react';

interface Reciter {
  id: number;
  name: string;
}

interface JourneyReciterSelectorProps {
  currentReciterId: number;
  onReciterChange: (id: number) => void;
}

const reciters: Reciter[] = [
  { id: 5, name: 'Mishary Rashid Alafasy' },
  { id: 7, name: 'Abdul Basit' },
  { id: 10, name: 'Mohamed Siddiq El-Minshawi' },
  { id: 11, name: 'Abdurrahman As-Sudais' },
  { id: 16, name: 'Mahmoud Khalil Al-Husary' },
];

export function JourneyReciterSelector({ 
  currentReciterId,
  onReciterChange,
}: JourneyReciterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const currentReciter = reciters.find(r => r.id === currentReciterId) || reciters[0];
  const displayName = currentReciter.name.length > 22 
    ? currentReciter.name.slice(0, 22) + '...' 
    : currentReciter.name;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-primary)]/40"
        aria-label="Change reciter"
      >
        <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="hidden max-w-[110px] truncate sm:inline">{displayName}</span>
        <span className="sm:hidden">Reciter</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-20">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            ref={modalRef}
            className="relative mx-4 w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reciter-modal-title"
          >
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="reciter-modal-title" className="text-lg font-semibold text-[var(--color-text)]">
                    Choose a reciter
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Audio is optional. Keep only the voice that helps you stay present.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[var(--color-border)]/50 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-2 max-h-[50vh] overflow-y-auto">
              {reciters.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onReciterChange(r.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    r.id === currentReciterId
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'
                  }`}
                >
                  <span className="text-sm font-medium">{r.name}</span>
                  {r.id === currentReciterId && (
                    <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
