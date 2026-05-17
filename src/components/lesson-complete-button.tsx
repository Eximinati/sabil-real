'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LessonCompleteButtonProps {
  lessonId: string;
  dayNumber: number;
  isCompleted: boolean;
}

export function LessonCompleteButton({ lessonId, dayNumber, isCompleted }: LessonCompleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center gap-2 text-[#2D6A4F] py-4">
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
      await fetch('/api/journey/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, dayNumber, action: 'complete' }),
      });
      router.refresh();
    } catch (e) {
      console.error('Failed to complete lesson:', e);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="w-full bg-[#2D6A4F] text-white rounded-xl py-4 text-base font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50"
    >
      {loading ? 'Saving...' : 'Mark as Complete'}
    </button>
  );
}