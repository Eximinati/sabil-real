'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const handleNext = async () => {
    if (step < 3) {
      setDirection('forward');
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        });
        router.push('/journey');
      } catch (e) {
        // Silent fail
      }
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      router.push('/journey');
    } catch (e) {
      // Silent fail
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-[var(--color-primary)]">Sabil</h1>
          <p className="font-arabic text-[var(--color-accent)] text-lg mt-1" dir="rtl">سبيل</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                s <= step ? 'w-6 bg-[var(--color-primary)]' : 'w-2.5 bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-center text-[var(--color-text-muted)] mb-6">Step {step} of 3</p>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <div className="transition-opacity duration-200">
            {step === 1 && (
              <>
                <p className="font-arabic text-[32px] text-[var(--color-accent)] text-center" dir="rtl">السلام عليكم</p>
                <h1 className="text-[24px] font-semibold text-[var(--color-text)] text-center mt-2">Welcome to Sabil</h1>
                <p className="text-[var(--color-text-muted)] text-center max-w-sm mx-auto mt-4 leading-relaxed">
                  Sabil is your guided journey through Islam — one day, one lesson, one reflection at a time.
                </p>
                <p className="text-[var(--color-text-muted)] text-center max-w-sm mx-auto mt-2 leading-relaxed">
                  There are no feeds, no debates, no distractions. Just you and your learning.
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-[24px] font-semibold text-[var(--color-text)] text-center">How Sabil Works</h1>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-medium flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-medium">Daily Lessons</p>
                      <p className="text-[var(--color-text-muted)] text-sm">Each day brings a new topic with Quran verses, explanations, and reflection.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-medium flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-medium">Write Your Reflections</p>
                      <p className="text-[var(--color-text-muted)] text-sm">Capture your thoughts, questions, and insights. Return to them anytime.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-medium flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-medium">Go At Your Pace</p>
                      <p className="text-[var(--color-text-muted)] text-sm">20 minutes a day. No pressure. Unlock the next lesson when you&apos;re ready.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-[24px] font-semibold text-[var(--color-text)] text-center">Choose Your Translation</h1>
                <p className="text-[var(--color-text-muted)] text-center mt-2">
                  This will be your default translation throughout the app. You can change it anytime in Settings.
                </p>
                <div className="mt-6 p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-primary)]/20">
                  <p className="text-[var(--color-primary)] font-medium">Muhammad Taqi-ud-Din al-Hilali & Muhammad Muhsin Khan</p>
                  <p className="text-[var(--color-text-muted)] text-sm mt-1">Clear, widely-used translation</p>
                </div>
                <p className="text-[var(--color-text-muted)] text-sm text-center mt-4">
                  You can explore other translations in Settings later.
                </p>
              </>
            )}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : step === 3 ? 'Start Journey' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}