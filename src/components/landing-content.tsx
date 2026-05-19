'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

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

export function LandingContent({ staticChapters, staticBismillah, staticQuran65, previewDays }: LandingContentProps) {
  const [data, setData] = useState<FetchedData>({
    chapters: staticChapters,
    bismillah: staticBismillah,
    quran65: staticQuran65,
  });
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    
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
        const [chaptersRes, bismillahRes, quran65Res] = await Promise.all([
          fetch('/api/chapters', { next: { revalidate: 3600 } }),
          fetch('/api/verses/by_key/1:1?translation=203', { next: { revalidate: 3600 } }),
          fetch('/api/verses/by_key/65:3?translation=203', { next: { revalidate: 3600 } }),
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
      
      setLoading(false);
    }

    checkAuthAndFetch();
  }, []);

  const { chapters, bismillah, quran65 } = data;

  return (
    <>
      <section className="min-h-screen flex flex-col">
        <div className="flex justify-between items-center px-8 py-6 max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text)] font-semibold text-xl">Sabil</span>
            <span className="font-arabic text-[var(--color-accent)] text-sm" dir="rtl">سبيل</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm">Sign In</Link>
            <Link href="/register" className="bg-[var(--color-accent)] text-white px-5 py-2 rounded-lg font-medium hover:bg-[var(--color-primary-hover)]">
              Begin
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-[600px] text-center">
            <p className="text-xs tracking-[0.2em] text-[var(--color-accent)] uppercase mb-6">SABIL — GUIDED ISLAM JOURNEY</p>
            
            <p className="font-arabic text-[28px] text-center text-[var(--color-accent)] mb-2" dir="rtl">
              {bismillah}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] italic mb-8">
              In the name of Allah, the Most Compassionate, the Most Merciful
            </p>

            <div className="w-16 h-px bg-[var(--color-accent)]/40 mx-auto my-8" />

            <h1 className="text-[52px] font-bold leading-tight">
              <span className="text-[var(--color-text)] block">One step a day.</span>
              <span className="text-[var(--color-accent)] italic block">No overwhelm.</span>
            </h1>

            <p className="text-[16px] text-[var(--color-text-muted)] leading-relaxed text-center mt-6 max-w-[480px] mx-auto">
              A structured, gentle journey through the Qur&apos;an, Seerah, and reflection — without feeds, debates, or distractions.
            </p>

            <div className="flex justify-center gap-3 mt-8">
              <Link 
                href="/register"
                className="bg-[var(--color-accent)] text-white font-medium px-8 py-3 rounded-lg hover:bg-[var(--color-primary-hover)]"
              >
                Start your journey
              </Link>
              <Link 
                href="/login"
                className="border border-[var(--color-border)] text-[var(--color-text-muted)] px-8 py-3 rounded-lg hover:border-[var(--color-primary)]"
              >
                I already have an account
              </Link>
            </div>

            <div className="max-w-[480px] mx-auto mt-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
              <p className="text-[10px] tracking-[0.15em] text-[var(--color-accent)] uppercase mb-4">BEGIN WITH THE FOUNDATION</p>
              {chapters.map((chapter, idx) => (
                <div key={chapter.id}>
                  <div className="flex items-center gap-4 py-3 hover:bg-[var(--color-bg)] rounded-lg px-2 -mx-2 cursor-pointer">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-sm font-medium">
                      {chapter.id}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="text-[var(--color-text)] text-sm font-medium">{chapter.name_simple}</p>
                      <p className="text-[var(--color-text-muted)] text-xs">{chapter.verses_count} verses</p>
                    </div>
                    <span className="font-arabic text-[var(--color-accent)] text-lg" dir="rtl">{chapter.name_arabic}</span>
                  </div>
                  {idx < chapters.length - 1 && <div className="border-t border-[var(--color-border)]/50" />}
                </div>
              ))}
              <div className="border-t border-[var(--color-border)] mt-4 pt-4">
                <Link href="/register" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                  Create account to access all 114 surahs and your guided journey →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[var(--color-surface)]">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-8">
              <div className="w-10 h-10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 7h8M8 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2">Foundations first</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                A 30-day path through Qur&apos;an, Seerah, and gentle reflection.
              </p>
            </div>

            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-8">
              <div className="w-10 h-10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 2l7.586 7.586" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2">Reflection over scrolling</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Write what you learned. Mark what confused you. Return to it later.
              </p>
            </div>

            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-8">
              <div className="w-10 h-10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-[var(--color-text)] font-semibold text-lg mb-2">No debates, no rage</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                A focused study space — calm, intellectually honest, free of sectarian noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[var(--color-bg)]">
        <div className="max-w-[680px] mx-auto">
          <h2 className="text-[32px] font-bold text-[var(--color-text)] text-center mb-4">What your first week looks like</h2>
          <p className="text-[var(--color-text-muted)] text-center mb-12">Each day is a complete lesson. No rushing.</p>

          <div className="space-y-3">
            {previewDays.map((day, idx) => (
              <div key={day.day} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white font-medium text-sm">
                  {day.day}
                </div>
                <div className="flex-1">
                  <p className="text-[var(--color-text)] font-medium">{day.title}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs rounded">
                    {day.topic}
                  </span>
                </div>
                <span className="text-[var(--color-text-muted)] text-xs">~20 min</span>
                
                {idx > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--color-bg)]/90 flex items-center justify-end pr-4">
                    <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/register"
              className="bg-[var(--color-accent)] text-white font-medium px-8 py-3 rounded-lg inline-block hover:bg-[var(--color-primary-hover)]"
            >
              Begin Day 1 Journey
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[var(--color-surface)]">
        <div className="max-w-[600px] mx-auto text-center">
          <p className="font-arabic text-[28px] text-[var(--color-accent)]" dir="rtl">{quran65}</p>
          <p className="text-[var(--color-text-muted)] text-sm italic mt-2">And whoever fears Allah — He will make for him a way out.</p>
          <p className="text-[var(--color-text-muted)]/60 text-xs">(Quran 65:3)</p>
          
          <p className="mt-8 text-[20px] text-[var(--color-text)] font-medium">
            Join thousands learning Islam, one day at a time.
          </p>
          
          <Link 
            href="/register"
            className="inline-block mt-8 bg-[var(--color-accent)] text-white font-medium px-10 py-4 rounded-lg text-base hover:bg-[var(--color-primary-hover)]"
          >
            Start your journey today
          </Link>
        </div>
      </section>

      <footer className="py-6 px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex justify-between items-center">
        <p className="text-[var(--color-text-muted)] text-xs">Sabil — a structured Islamic learning companion.</p>
        <p className="text-[var(--color-text-muted)] text-xs">Read. Reflect. Return.</p>
      </footer>
    </>
  );
}