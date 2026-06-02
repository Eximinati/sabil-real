'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/context';
import { useCopy } from '@/hooks/use-copy';
import { useReflection } from '@/lib/reflection-context';

interface LessonCompleteButtonProps {
  lessonId: string;
  dayNumber: number;
  isCompleted: boolean;
}

export function LessonCompleteButton({ lessonId, dayNumber, isCompleted }: LessonCompleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const copy = useCopy();
  const { language } = useLanguage();
  const { save, status: reflectionStatus } = useReflection();
  const [loading, setLoading] = useState(false);
  const isUrdu = language === 'ur';
  const uiCopy = isUrdu
    ? {
        completedTitle: 'آج کے لیے آپ کی جگہ محفوظ ہے۔',
        completedDescription: 'جب چاہیں اسی مطالعے پر واپس آ جائیں۔',
        returnToJourney: 'آج کے سفر پر واپس',
        success: 'آپ کی جگہ سفر میں محفوظ ہو گئی',
        failed: 'ابھی پیش رفت محفوظ نہیں ہو سکی',
        prompt: 'جب آپ وقفہ لینا چاہیں تو اپنی جگہ محفوظ کر لیں، اور کل پرسکون دل کے ساتھ جاری رکھیں۔',
        saveAria: 'آج کے لیے اپنی جگہ محفوظ کریں',
        saving: 'جگہ محفوظ ہو رہی ہے...',
        save: 'آج کے لیے اپنی جگہ محفوظ کریں',
      }
    : {
        completedTitle: 'Your place in the journey is saved for today.',
        completedDescription: 'Return to this reading whenever you need to sit with it again.',
        returnToJourney: "Return to today's journey",
        success: 'Your place in the journey was saved',
        failed: 'Could not save progress',
        prompt: 'When you are ready to pause, save your place and continue tomorrow with a settled heart.',
        saveAria: 'Save your place for today',
        saving: 'Saving your place...',
        save: 'Save your place for today',
      };

  if (isCompleted) {
    return (
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-center reading-section" role="status">
        <p className="text-base font-medium text-[var(--color-text)]">{uiCopy.completedTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {uiCopy.completedDescription}
        </p>
        <Link
          href="/journey"
          className="rtl-ready-arrow mt-5 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
          data-script-direction={isUrdu ? 'rtl' : 'ltr'}
        >
          {uiCopy.returnToJourney}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  const handleComplete = async () => {
    setLoading(true);
    try {
      const reflectionSaved = await save();
      if (!reflectionSaved) {
        toast.error(copy.reflectionInput.toastError);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/journey/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, dayNumber, action: 'complete' }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok) {
        toast.success(uiCopy.success);
        router.refresh();
      } else {
        toast.error(uiCopy.failed);
      }
    } catch (e) {
      toast.error(uiCopy.failed);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 md:p-6 reading-section">
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {uiCopy.prompt}
      </p>
      {reflectionStatus === 'error' && (
        <p className="mb-3 text-xs text-red-500">
          {copy.reflectionInput.toastError}
        </p>
      )}
      <button
        onClick={handleComplete}
        disabled={loading}
        className="quiet-controls w-full rounded-full bg-[var(--color-primary)] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-50"
        aria-label={uiCopy.saveAria}
      >
        {loading ? uiCopy.saving : uiCopy.save}
      </button>
    </div>
  );
}
