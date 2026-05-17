'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (step < 3) {
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
        console.error('Failed to complete onboarding:', e);
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
      console.error('Failed to skip onboarding:', e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F6F1] flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s <= step ? 'bg-[#2D6A4F]' : 'bg-[#E8E0D5]'
              }`}
            />
          ))}
        </div>

        {/* Step Indicator */}
        <p className="text-xs text-center text-[#6B7280] mb-6">Step {step} of 3</p>

        {/* Step Content */}
        <div className="bg-white border border-[#E8E0D5] rounded-2xl p-8">
          {step === 1 && (
            <>
              <p className="font-arabic text-[32px] text-[#B7922A] text-center" dir="rtl">السلام عليكم</p>
              <h1 className="text-[24px] font-semibold text-[#1A1A1A] text-center mt-2">Welcome to Sabil</h1>
              <p className="text-[#6B7280] text-center max-w-sm mx-auto mt-4 leading-relaxed">
                Sabil is your guided journey through Islam — one day, one lesson, one reflection at a time.
              </p>
              <p className="text-[#6B7280] text-center max-w-sm mx-auto mt-2 leading-relaxed">
                There are no feeds, no debates, no distractions. Just you and your learning.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[24px] font-semibold text-[#1A1A1A] text-center">How Sabil Works</h1>
              <div className="mt-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2D6A4F] text-white font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-medium">Daily Lessons</p>
                    <p className="text-[#6B7280] text-sm">Each day brings a new topic with Quran verses, explanations, and reflection.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2D6A4F] text-white font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-medium">Write Your Reflections</p>
                    <p className="text-[#6B7280] text-sm">Capture your thoughts, questions, and insights. Return to them anytime.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2D6A4F] text-white font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-medium">Go At Your Pace</p>
                    <p className="text-[#6B7280] text-sm">20 minutes a day. No pressure. Unlock the next lesson when you&apos;re ready.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[24px] font-semibold text-[#1A1A1A] text-center">Choose Your Translation</h1>
              <p className="text-[#6B7280] text-center mt-2">
                This will be your default translation throughout the app. You can change it anytime in Settings.
              </p>
              <div className="mt-6 p-4 bg-[#F0F9F4] rounded-xl border border-[#2D6A4F]/20">
                <p className="text-[#2D6A4F] font-medium">Muhammad Taqi-ud-Din al-Hilali & Muhammad Muhsin Khan</p>
                <p className="text-[#6B7280] text-sm mt-1">Clear, widely-used translation</p>
              </div>
              <p className="text-[#6B7280] text-sm text-center mt-4">
                You can explore other translations in Settings later.
              </p>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#E8E0D5]">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-[#6B7280] hover:text-[#1A1A1A] text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-[#2D6A4F] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1B4332] disabled:opacity-50"
            >
              {loading ? 'Loading...' : step === 3 ? 'Start Journey' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}