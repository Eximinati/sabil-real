'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCopy, useI18nText } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import { csrfHeader } from '@/lib/csrf-client';

export default function OnboardingPage() {
  const router = useRouter();
  const copy = useCopy();
  const { language } = useLanguage();
  const { interpolate } = useI18nText();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const toast = useToast();
  const isUrdu = language === 'ur';

  const handleNext = async () => {
    if (step < 3) {
      setDirection('forward');
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
          body: JSON.stringify({ completed: true, languageCode: language }),
        });
        if (!response.ok) {
          throw new Error('Unable to complete onboarding');
        }
        router.push('/journey');
      } catch {
        toast.error(copy.auth.errors.unableCompleteSetup);
        setLoading(false);
      }
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ completed: true, languageCode: language }),
      });
      if (!response.ok) {
        throw new Error('Unable to complete onboarding');
      }
      router.push('/journey');
    } catch {
      toast.error(copy.auth.errors.unableCompleteSetup);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[580px]">
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

        <p className="text-xs text-center text-[var(--color-text-muted)] mb-6">
          {interpolate(copy.auth.onboarding.stepLabel, { step })}
        </p>

        <div className="bg-[var(--color-surface)]/88 border border-[var(--color-border)] rounded-[28px] p-6 md:p-8" data-script-direction={isUrdu ? 'rtl' : 'ltr'}>
          <div className="transition-opacity duration-200">
            {step === 1 && (
              <>
                <p className="font-arabic text-[32px] text-[var(--color-accent)] text-center" dir="rtl">السلام عليكم</p>
                <h1 className="text-[24px] font-semibold text-[var(--color-text)] text-center mt-2">{copy.auth.onboarding.welcomeTitle}</h1>
                <p
                  className={`text-[var(--color-text-muted)] text-center max-w-sm mx-auto mt-4 ${
                    isUrdu ? 'font-urdu text-[18px] leading-[2.2]' : 'text-[16px] leading-[1.95]'
                  }`}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                  data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                >
                  {copy.auth.onboarding.welcomeBody1}
                </p>
                <p
                  className={`text-[var(--color-text-muted)] text-center max-w-sm mx-auto mt-3 ${
                    isUrdu ? 'font-urdu text-[18px] leading-[2.2]' : 'text-[16px] leading-[1.95]'
                  }`}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                  data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                >
                  {copy.auth.onboarding.welcomeBody2}
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-[24px] font-semibold text-[var(--color-text)] text-center">{copy.auth.onboarding.flowTitle}</h1>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 p-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-medium flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-medium">{copy.auth.onboarding.flowOneTitle}</p>
                      <p
                        className={`text-[var(--color-text-muted)] mt-1 ${
                          isUrdu ? 'font-urdu text-[16px] leading-[2.1]' : 'text-sm leading-[1.85]'
                        }`}
                        dir={isUrdu ? 'rtl' : 'ltr'}
                        data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                      >
                        {copy.auth.onboarding.flowOneBody}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 p-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-medium flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-medium">{copy.auth.onboarding.flowTwoTitle}</p>
                      <p
                        className={`text-[var(--color-text-muted)] mt-1 ${
                          isUrdu ? 'font-urdu text-[16px] leading-[2.1]' : 'text-sm leading-[1.85]'
                        }`}
                        dir={isUrdu ? 'rtl' : 'ltr'}
                        data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                      >
                        {copy.auth.onboarding.flowTwoBody}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 p-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-medium flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-medium">{copy.auth.onboarding.flowThreeTitle}</p>
                      <p
                        className={`text-[var(--color-text-muted)] mt-1 ${
                          isUrdu ? 'font-urdu text-[16px] leading-[2.1]' : 'text-sm leading-[1.85]'
                        }`}
                        dir={isUrdu ? 'rtl' : 'ltr'}
                        data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                      >
                        {copy.auth.onboarding.flowThreeBody}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-[24px] font-semibold text-[var(--color-text)] text-center">{copy.auth.onboarding.chooseTranslationTitle}</h1>
                <p
                  className={`text-[var(--color-text-muted)] text-center mt-2 ${
                    isUrdu ? 'font-urdu text-[17px] leading-[2.15]' : 'text-[16px] leading-[1.95]'
                  }`}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                  data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                >
                  {copy.auth.onboarding.chooseTranslationBody}
                </p>
                <div className="mt-6 p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-primary)]/20">
                  <p className="text-[var(--color-primary)] font-medium">{copy.auth.onboarding.suggestedTranslationTitle}</p>
                  <p
                    className={`text-[var(--color-text-muted)] mt-1 ${
                      isUrdu ? 'font-urdu text-[16px] leading-[2.05]' : 'text-sm leading-[1.8]'
                    }`}
                    dir={isUrdu ? 'rtl' : 'ltr'}
                    data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                  >
                    {copy.auth.onboarding.suggestedTranslationDescription}
                  </p>
                </div>
                <p
                  className={`text-[var(--color-text-muted)] text-center mt-4 ${
                    isUrdu ? 'font-urdu text-[16px] leading-[2.05]' : 'text-sm leading-[1.8]'
                  }`}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                  data-script-direction={isUrdu ? 'rtl' : 'ltr'}
                >
                  {copy.auth.onboarding.translationBody2}
                </p>
              </>
            )}
          </div>

          <div className="quiet-controls flex justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
            >
              {copy.auth.onboarding.skip}
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading
                ? copy.auth.onboarding.loading
                : step === 3
                  ? copy.auth.onboarding.startJourney
                  : copy.auth.onboarding.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
