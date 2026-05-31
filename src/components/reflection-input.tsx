'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

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
  const copy = useCopy();
  const { language } = useLanguage();

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
        toast.success(copy.reflectionInput.toastSaved);
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(copy.reflectionInput.toastError);
      }
    } catch (e) {
      toast.error(copy.reflectionInput.toastError);
    }
    setSaving(false);
  };

  const hasUrduText = /[\u0600-\u06FF]/.test(text);
  const isUrduDraft = language === 'ur' || hasUrduText;

  return (
    <div className="rounded-3xl border border-[var(--color-border)]/60 bg-gradient-to-b from-[var(--color-surface)]/95 to-[var(--color-bg)]/80 p-5 shadow-[0_8px_32px_-20px_rgba(26,26,26,0.25)] md:p-6">
      <div className="mb-4 flex items-center gap-2.5 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg)]/70 text-xs tracking-wide">
          ✦
        </span>
        <p className="tracking-[0.01em]">{copy.reflectionInput.helper}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={copy.reflectionInput.placeholder}
        className={`min-h-[260px] md:min-h-[240px] w-full resize-y rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-bg)]/55 p-5 md:p-6 text-[var(--color-text)] transition-all placeholder:text-[var(--color-text-muted)]/60 hover:border-[var(--color-border)] focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 ${
          isUrduDraft ? 'font-urdu text-[18px] leading-[2.15]' : 'text-[16px] leading-[2]'
        }`}
        dir={isUrduDraft ? 'rtl' : 'ltr'}
      />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-text-muted)]/70 italic">
          {isUrduDraft ? 'اپنے الفاظ میں لکھیں۔' : 'Write slowly and honestly. This space is private.'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)]/90 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary)] disabled:opacity-40"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {copy.common.labels.saving}
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {copy.reflectionInput.savedAction}
            </>
          ) : (
            copy.reflectionInput.saveAction
          )}
        </button>
      </div>
    </div>
  );
}
