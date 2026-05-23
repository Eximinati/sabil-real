'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ReflectionInputProps {
  lessonId: string;
  dayNumber: number;
  initialValue?: string;
}

export function ReflectionInput({ lessonId, dayNumber, initialValue = '' }: ReflectionInputProps) {
  const [text, setText] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!text.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/journey/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, dayNumber, reflectionText: text }),
      });
      if (res.ok) {
        setSaved(true);
        toast.success('Reflection saved');
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error('Could not save reflection');
      }
    } catch (e) {
      toast.error('Could not save reflection');
    }
    setSaving(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write whatever feels honest before Allah..."
        className="min-h-[180px] w-full resize-none rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text)] transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">A private space for sincerity, not performance.</p>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved quietly
            </>
          ) : (
            'Save reflection'
          )}
        </button>
      </div>
    </div>
  );
}
