'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import { SEERAH_PLAN_ERAS, SEERAH_PLAN_TOTAL_DAYS, type SeerahPlanDay } from '@/lib/journey-seerah-plan-data';
import { parseDayRef, type ParsedDayRef } from '@/lib/journey-plan-ref-parser';

const WRITTEN_THROUGH_DAY = 30;
const DAYS_PER_MONTH = 30;
const DAYS_PER_WEEK = 7;

type ViewMode = 'phase' | 'month' | 'week' | 'day';

interface FlatDay extends SeerahPlanDay {
  eraId: number;
  eraTitle: string;
}

interface DayGroup {
  key: string;
  label: string;
  range: string;
  days: FlatDay[];
}

function buildFlatDays(): FlatDay[] {
  return SEERAH_PLAN_ERAS.flatMap((era) =>
    era.days.map((d) => ({ ...d, eraId: era.id, eraTitle: era.title }))
  );
}

function groupByMonth(days: FlatDay[], monthLabel: string): DayGroup[] {
  const groups = new Map<number, FlatDay[]>();
  days.forEach((d) => {
    const monthIndex = Math.min(Math.ceil(d.day / DAYS_PER_MONTH), 12);
    if (!groups.has(monthIndex)) groups.set(monthIndex, []);
    groups.get(monthIndex)!.push(d);
  });
  return Array.from(groups.entries()).map(([monthIndex, monthDays]) => {
    const start = monthDays[0].day;
    const end = monthDays[monthDays.length - 1].day;
    return {
      key: `month-${monthIndex}`,
      label: `${monthLabel} ${monthIndex}`,
      range: `${start}–${end}`,
      days: monthDays,
    };
  });
}

function groupByWeek(days: FlatDay[], weekLabel: string): DayGroup[] {
  const groups = new Map<number, FlatDay[]>();
  days.forEach((d) => {
    const weekIndex = Math.ceil(d.day / DAYS_PER_WEEK);
    if (!groups.has(weekIndex)) groups.set(weekIndex, []);
    groups.get(weekIndex)!.push(d);
  });
  return Array.from(groups.entries()).map(([weekIndex, weekDays]) => {
    const start = weekDays[0].day;
    const end = weekDays[weekDays.length - 1].day;
    return {
      key: `week-${weekIndex}`,
      label: `${weekLabel} ${weekIndex}`,
      range: `${start}–${end}`,
      days: weekDays,
    };
  });
}

function DayBadge({ day, isUrdu, writtenLabel, plannedLabel }: { day: number; isUrdu: boolean; writtenLabel: string; plannedLabel: string }) {
  const written = day <= WRITTEN_THROUGH_DAY;
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
        written
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'bg-[var(--color-border)]/60 text-[var(--color-text-muted)]'
      }`}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {written ? writtenLabel : plannedLabel}
    </span>
  );
}

interface SourceLabels {
  sourceSeerah: string;
  sourceHadith: string;
  sourceHistory: string;
  sourceReflection: string;
  hadithSourcePrefix: string;
}

const SOURCE_CHIP_STYLES: Record<string, string> = {
  Quran: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20',
  Seerah: 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  Hadith: 'bg-amber-50 text-amber-800 border-amber-200',
  History: 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  Reflection: 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]',
};

function SourceChips({ parsed, labels }: { parsed: ParsedDayRef; labels: SourceLabels }) {
  const chips: { key: string; text: string; kind: string }[] = [];

  parsed.surahs.forEach((s) => {
    chips.push({ key: `surah-${s.ayahRange}`, text: `${s.surahName} ${s.ayahRange}`, kind: 'Quran' });
  });

  if (parsed.sourceTypes.includes('Seerah')) {
    chips.push({ key: 'seerah', text: labels.sourceSeerah, kind: 'Seerah' });
  }
  if (parsed.sourceTypes.includes('Hadith')) {
    chips.push({
      key: 'hadith',
      text: parsed.hadithSource ? `${labels.sourceHadith} · ${parsed.hadithSource}` : labels.sourceHadith,
      kind: 'Hadith',
    });
  }
  if (parsed.sourceTypes.includes('History')) {
    chips.push({ key: 'history', text: labels.sourceHistory, kind: 'History' });
  }
  if (parsed.sourceTypes.includes('Reflection')) {
    chips.push({ key: 'reflection', text: labels.sourceReflection, kind: 'Reflection' });
  }

  return (
    <>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={`text-[10px] font-medium rounded-full border px-2 py-0.5 whitespace-nowrap ${SOURCE_CHIP_STYLES[chip.kind]}`}
        >
          {chip.text}
        </span>
      ))}
    </>
  );
}

function DayRow({
  d,
  isUrdu,
  writtenLabel,
  plannedLabel,
  sourceLabels,
}: {
  d: FlatDay;
  isUrdu: boolean;
  writtenLabel: string;
  plannedLabel: string;
  sourceLabels: SourceLabels;
}) {
  const parsed = useMemo(() => parseDayRef(d.ref, d.day), [d.ref, d.day]);
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--color-border)] last:border-b-0">
      <span className="flex-none font-mono text-[11px] text-[var(--color-primary)] pt-0.5 w-9 tabular-nums">
        {String(d.day).padStart(3, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h4 className="text-sm font-medium text-[var(--color-text)]">{d.title}</h4>
          <DayBadge day={d.day} isUrdu={isUrdu} writtenLabel={writtenLabel} plannedLabel={plannedLabel} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <SourceChips parsed={parsed} labels={sourceLabels} />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">{d.note}</p>
      </div>
    </div>
  );
}

function CollapsibleGroup({
  group,
  defaultOpen,
  isUrdu,
  writtenLabel,
  plannedLabel,
  daysSuffix,
  sourceLabels,
}: {
  group: DayGroup;
  defaultOpen: boolean;
  isUrdu: boolean;
  writtenLabel: string;
  plannedLabel: string;
  daysSuffix: string;
  sourceLabels: SourceLabels;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const writtenCount = group.days.filter((d) => d.day <= WRITTEN_THROUGH_DAY).length;

  return (
    <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--color-bg)] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex-none transition-transform text-[var(--color-text-muted)] ${open ? 'rotate-90' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="font-medium text-sm text-[var(--color-text)] truncate">{group.label}</span>
          <span className="text-xs text-[var(--color-text-muted)] font-mono flex-none">Days {group.range}</span>
        </div>
        <div className="flex-none flex items-center gap-2">
          {writtenCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] whitespace-nowrap">
              {writtenCount}/{group.days.length} {daysSuffix}
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-2 pt-1 border-t border-[var(--color-border)]">
          {group.days.map((d) => (
            <DayRow key={d.day} d={d} isUrdu={isUrdu} writtenLabel={writtenLabel} plannedLabel={plannedLabel} sourceLabels={sourceLabels} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JourneyPlanPage() {
  const copy = useCopy();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const [view, setView] = useState<ViewMode>('phase');

  const allDays = useMemo(() => buildFlatDays(), []);
  const monthGroups = useMemo(() => groupByMonth(allDays, copy.journey.plan.monthLabel), [allDays, copy.journey.plan.monthLabel]);
  const weekGroups = useMemo(() => groupByWeek(allDays, copy.journey.plan.weekLabel), [allDays, copy.journey.plan.weekLabel]);
  const sourceLabels: SourceLabels = {
    sourceSeerah: copy.journey.plan.sourceSeerah,
    sourceHadith: copy.journey.plan.sourceHadith,
    sourceHistory: copy.journey.plan.sourceHistory,
    sourceReflection: copy.journey.plan.sourceReflection,
    hadithSourcePrefix: copy.journey.plan.hadithSourcePrefix,
  };

  const currentEraId = useMemo(() => {
    const containing = SEERAH_PLAN_ERAS.find((era) => WRITTEN_THROUGH_DAY >= era.dayStart && WRITTEN_THROUGH_DAY <= era.dayEnd);
    return containing?.id ?? 0;
  }, []);

  const currentMonthIndex = Math.min(Math.ceil(WRITTEN_THROUGH_DAY / DAYS_PER_MONTH), 12);
  const currentWeekIndex = Math.ceil(WRITTEN_THROUGH_DAY / DAYS_PER_WEEK);

  const tabs: { id: ViewMode; label: string }[] = [
    { id: 'phase', label: copy.journey.plan.viewPhase },
    { id: 'month', label: copy.journey.plan.viewMonth },
    { id: 'week', label: copy.journey.plan.viewWeek },
    { id: 'day', label: copy.journey.plan.viewDay },
  ];

  return (
    <div className="px-4 md:px-16 pt-7 md:pt-12 pb-20 md:pb-12 max-w-4xl mx-auto" data-script-direction={isUrdu ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <Link href="/journey" className="text-[var(--color-primary)] hover:underline text-sm">
          ← {copy.journey.plan.backToJourney}
        </Link>
        <h1
          className={`mt-4 font-semibold text-[var(--color-text)] ${isUrdu ? 'font-urdu text-[30px] leading-[1.9]' : 'text-2xl md:text-3xl'}`}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {copy.journey.plan.pageTitle}
        </h1>
        <p className={`reading-prose text-[var(--color-text-muted)] mt-2 max-w-2xl ${isUrdu ? 'font-urdu text-[16px] leading-[2.05]' : 'text-sm leading-[1.8]'}`}>
          {copy.journey.plan.pageSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-[var(--color-primary)] tabular-nums">{SEERAH_PLAN_TOTAL_DAYS}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{copy.journey.plan.statsDaysTotal}</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-[var(--color-primary)] tabular-nums">{SEERAH_PLAN_ERAS.length}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{copy.journey.plan.statsEras}</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-[var(--color-primary)] tabular-nums">{WRITTEN_THROUGH_DAY}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{copy.journey.plan.statsWritten}</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === tab.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'phase' && (
        <div className="space-y-4">
          {SEERAH_PLAN_ERAS.map((era) => {
            const writtenCount = era.days.filter((d) => d.day <= WRITTEN_THROUGH_DAY).length;
            return (
              <div key={era.id} className="border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] overflow-hidden">
                <div className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex-none w-9 h-9 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono text-xs flex items-center justify-center">
                      {String(era.id).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--color-text)]">{era.title}</h3>
                        <span className="text-xs font-mono text-[var(--color-text-muted)]">{era.range}</span>
                        {writtenCount > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            {writtenCount}/{era.days.length} {copy.journey.plan.daysSuffix}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">{era.blurb}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {era.tags.map((tag) => (
                          <span key={tag} className="text-[11px] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'month' && (
        <div className="space-y-3">
          {monthGroups.map((group, idx) => (
            <CollapsibleGroup
              key={group.key}
              group={group}
              defaultOpen={idx + 1 === currentMonthIndex}
              isUrdu={isUrdu}
              writtenLabel={copy.journey.plan.writtenBadge}
              plannedLabel={copy.journey.plan.plannedBadge}
              daysSuffix={copy.journey.plan.daysSuffix}
              sourceLabels={sourceLabels}
            />
          ))}
        </div>
      )}

      {view === 'week' && (
        <div className="space-y-3">
          {weekGroups.map((group, idx) => (
            <CollapsibleGroup
              key={group.key}
              group={group}
              defaultOpen={idx + 1 === currentWeekIndex}
              isUrdu={isUrdu}
              writtenLabel={copy.journey.plan.writtenBadge}
              plannedLabel={copy.journey.plan.plannedBadge}
              daysSuffix={copy.journey.plan.daysSuffix}
              sourceLabels={sourceLabels}
            />
          ))}
        </div>
      )}

      {view === 'day' && (
        <div className="space-y-3">
          {SEERAH_PLAN_ERAS.map((era) => (
            <CollapsibleGroup
              key={era.id}
              group={{
                key: `era-${era.id}`,
                label: `${copy.journey.plan.phaseLabel} ${era.id}: ${era.title}`,
                range: `${era.dayStart}–${era.dayEnd}`,
                days: era.days.map((d) => ({ ...d, eraId: era.id, eraTitle: era.title })),
              }}
              defaultOpen={era.id === currentEraId}
              isUrdu={isUrdu}
              writtenLabel={copy.journey.plan.writtenBadge}
              plannedLabel={copy.journey.plan.plannedBadge}
              daysSuffix={copy.journey.plan.daysSuffix}
              sourceLabels={sourceLabels}
            />
          ))}
        </div>
      )}

      <div className="mt-10 bg-[var(--color-surface)]/85 border border-[var(--color-border)] rounded-2xl p-5">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-1.5">{copy.journey.plan.disclaimerTitle}</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{copy.journey.plan.disclaimerBody}</p>
      </div>
    </div>
  );
}
