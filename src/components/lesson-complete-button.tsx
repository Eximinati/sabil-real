'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface LessonCompleteButtonProps {
  lessonId: string;
  dayNumber: number;
  isCompleted: boolean;
}

export function LessonCompleteButton({ lessonId, dayNumber, isCompleted }: LessonCompleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (isCompleted) {
    return (
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-center" role="status">
        <p className="text-base font-medium text-[var(--color-text)]">Your place in the journey is saved for today.</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Return to this reading whenever you need to sit with it again.
        </p>
        <Link
          href="/journey"
          className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
        >
          Return to today&apos;s journey
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
      const res = await fetch('/api/journey/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, dayNumber, action: 'complete' }),
      });
      if (res.ok) {
        toast.success('Your place in the journey was saved');
        router.refresh();
      } else {
        toast.error('Could not save progress');
      }
    } catch (e) {
      toast.error('Could not save progress');
    }
    setLoading(false);
  };

  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 md:p-6">
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        When you are ready to pause, save your place and continue tomorrow with a settled heart.
      </p>
      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full rounded-full bg-[var(--color-primary)] py-4 text-base font-medium text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-50"
        aria-label="Save your place for today"
      >
        {loading ? 'Saving your place...' : 'Save your place for today'}
      </button>
    </div>
  );
}
