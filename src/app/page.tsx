import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

async function getChapters(): Promise<Chapter[]> {
  const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  try {
    const res = await fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' });
    const data = await res.json();
    return Array.isArray(data) ? data : (data.chapters || []);
  } catch {
    return [];
  }
}

async function getBismillah(): Promise<string> {
  const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  try {
    const res = await fetch(`${API_BASE}/api/verses/by_key/1:1?translation=203`, { cache: 'no-store' });
    const data = await res.json();
    return data?.verse?.text_uthmani || 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
  } catch {
    return 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
  }
}

async function getQuran65Verse(): Promise<string> {
  const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  try {
    const res = await fetch(`${API_BASE}/api/verses/by_key/65:3?translation=203`, { cache: 'no-store' });
    const data = await res.json();
    return data?.verse?.text_uthmani || '';
  } catch {
    return '';
  }
}

export default async function Home() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single();
    
    if (!prefs?.onboarding_completed) {
      redirect('/onboarding');
    }
    redirect('/journey');
  }

  const chapters = await getChapters();
  const bismillah = await getBismillah();
  const quran65verse = await getQuran65Verse();

  const previewChapters = chapters.slice(0, 2);

  const previewDays = [
    { day: 1, title: "Why Are We Here?", topic: "Purpose & Creation" },
    { day: 2, title: "Who is Allah?", topic: "Names & Attributes" },
    { day: 3, title: "The First Revelation", topic: "Prophethood" },
    { day: 4, title: "What is the Quran?", topic: "Scripture" },
    { day: 5, title: "How to Read with Presence", topic: "Mindfulness" },
    { day: 6, title: "The Purpose of Prayer", topic: "Worship" },
    { day: 7, title: "Tawakkul — Trust in Allah", topic: "Reliance" },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Section 1 - Hero */}
      <section className="min-h-screen flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center px-8 py-6">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-xl">Sabil</span>
            <span className="font-arabic text-[#B7922A] text-sm" dir="rtl">سبيل</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/70 hover:text-white text-sm">Sign In</Link>
            <Link href="/register" className="bg-[#B7922A] text-black px-5 py-2 rounded-lg font-medium hover:bg-[#D4AF6A]">
              Begin
            </Link>
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-[600px] text-center">
            <p className="text-xs tracking-[0.2em] text-[#B7922A] uppercase mb-6">SABIL — GUIDED ISLAM JOURNEY</p>
            
            <p className="font-arabic text-[28px] text-center text-[#D4AF6A] mb-2" dir="rtl">
              {bismillah}
            </p>
            <p className="text-xs text-[#8B949E] italic mb-8">
              In the name of Allah, the Most Compassionate, the Most Merciful
            </p>

            <div className="w-16 h-px bg-[#B7922A]/40 mx-auto my-8" />

            <h1 className="text-[52px] font-bold leading-tight">
              <span className="text-white block">One step a day.</span>
              <span className="text-[#B7922A] italic block">No overwhelm.</span>
            </h1>

            <p className="text-[16px] text-[#8B949E] leading-relaxed text-center mt-6 max-w-[480px] mx-auto">
              A structured, gentle journey through the Qur&apos;an, Seerah, and reflection — without feeds, debates, or distractions.
            </p>

            <div className="flex justify-center gap-3 mt-8">
              <Link 
                href="/register"
                className="bg-[#B7922A] text-black font-medium px-8 py-3 rounded-lg hover:bg-[#D4AF6A]"
              >
                Start your journey
              </Link>
              <Link 
                href="/login"
                className="border border-white/20 text-white/80 px-8 py-3 rounded-lg hover:border-white/40"
              >
                I already have an account
              </Link>
            </div>

            {/* Preview Card */}
            <div className="max-w-[480px] mx-auto mt-12 bg-[#161B22] border border-white/10 rounded-2xl p-5">
              <p className="text-[10px] tracking-[0.15em] text-[#B7922A] uppercase mb-4">BEGIN WITH THE FOUNDATION</p>
              {previewChapters.map((chapter, idx) => (
                <div key={chapter.id}>
                  <div className="flex items-center gap-4 py-3 hover:bg-white/5 rounded-lg px-2 -mx-2 cursor-pointer">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#B7922A]/20 text-[#B7922A] text-sm font-medium">
                      {chapter.id}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-medium">{chapter.name_simple}</p>
                      <p className="text-[#8B949E] text-xs">{chapter.verses_count} verses</p>
                    </div>
                    <span className="font-arabic text-[#B7922A] text-lg" dir="rtl">{chapter.name_arabic}</span>
                  </div>
                  {idx < previewChapters.length - 1 && <div className="border-t border-white/5" />}
                </div>
              ))}
              <div className="border-t border-white/10 mt-4 pt-4">
                <Link href="/register" className="text-xs text-[#8B949E] hover:text-white">
                  Create account to access all 114 surahs and your guided journey →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Why Sabil */}
      <section className="py-20 px-4">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#161B22] border border-white/8 rounded-2xl p-8">
              <div className="w-10 h-10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="text-[#B7922A]">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 7h8M8 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Foundations first</h3>
              <p className="text-[#8B949E] text-sm leading-relaxed">
                A 30-day path through Qur&apos;an, Seerah, and gentle reflection.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#161B22] border border-white/8 rounded-2xl p-8">
              <div className="w-10 h-10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="text-[#B7922A]">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 2l7.586 7.586" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Reflection over scrolling</h3>
              <p className="text-[#8B949E] text-sm leading-relaxed">
                Write what you learned. Mark what confused you. Return to it later.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#161B22] border border-white/8 rounded-2xl p-8">
              <div className="w-10 h-10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="text-[#B7922A]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">No debates, no rage</h3>
              <p className="text-[#8B949E] text-sm leading-relaxed">
                A focused study space — calm, intellectually honest, free of sectarian noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Journey Preview */}
      <section className="py-20 px-4 bg-[#0D1117]">
        <div className="max-w-[680px] mx-auto">
          <h2 className="text-[32px] font-bold text-white text-center mb-4">What your first week looks like</h2>
          <p className="text-[#8B949E] text-center mb-12">Each day is a complete lesson. No rushing.</p>

          <div className="space-y-3">
            {previewDays.map((day, idx) => (
              <div key={day.day} className="bg-[#161B22] border border-white/8 rounded-xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#B7922A] text-black font-medium text-sm">
                  {day.day}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{day.title}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[#B7922A]/20 text-[#B7922A] text-xs rounded">
                    {day.topic}
                  </span>
                </div>
                <span className="text-[#8B949E] text-xs">~20 min</span>
                
                {idx > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0D1117]/80 flex items-center justify-end pr-4">
                    <svg className="w-5 h-5 text-[#8B949E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="bg-[#B7922A] text-black font-medium px-8 py-3 rounded-lg inline-block hover:bg-[#D4AF6A]"
            >
              Begin Day 1 — free, no credit card
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4 - Final CTA */}
      <section className="py-20 px-4 bg-[#161B22]">
        <div className="max-w-[600px] mx-auto text-center">
          {quran65verse && (
            <>
              <p className="font-arabic text-[28px] text-[#D4AF6A]" dir="rtl">{quran65verse}</p>
              <p className="text-[#8B949E] text-sm italic mt-2">And whoever fears Allah — He will make for him a way out.</p>
              <p className="text-[#8B949E]/60 text-xs">(Quran 65:3)</p>
            </>
          )}
          
          <p className="mt-8 text-[20px] text-white font-medium">
            Join thousands learning Islam, one day at a time.
          </p>
          
          <Link 
            href="/register"
            className="inline-block mt-8 bg-[#B7922A] text-black font-medium px-10 py-4 rounded-lg text-base hover:bg-[#D4AF6A]"
          >
            Start your journey today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 bg-[#0D1117] border-t border-white/8 flex justify-between items-center">
        <p className="text-[#8B949E] text-xs">Miftah — Sabil — a structured Islamic learning companion.</p>
        <p className="text-[#8B949E] text-xs">Read. Reflect. Return.</p>
      </footer>
    </div>
  );
}