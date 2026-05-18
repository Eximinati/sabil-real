'use client';

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
      <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] py-4" role="status">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-base font-medium">You have completed this lesson</span>
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
        toast.success('Lesson marked as complete');
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
    <button
      onClick={handleComplete}
      disabled={loading}
      className="w-full bg-[var(--color-primary)] text-white rounded-xl py-4 text-base font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50"
      aria-label="Mark lesson as complete"
    >
      {loading ? 'Saving...' : 'Mark as Complete'}
    </button>
  );
}