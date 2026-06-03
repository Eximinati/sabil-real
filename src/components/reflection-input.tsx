'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import { useReflection } from '@/lib/reflection-context';

interface ReflectionInputProps {
  lessonId: string;
  dayNumber: number;
  initialValue?: string;
}

export function ReflectionInput({ lessonId, dayNumber, initialValue = '' }: ReflectionInputProps) {
  const { text, status, updateText, save } = useReflection();
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const copy = useCopy();
  const { language } = useLanguage();

  useEffect(() => {
    if (status === 'idle') setSaving(false);
  }, [status]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const ok = await save();
    if (!ok) {
      toast.error(copy.reflectionInput.toastError);
    }
    setSaving(false);
  };

  const hasUrduText = /[\u0600-\u06FF]/.test(text);
  const isUrduDraft = language === 'ur' || hasUrduText;

  const statusLabel = (() => {
    if (saving || status === 'saving') return 'Saving...';
    if (status === 'saved') return copy.reflectionInput?.savedAction || 'Saved';
    if (status === 'error') return copy.reflectionInput.toastError;
    return null;
  })();

  return (
    <div className="reflection-card">
      <div className="mb-5 flex items-start gap-3 text-sm text-[var(--color-text-muted)]">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs text-[var(--color-accent)]">
          ✦
        </span>
        <p className="leading-relaxed tracking-wide">{copy.reflectionInput.helper}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => updateText(e.target.value)}
        placeholder={copy.reflectionInput.placeholder}
        className={`reflection-textarea journal-textarea min-h-[280px] w-full resize-y text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 hover:border-[var(--color-border)] focus:shadow-[inset_0_1px_4px_rgba(183,146,42,0.06)] ${
          isUrduDraft ? 'font-urdu text-[18px] leading-[2.15]' : 'text-[16px] leading-[2.1]'
        }`}
        dir={isUrduDraft ? 'rtl' : 'ltr'}
      />
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-text-muted)]/60 leading-relaxed">
          {isUrduDraft ? 'اپنے الفاظ میں لکھیں۔' : 'Write slowly and honestly. This space is private.'}
        </p>
        <div className="flex items-center gap-3">
          {statusLabel && (
            <span className={`text-xs ${
              status === 'error' ? 'text-red-500' : 'text-[var(--color-text-muted)]'
            }`}>
              {statusLabel}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary)] hover:shadow-[0_2px_12px_-4px_var(--color-primary)] disabled:opacity-40"
          >
            {saving || status === 'saving' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {copy.common.labels.saving}
              </>
            ) : status === 'saved' ? (
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
    </div>
  );
}
