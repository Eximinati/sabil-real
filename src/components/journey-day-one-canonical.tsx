'use client';

import Link from 'next/link';
import { JourneyVerseContentInner } from './journey-verse-content-inner';
import { JourneyTafsirStreaming } from './journey-tafsir-streaming';
import { ReflectionInput } from './reflection-input';
import { LessonCompleteButton } from './lesson-complete-button';

interface DayOneCanonicalExperienceProps {
  lessonId: string;
  dayNumber: number;
  translationId: number;
  tafsirId?: number;
  initialReflection: string;
  isCompleted: boolean;
  hasNextDay?: boolean;
}

const DAY_ONE_VERSES = ['96:1', '96:2', '96:3', '96:4', '96:5'];

export function DayOneCanonicalExperience({
  lessonId,
  dayNumber,
  translationId,
  tafsirId,
  initialReflection,
  isCompleted,
  hasNextDay,
}: DayOneCanonicalExperienceProps) {
  return (
    <div className="space-y-10 md:space-y-14">
      <section className="reading-section pt-2 md:pt-4">
        <p className="text-sm text-[var(--color-text-muted)]">Day {dayNumber}</p>
        <h1 className="mt-3 text-[29px] font-semibold leading-[1.24] tracking-[-0.02em] text-[var(--color-text)] md:text-[44px]">
          Allah Sees You
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[2] text-[var(--color-text-secondary)] md:text-[18px]">
          Before you explain yourself, before you fix anything, before you perform for anyone, Allah already knows you completely and still invites you near.
        </p>

        <div className="mt-10 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/85 px-6 py-7 md:px-8 md:py-9">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">A quiet ayah for arrival</p>
          <p className="reading-arabic mt-5 font-arabic text-right text-[30px] text-[var(--color-text)] md:text-[38px]" dir="rtl">
            مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَى
          </p>
          <p className="mt-5 text-[15px] leading-[1.95] text-[var(--color-text-secondary)] md:text-[16px]">
            "Your Lord has not left you, nor has He turned away from you."
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Surah Ad-Duha 93:3</p>
        </div>
      </section>

      <section className="reading-section max-w-3xl">
        <h2 className="section-heading">Opening reflection</h2>
        <div className="space-y-5 text-[16px] leading-[2] text-[var(--color-text)]">
          <p>
            Many of us come to faith carrying fatigue, pressure, or private shame. We think we need to arrive polished before we can come close to Allah.
          </p>
          <p>
            Day 1 begins somewhere gentler: you are already seen. Not observed coldly, but known with mercy. The One who made your heart knows what it carries.
          </p>
        </div>
      </section>

      <section className="reading-section rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-7 md:px-8 md:py-8">
        <h2 className="section-heading">A seerah moment</h2>
        <p className="text-[16px] leading-[2] text-[var(--color-text)]">
          Before revelation began, the Prophet Muhammad (peace be upon him) would withdraw to Cave Hira. Away from noise, away from applause, he sat in stillness, searching.
        </p>
        <p className="mt-5 text-[16px] leading-[2] text-[var(--color-text)]">
          He did not stand there with certainty about every next step. He stood there with sincerity. Then guidance came: <em>Read.</em> Not because he already knew everything, but because Allah was opening a beginning.
        </p>
        <p className="mt-5 text-[16px] leading-[2] text-[var(--color-text-secondary)]">
          If you are arriving with uncertainty today, you are in good company.
        </p>
      </section>

      <section className="reading-section">
        <JourneyVerseContentInner
          verseKeys={DAY_ONE_VERSES}
          translationId={translationId}
          title="Quran to sit with today"
          intro="These first revealed verses are not a lecture. They are an opening: your Lord teaches, creates, and gently brings you into light."
        />
      </section>

      <section className="reading-section max-w-3xl">
        <h2 className="section-heading">Sit with what this means</h2>
        <div className="space-y-5 text-[16px] leading-[2] text-[var(--color-text)]">
          <p>
            Allah begins revelation by naming Himself as <strong>Rabb</strong> - your Lord, the One who nurtures and raises you over time.
          </p>
          <p>
            He teaches "by the pen," reminding us that learning is sacred, slow, and merciful. You do not need to become someone else overnight.
          </p>
          <p>
            He says He taught the human being what they did not know. Even confusion can become the doorway to closeness when you bring it honestly to Him.
          </p>
        </div>
      </section>

      {tafsirId && (
        <section className="reading-section">
          <h2 className="section-heading">If you want scholar context</h2>
          <p className="mb-5 text-[15px] leading-[1.9] text-[var(--color-text-muted)]">
            Open only if it helps your heart stay present. These notes follow your saved scholar preference.
          </p>
          <JourneyTafsirStreaming verseKeys={DAY_ONE_VERSES} tafsirId={tafsirId} />
        </section>
      )}

      <section className="reading-section rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 px-6 py-7 md:px-8 md:py-8">
        <h2 className="section-heading">A Prophetic reminder</h2>
        <p className="text-[17px] italic leading-[1.95] text-[var(--color-text)] md:text-[18px]">
          "Allah says: I am as My servant expects Me to be, and I am with him when he remembers Me."
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">Sahih al-Bukhari 7405, Sahih Muslim 2675</p>
      </section>

      <section className="reading-section">
        <h2 className="section-heading">Private reflection</h2>
        <div className="rounded-[28px] border border-[var(--color-primary)]/20 bg-[var(--color-bg)] px-6 py-6 md:px-7">
          <p className="text-[16px] leading-[1.9] text-[var(--color-text)]">
            What burden have you been carrying silently lately? Write as if you are speaking directly to Allah, who already knows and still listens with mercy.
          </p>
        </div>
        <div className="mt-5">
          <ReflectionInput lessonId={lessonId} dayNumber={dayNumber} initialValue={initialReflection || ''} />
        </div>
      </section>

      <section className="reading-section rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 px-6 py-7 md:px-8 md:py-8">
        <h2 className="section-heading">A tiny action for tonight</h2>
        <p className="text-[16px] leading-[1.95] text-[var(--color-text)]">
          Tonight, take two quiet minutes and speak honestly to Allah in your own words. No script. No performance. Just truth.
        </p>
      </section>

      <section className="reading-section rounded-[30px] border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] px-6 py-8 md:px-9 md:py-10">
        <h2 className="section-heading">Closing moment</h2>
        <p className="text-[16px] leading-[1.95] text-[var(--color-text)]">
          O Allah, You are near, You see me, and You know me better than I know myself. Keep my heart sincere, soften what is heavy, and bring me closer to You with mercy.
        </p>
        <p className="mt-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {hasNextDay
            ? 'If your heart feels even a little softer now, return tomorrow.'
            : 'If your heart feels even a little softer now, return tomorrow. Your next step will open gently in its time.'}
          {' '}
          <Link
            href={hasNextDay ? '/journey/2' : '/journey?notice=return-tomorrow'}
            className="rtl-ready-arrow text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            data-script-direction="ltr"
          >
            {hasNextDay ? 'Day 2 is waiting quietly.' : 'Return to today\'s journey.'}
          </Link>
        </p>
      </section>

      <LessonCompleteButton lessonId={lessonId} dayNumber={dayNumber} isCompleted={isCompleted} />
    </div>
  );
}
