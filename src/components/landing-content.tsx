'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import {
  getDefaultTranslationIdForLanguage,
  normalizeTranslationId,
} from '@/lib/user-preferences';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

interface PreviewDay {
  day: number;
  title: string;
  topic: string;
}

interface LandingContentProps {
  staticChapters: Chapter[];
  staticBismillah: string;
  staticQuran65: string;
  previewDays: PreviewDay[];
}

interface FetchedData {
  chapters: Chapter[];
  bismillah: string;
  quran65: string;
}

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "A guided path",
    description: "Gentle daily guidance through Quran, Seerah, and core Islamic understanding without overwhelm."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Reflection for the heart",
    description: "Reflection prompts and journaling that help what you read settle into your heart."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Lived with sincerity",
    description: "Move beyond information into sincere practice, with gentle application in daily life."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Beginner friendly",
    description: "Start from where you are. No prior knowledge is assumed, and nothing is made to feel intimidating."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "One day at a time",
    description: "A longer journey that unfolds slowly, so each day feels approachable and meaningful."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Return whenever you need",
    description: "Pause, revisit, and continue gently. Your place is remembered without pressure."
  },
];

export function LandingContent({ staticChapters, staticBismillah, staticQuran65, previewDays }: LandingContentProps) {
  const copy = useCopy();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [data, setData] = useState<FetchedData>({
    chapters: staticChapters,
    bismillah: staticBismillah,
    quran65: staticQuran65,
  });

  const urduFeatureText = [
    {
      title: 'رہنمائی والا راستہ',
      description: 'قرآن، سیرت اور بنیادی اسلامی فہم کے ساتھ نرم روزانہ رہنمائی، بغیر بوجھ کے۔',
    },
    {
      title: 'دل کے لیے تامل',
      description: 'تامل کے سوالات اور نوٹس جو مطالعے کو دل میں اترنے میں مدد دیتے ہیں۔',
    },
    {
      title: 'اخلاص کے ساتھ عمل',
      description: 'صرف معلومات سے آگے بڑھ کر اخلاص اور روزمرہ کے نرم عملی قدموں تک آئیں۔',
    },
    {
      title: 'نوآموز دوست',
      description: 'جہاں سے ہیں وہیں سے شروع کریں۔ پیشگی علم ضروری نہیں، اور کچھ بھی ڈرانے والا نہیں بنایا گیا۔',
    },
    {
      title: 'ایک دن میں ایک قدم',
      description: 'ایک طویل سفر جو آہستگی سے کھلتا ہے تاکہ ہر دن قابلِ عمل اور بامعنی لگے۔',
    },
    {
      title: 'جب چاہیں واپس آئیں',
      description: 'وقفہ کریں، دوبارہ پڑھیں، اور نرمی سے جاری رکھیں۔ آپ کی جگہ بغیر دباؤ محفوظ رہتی ہے۔',
    },
  ];

  const features = isUrdu
    ? FEATURES.map((feature, index) => ({
        ...feature,
        title: urduFeatureText[index]?.title || feature.title,
        description: urduFeatureText[index]?.description || feature.description,
      }))
    : FEATURES;

  const identityCards = isUrdu
    ? {
        firstTitle: 'نرم رہنمائی',
        firstBody: 'روزانہ اسباق جو اسلام کے قریب لاتے ہیں، بغیر الجھن اور بغیر جلدی کے۔',
        secondTitle: 'تامل اور عمل',
        secondBody: 'مطالعہ تامل، اخلاص اور روزمرہ کے چھوٹے عملی قدموں میں بدلتا ہے۔',
        thirdTitle: 'ایک ثابت قدم ساتھی',
        thirdBody: 'یہ سفر ایمان کو نمبروں میں بدلے بغیر خاموشی سے آپ کے ساتھ رہتا ہے۔',
      }
    : {
        firstTitle: 'Gentle guidance',
        firstBody: 'Daily lessons that help you approach Islam without feeling lost or rushed.',
        secondTitle: 'Reflection and practice',
        secondBody: 'Reading opens into reflection, sincerity, and small lived steps.',
        thirdTitle: 'A steady companion',
        thirdBody: 'The journey stays with you quietly, without reducing faith to metrics.',
      };

  const localizedPreviewDays = isUrdu
    ? [
        { day: 1, title: 'ہم یہاں کیوں ہیں؟', topic: 'مقصد اور تخلیق' },
        { day: 2, title: 'اللہ کون ہے؟', topic: 'اسماء و صفات' },
        { day: 3, title: 'پہلی وحی', topic: 'نبوت' },
        { day: 4, title: 'قرآن کیا ہے؟', topic: 'کتابِ ہدایت' },
        { day: 5, title: 'حضورِ قلب کے ساتھ کیسے پڑھیں؟', topic: 'ذہنی حضوری' },
        { day: 6, title: 'نماز کا مقصد', topic: 'عبادت' },
        { day: 7, title: 'توکل - اللہ پر بھروسہ', topic: 'بھروسہ' },
      ]
    : previewDays;

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      
      if (user) {
        const { data: prefs } = await supabaseBrowser
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();
        
        if (!prefs?.onboarding_completed) {
          window.location.href = '/onboarding';
          return;
        }
        
        window.location.href = '/journey';
        return;
      }
      
      try {
        const { data: authData } = await supabaseBrowser.auth.getUser();
        let translationId = getDefaultTranslationIdForLanguage(language);

        if (authData.user) {
          const { data: prefs } = await supabaseBrowser
            .from('user_preferences')
            .select('translation_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          translationId = normalizeTranslationId(
            prefs?.translation_id,
            getDefaultTranslationIdForLanguage(language)
          );
        }

        const [chaptersRes, bismillahRes, quran65Res] = await Promise.all([
          fetch('/api/chapters', { next: { revalidate: 3600 } }),
          fetch(`/api/verses/by_key/1:1?translation=${translationId}`, { next: { revalidate: 3600 } }),
          fetch(`/api/verses/by_key/65:3?translation=${translationId}`, { next: { revalidate: 3600 } }),
        ]);

        const chaptersData = await chaptersRes.json();
        const bismillahData = await bismillahRes.json();
        const quran65Data = await quran65Res.json();

        setData({
          chapters: chaptersData.chapters?.slice(0, 2) || staticChapters,
          bismillah: bismillahData?.verse?.text_uthmani || staticBismillah,
          quran65: quran65Data?.verse?.text_uthmani || staticQuran65,
        });
      } catch {
        // Keep static fallback
      }
    }

    checkAuthAndFetch();
  }, [language]);

  const { bismillah, quran65 } = data;

  return (
    <>
      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex justify-between items-center px-6 md:px-10 py-6 max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text)] font-semibold text-xl">Sabil</span>
            <span className="font-arabic text-[var(--color-accent)] text-sm" dir="rtl">سبيل</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/login" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm">{copy.landing.nav.signIn}</Link>
            <Link href="/register" className="bg-[var(--color-accent)] text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              {copy.landing.nav.beginGently}
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
          <div className="max-w-[680px] text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)]/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
              <span className="text-xs text-[var(--color-accent)] font-medium">{copy.landing.hero.badge}</span>
            </div>
            
            <p className="font-arabic text-[24px] md:text-[28px] text-center text-[var(--color-accent)] mb-3" dir="rtl">
              {bismillah}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] italic mb-8">
              {copy.landing.hero.bismillahTranslation}
            </p>

            <div className="w-16 h-px bg-[var(--color-accent)]/40 mx-auto my-8" />

            <h1 className="text-[36px] md:text-[52px] font-bold leading-tight">
              <span className="text-[var(--color-text)]">{copy.landing.hero.walkGently}</span>
              <span className="block text-[var(--color-accent)]">{copy.landing.hero.towardAllah}</span>
            </h1>

            <p className="text-[16px] md:text-[18px] text-[var(--color-text-muted)] leading-relaxed text-center mt-6 max-w-[520px] mx-auto">
              {copy.landing.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
              <Link 
                href="/register"
                className="bg-[var(--color-accent)] text-white font-medium px-8 py-4 rounded-xl hover:opacity-90 transition-all text-lg"
              >
                {copy.landing.nav.beginGently}
              </Link>
              <Link 
                href="/login"
                className="border border-[var(--color-border)] text-[var(--color-text)] px-8 py-4 rounded-xl hover:border-[var(--color-accent)] transition-colors"
              >
                {copy.landing.hero.continueJourney}
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{copy.landing.hero.minutesPerDay}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{copy.landing.hero.totalDays}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{copy.landing.hero.beginnerFriendly}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MORE THAN READING SECTION */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.06),transparent_50%)]" />
        <div className="max-w-[900px] mx-auto relative">
          <div className="text-center mb-12">
            <span className="text-[var(--color-accent)] text-sm font-medium">{copy.landing.sections.whySabilExists}</span>
            <h2 className="text-[28px] md:text-[40px] font-bold text-[var(--color-text)] mt-3">
              {copy.landing.sections.moreThanConsumingContent}
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg mt-4 max-w-[550px] mx-auto">
              {copy.landing.sections.whyDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 text-center hover:border-[var(--color-accent)]/40 transition-all group">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-3 group-hover:text-[var(--color-accent)] transition-colors">{identityCards.firstTitle}</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                {identityCards.firstBody}
              </p>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 text-center hover:border-[var(--color-accent)]/40 transition-all group">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-3 group-hover:text-[var(--color-accent)] transition-colors">{identityCards.secondTitle}</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                {identityCards.secondBody}
              </p>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 text-center hover:border-[var(--color-accent)]/40 transition-all group">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-3 group-hover:text-[var(--color-accent)] transition-colors">{identityCards.thirdTitle}</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                {identityCards.thirdBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS SABIL SECTION */}
      <section className="py-20 md:py-28 px-4 bg-[var(--color-surface)]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[28px] md:text-[36px] font-bold text-[var(--color-text)] mb-4">
              {copy.landing.sections.whatIsSabil}
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-[600px] mx-auto">
              {copy.landing.sections.whatDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-6 hover:border-[var(--color-accent)]/50 hover:shadow-lg hover:shadow-[var(--color-accent)]/5 transition-all"
              >
                <div className="w-12 h-12 mb-4 text-[var(--color-accent)]">
                  {feature.icon}
                </div>
                <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.05),transparent_50%)]" />
        <div className="max-w-[800px] mx-auto relative">
          <div className="text-center mb-14">
            <span className="text-[var(--color-accent)] text-sm font-medium">{copy.landing.sections.howJourneyUnfolds}</span>
            <h2 className="text-[28px] md:text-[40px] font-bold text-[var(--color-text)] mt-3">
              {copy.landing.sections.simpleRhythm}
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8 md:gap-4">
            <div className="flex-1 text-center relative">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-accent)]">1</span>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2">{copy.landing.rhythm.read}</h3>
              <p className="text-[var(--color-text-muted)] text-sm">{copy.landing.rhythm.readBody}</p>
              <div className="hidden md:block absolute -right-6 top-10">
                <svg className="w-8 h-8 text-[var(--color-accent)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            <div className="flex-1 text-center relative">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-accent)]">2</span>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2">{copy.landing.rhythm.reflect}</h3>
              <p className="text-[var(--color-text-muted)] text-sm">{copy.landing.rhythm.reflectBody}</p>
              <div className="hidden md:block absolute -right-6 top-10">
                <svg className="w-8 h-8 text-[var(--color-accent)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-accent)]">3</span>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2">{copy.landing.rhythm.return}</h3>
              <p className="text-[var(--color-text-muted)] text-sm">{copy.landing.rhythm.returnBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNEY PREVIEW SECTION */}
      <section className="py-20 md:py-28 px-4 bg-[var(--color-bg)]">
        <div className="max-w-[700px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[28px] md:text-[36px] font-bold text-[var(--color-text)] mb-4">
              {copy.landing.sections.yourFirstWeek}
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              {copy.landing.sections.firstWeekDescription}
            </p>
          </div>

          <div className="space-y-3">
            {localizedPreviewDays.map((day) => (
              <div 
                key={day.day} 
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4 hover:border-[var(--color-accent)]/30 transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70 text-white font-medium">
                  {day.day}
                </div>
                <div className="flex-1">
                  <p className="text-[var(--color-text)] font-medium text-base">{day.title}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs rounded-full font-medium">
                    {day.topic}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--color-text-muted)] text-sm">{isUrdu ? 'تقریباً 20 منٹ' : '~20 min'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              href="/register"
              className="bg-[var(--color-accent)] text-white font-medium px-10 py-4 rounded-xl inline-block hover:opacity-90 transition-opacity text-lg"
            >
              {copy.common.actions.startJourney}
            </Link>
            <p className="text-[var(--color-text-muted)] text-sm mt-3">
              {copy.landing.sections.noCardRequired}
            </p>
          </div>
        </div>
      </section>

      {/* QUOTE SECTION */}
      <section className="py-20 md:py-28 px-4 bg-[var(--color-surface)]">
        <div className="max-w-[600px] mx-auto text-center">
          <p className="font-arabic text-[24px] md:text-[32px] text-[var(--color-accent)]" dir="rtl">{quran65}</p>
          <p className="text-[var(--color-text-muted)] text-base italic mt-4">{copy.landing.sections.quoteTranslation}</p>
          <p className="text-[var(--color-text-muted)]/60 text-sm mt-1">{isUrdu ? '(قرآن 65:3)' : '(Quran 65:3)'}</p>
          
          <div className="mt-10 p-6 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border)]">
            <p className="text-[var(--color-text)] text-lg font-medium">
              {copy.landing.sections.quietPlaceTitle}
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mt-2">
              {copy.landing.sections.quietPlaceBody}
            </p>
          </div>
          
          <Link 
              href="/register"
              className="inline-block mt-8 bg-[var(--color-accent)] text-white font-medium px-12 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
            >
              {copy.landing.nav.beginGently}
            </Link>
          </div>
        </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text)] font-semibold">Sabil</span>
            <span className="font-arabic text-[var(--color-accent)] text-sm" dir="rtl">سبيل</span>
            <span className="text-[var(--color-text-muted)] text-xs ml-2">| {copy.landing.sections.footerTagline}</span>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm">
            {copy.landing.sections.footerLine}
          </p>
        </div>
      </footer>
    </>
  );
}
