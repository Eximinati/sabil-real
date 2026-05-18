'use client';

import { useState, useEffect } from 'react';
import { reciters, defaultReciterId } from '@/data/reciters';
import { getStoredReciterId, setStoredReciterId } from '@/hooks/use-audio-player';

interface ReciterSelectorProps {
  value?: number;
  onChange?: (reciterId: number) => void;
}

export function ReciterSelector({ value, onChange }: ReciterSelectorProps) {
  const [selectedId, setSelectedId] = useState<number>(defaultReciterId);

  useEffect(() => {
    const stored = getStoredReciterId();
    if (stored) {
      setSelectedId(stored);
    }
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedId(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = parseInt(e.target.value, 10);
    setSelectedId(newId);
    setStoredReciterId(newId);
    onChange?.(newId);
  };

  return (
    <div className="flex items-center gap-2">
      <svg
        className="w-4 h-4 text-[var(--color-text-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
      <select
        value={selectedId}
        onChange={handleChange}
        className="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer"
      >
        {reciters.map((reciter) => (
          <option key={reciter.id} value={reciter.id}>
            {reciter.name}
          </option>
        ))}
      </select>
    </div>
  );
}