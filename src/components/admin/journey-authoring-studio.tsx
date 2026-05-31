'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CanonicalAdminSacredDraft,
  CanonicalAdminSectionDraft,
  CanonicalAdminWeekContextDraft,
  JourneyLessonMetadata,
} from '@/types/admin-journey';
import { DayOneCanonicalExperience } from '@/components/journey-day-one-canonical';
import { saveCanonicalLesson } from '@/lib/admin-journey-actions';
import { useToast } from '@/hooks/use-toast';
import {
  buildVerseKeysFromQuranRange,
  canonicalHadithSourceLabel,
  DEFAULT_HADITH_COLLECTION,
  DEFAULT_HADITH_NUMBER,
  DEFAULT_QURAN_RANGE,
  normalizeCanonicalTafsirSettings,
  sanitizeQuranRange,
  sanitizeVerseKeys,
  toCanonicalVerseReferenceLabel,
} from '@/lib/canonical-sacred';
import { getDefaultTranslationIdForLanguage } from '@/lib/user-preferences';
import type { CanonicalJourneySectionId } from '@/types/journey-localization';

type TabId = 'identity' | 'sources' | 'english' | 'urdu' | 'preview';
type PublishStatus = 'draft' | 'published';

interface JourneyAuthoringStudioProps {
  initialData?: {
    metadata: JourneyLessonMetadata;
  };
  userId: string;
}

const CANONICAL_SECTION_DEFAULTS: CanonicalAdminSectionDraft[] = [
  { id: 'opening-reflection', heading: 'Opening reflection', emotional_goal: 'Open heart with gentle emotional entry.', required: true, content_en: '', content_ur: '' },
  { id: 'seerah-moment', heading: 'Seerah moment', emotional_goal: 'Offer human Prophetic companionship.', required: true, content_en: '', content_ur: '' },
  { id: 'quran-reflection', heading: 'Quran reflection', emotional_goal: 'Center day on revealed guidance.', required: true, content_en: '', content_ur: '' },
  { id: 'tafsir-insight', heading: 'Tafsir framing', emotional_goal: 'Short bridge before API scholar tafsir.', required: false, content_en: '', content_ur: '' },
  { id: 'hadith-connection', heading: 'Hadith connection', emotional_goal: 'Reinforce Quran guidance with Prophetic wisdom.', required: true, content_en: '', content_ur: '' },
  { id: 'reflection-prompt', heading: 'Reflection prompt', emotional_goal: 'Invite private sincerity and internalization.', required: true, content_en: '', content_ur: '' },
  { id: 'tiny-action', heading: 'Tiny action', emotional_goal: 'Translate meaning into one gentle lived step.', required: true, content_en: '', content_ur: '' },
  { id: 'closing-dua', heading: 'Closing dua', emotional_goal: 'End with spiritual closure and calm return cue.', required: true, content_en: '', content_ur: '' },
];

const SECTION_LABELS: Record<CanonicalJourneySectionId, string> = {
  'opening-reflection': 'Opening Reflection',
  'seerah-moment': 'Seerah Moment',
  'quran-reflection': 'Quran Reflection',
  'tafsir-insight': 'Tafsir Insight',
  'hadith-connection': 'Hadith Connection',
  'reflection-prompt': 'Reflection Prompt',
  'tiny-action': 'Tiny Action',
  'closing-dua': 'Closing Dua',
};

const SECTION_GUIDES: Record<CanonicalJourneySectionId, string> = {
  'opening-reflection': 'Write a short emotional opening that helps the reader feel safe and seen.',
  'seerah-moment': 'Share one small moment from the Prophet\'s life that mirrors the reader\'s emotional state.',
  'quran-reflection': 'Frame the Quran verses with one gentle sentence before the verses render from API.',
  'tafsir-insight': 'Write one short emotional framing line before dynamic scholar tafsir.',
  'hadith-connection': 'Add one line that transitions into hadith source text rendered from API.',
  'reflection-prompt': 'Ask one sincere, emotionally safe question for private reflection.',
  'tiny-action': 'Offer one realistic tiny action for today or tonight.',
  'closing-dua': 'Close with a short dua-style line and gentle return cue.',
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'sources', label: 'Sources' },
  { id: 'english', label: 'English' },
  { id: 'urdu', label: 'Urdu' },
  { id: 'preview', label: 'Preview' },
];

const SECTION_ORDER: CanonicalJourneySectionId[] = [
  'opening-reflection',
  'seerah-moment',
  'quran-reflection',
  'tafsir-insight',
  'hadith-connection',
  'reflection-prompt',
  'tiny-action',
  'closing-dua',
];

function normalizeCanonicalText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function extractCanonicalDrafts(metadata: JourneyLessonMetadata): CanonicalAdminSectionDraft[] {
  const canonical = metadata.shared_metadata?.canonical_journey;
  return CANONICAL_SECTION_DEFAULTS.map((defaults) => {
    const existing = canonical?.sections?.[defaults.id];
    return {
      ...defaults,
      heading: normalizeCanonicalText(existing?.heading || defaults.heading),
      emotional_goal: normalizeCanonicalText(existing?.emotional_goal || defaults.emotional_goal),
      required: existing?.required ?? defaults.required,
      content_en: normalizeCanonicalText(existing?.content?.en || ''),
      content_ur: normalizeCanonicalText(existing?.content?.ur || ''),
    };
  });
}

function extractSacredDraft(metadata: JourneyLessonMetadata): CanonicalAdminSacredDraft {
  const canonical = metadata.shared_metadata?.canonical_journey;
  const refs = canonical?.sacred_source_refs || {};
  const sectionRefs = canonical?.sections?.['quran-reflection']?.sacred_refs;
  const hadithSectionRefs = canonical?.sections?.['hadith-connection']?.sacred_refs;

  const existingVerseKeys = sanitizeVerseKeys(sectionRefs?.verse_keys || refs.verse_keys || []);
  const inferredRange =
    sanitizeQuranRange(sectionRefs?.quran_range || refs.quran_range) ||
    inferQuranRangeFromVerseKeys(existingVerseKeys) ||
    DEFAULT_QURAN_RANGE;

  const normalizedTafsir = normalizeCanonicalTafsirSettings({
    settings: canonical?.tafsir,
    legacyDefaultTafsirId: canonical?.default_tafsir_id,
  });

  const hadithCollection = (hadithSectionRefs?.hadith_collection || refs.hadith_collection || DEFAULT_HADITH_COLLECTION).trim();
  const hadithNumber = toPositiveInt(hadithSectionRefs?.hadith_number || refs.hadith_number) || DEFAULT_HADITH_NUMBER;
  const hadithSource = (hadithSectionRefs?.hadith_source || refs.hadith_source || '').trim() ||
    canonicalHadithSourceLabel(hadithCollection, hadithNumber) || '';

  return {
    quran_range_surah_id: inferredRange.surah_id || DEFAULT_QURAN_RANGE.surah_id,
    quran_range_ayah_start: inferredRange.ayah_start || DEFAULT_QURAN_RANGE.ayah_start,
    quran_range_ayah_end: inferredRange.ayah_end || DEFAULT_QURAN_RANGE.ayah_end,
    hadith_collection: hadithCollection,
    hadith_number: hadithNumber,
    hadith_source: hadithSource,
    tafsir_enabled: normalizedTafsir.enabled,
    tafsir_default_id: normalizedTafsir.default_tafsir_id,
    tafsir_scholar_ids: normalizedTafsir.scholar_ids,
    tafsir_fallback_behavior: normalizedTafsir.fallback_behavior,
    tafsir_reveal_mode: normalizedTafsir.reveal_mode,
  };
}

function extractWeekContextDraft(metadata: JourneyLessonMetadata): CanonicalAdminWeekContextDraft {
  const canonical = metadata.shared_metadata?.canonical_journey;
  const context = canonical?.week_context;
  const shared = metadata.shared_metadata;
  return {
    week_number: context?.week_number || 1,
    week_title: context?.week_title || shared?.week_chapter || '',
    week_arc: context?.week_arc || shared?.arc_identity || '',
    emotional_tone: context?.emotional_tone || canonical?.emotional_note || shared?.emotional_note || '',
    journey_identity: context?.journey_identity || canonical?.week_identity || shared?.arc_identity || '',
    editorial_notes: context?.editorial_notes || '',
  };
}

function inferQuranRangeFromVerseKeys(verseKeys: string[]) {
  if (verseKeys.length === 0) return null;
  const parts = verseKeys[0].split(':');
  const surah = Number.parseInt(parts[0], 10);
  if (!Number.isFinite(surah)) return null;
  const ayahs = verseKeys.map((k) => Number.parseInt(k.split(':')[1], 10)).filter(Number.isFinite);
  return { surah_id: surah, ayah_start: Math.min(...ayahs), ayah_end: Math.max(...ayahs) };
}

function buildMetadataFromDrafts(
  metadata: JourneyLessonMetadata,
  drafts: CanonicalAdminSectionDraft[],
  sacredDraft: CanonicalAdminSacredDraft,
  weekContext: CanonicalAdminWeekContextDraft
): JourneyLessonMetadata {
  const existingShared = metadata.shared_metadata || {};
  const existingCanonical = existingShared.canonical_journey || {};
  const existingRefs = existingCanonical.sacred_source_refs || {};

  const normalizedRange = sanitizeQuranRange({
    surah_id: sacredDraft.quran_range_surah_id,
    ayah_start: sacredDraft.quran_range_ayah_start,
    ayah_end: sacredDraft.quran_range_ayah_end,
  }) || DEFAULT_QURAN_RANGE;

  const derivedVerseKeys = buildVerseKeysFromQuranRange(normalizedRange);
  const hadithCollection = sacredDraft.hadith_collection.trim() || DEFAULT_HADITH_COLLECTION;
  const hadithNumber = toPositiveInt(sacredDraft.hadith_number) || DEFAULT_HADITH_NUMBER;
  const hadithSource = sacredDraft.hadith_source.trim() ||
    canonicalHadithSourceLabel(hadithCollection, hadithNumber) || '';

  const normalizedTafsir = normalizeCanonicalTafsirSettings({
    settings: {
      enabled: sacredDraft.tafsir_enabled,
      default_tafsir_id: sacredDraft.tafsir_default_id,
      scholar_ids: sacredDraft.tafsir_scholar_ids,
      fallback_behavior: sacredDraft.tafsir_fallback_behavior,
      reveal_mode: sacredDraft.tafsir_reveal_mode,
    },
    legacyDefaultTafsirId: existingCanonical.default_tafsir_id,
  });

  const sections = Object.fromEntries(
    drafts.map((draft) => {
      const existing = existingCanonical?.sections?.[draft.id] || {};
      const section: Record<string, unknown> = {
        ...existing,
        heading: draft.heading,
        emotional_goal: draft.emotional_goal,
        required: draft.required,
        content: {
          ...(existing?.content || {}),
          en: draft.content_en,
          ur: draft.content_ur,
        },
      };
      if (draft.id === 'quran-reflection') {
        section.sacred_refs = { quran_range: normalizedRange, verse_keys: derivedVerseKeys };
      }
      if (draft.id === 'hadith-connection') {
        section.sacred_refs = { hadith_collection: hadithCollection, hadith_number: hadithNumber, hadith_source: hadithSource };
      }
      return [draft.id, section];
    })
  );

  return {
    ...metadata,
    shared_metadata: {
      ...existingShared,
      week_chapter: weekContext.week_title.trim() || existingShared.week_chapter,
      arc_identity: weekContext.week_arc.trim() || existingShared.arc_identity,
      emotional_note: weekContext.emotional_tone.trim() || existingShared.emotional_note,
      canonical_journey: {
        ...existingCanonical,
        structure_version: existingCanonical.structure_version || 1,
        week_identity: weekContext.journey_identity.trim() || existingCanonical.week_identity || existingShared.arc_identity || '',
        emotional_note: weekContext.emotional_tone.trim() || existingCanonical.emotional_note || existingShared.emotional_note,
        week_context: {
          week_number: toPositiveInt(weekContext.week_number) || 1,
          week_title: weekContext.week_title.trim(),
          week_arc: weekContext.week_arc.trim(),
          emotional_tone: weekContext.emotional_tone.trim(),
          journey_identity: weekContext.journey_identity.trim(),
          editorial_notes: weekContext.editorial_notes.trim(),
        },
        publishing_state: existingCanonical.publishing_state || (metadata.is_published ? 'published' : 'review'),
        default_tafsir_id: normalizedTafsir.default_tafsir_id,
        tafsir: {
          enabled: normalizedTafsir.enabled,
          default_tafsir_id: normalizedTafsir.default_tafsir_id,
          scholar_ids: normalizedTafsir.scholar_ids,
          fallback_behavior: normalizedTafsir.fallback_behavior,
          reveal_mode: normalizedTafsir.reveal_mode,
        },
        sacred_source_refs: {
          ...existingRefs,
          quran_range: normalizedRange,
          verse_keys: derivedVerseKeys,
          hadith_collection: hadithCollection,
          hadith_number: hadithNumber,
          hadith_source: hadithSource,
        },
        sections,
      },
    },
  };
}

function getValidationWarnings(
  drafts: CanonicalAdminSectionDraft[],
  sacredDraft: CanonicalAdminSacredDraft,
  weekContext: CanonicalAdminWeekContextDraft,
  isPublished: boolean
): { id: string; message: string }[] {
  const warnings: { id: string; message: string }[] = [];

  const requiredSections = drafts.filter((s) => s.required);
  for (const section of requiredSections) {
    if (!section.content_en.trim()) {
      warnings.push({ id: `en-${section.id}`, message: `${SECTION_LABELS[section.id]}: English content missing` });
    }
  }

  if (!weekContext.week_title.trim()) {
    warnings.push({ id: 'week-title', message: 'Week Identity is missing' });
  }
  if (!weekContext.journey_identity.trim()) {
    warnings.push({ id: 'journey-identity', message: 'Day Identity is missing' });
  }
  if (!weekContext.emotional_tone.trim()) {
    warnings.push({ id: 'emotional-tone', message: 'Primary Emotion is missing' });
  }

  if (!sacredDraft.quran_range_surah_id || !sacredDraft.quran_range_ayah_start || !sacredDraft.quran_range_ayah_end) {
    warnings.push({ id: 'quran-range', message: 'Quran reference is incomplete' });
  }

  if (!sacredDraft.hadith_collection.trim() || !sacredDraft.hadith_number) {
    warnings.push({ id: 'hadith-ref', message: 'Hadith reference is missing' });
  }

  return warnings;
}

function getTranslationProgress(drafts: CanonicalAdminSectionDraft[], lang: 'en' | 'ur'): { filled: number; total: number; pct: number } {
  const contentFields = drafts.filter((s) => s.id !== 'tafsir-insight');
  const filled = contentFields.filter((s) => (lang === 'en' ? s.content_en : s.content_ur).trim().length > 0).length;
  const total = contentFields.length;
  return { filled, total, pct: total === 0 ? 0 : Math.round((filled / total) * 100) };
}

export function JourneyAuthoringStudio({ initialData, userId }: JourneyAuthoringStudioProps) {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewLang, setPreviewLang] = useState<'en' | 'ur'>('en');

  const initialMetadata = initialData?.metadata || {
    day_number: 1,
    title: '',
    subtitle: '',
    topic: '',
    description: '',
    estimated_minutes: 10,
    is_published: false,
    localized_content: {},
    shared_metadata: {},
  };

  const [dayNumber, setDayNumber] = useState(initialMetadata.day_number);
  const [title, setTitle] = useState(initialMetadata.title);
  const [subtitle, setSubtitle] = useState(initialMetadata.subtitle || '');
  const [topic, setTopic] = useState(initialMetadata.topic || '');
  const [urTitle, setUrTitle] = useState(initialMetadata.localized_content?.ur?.title || '');
  const [urSubtitle, setUrSubtitle] = useState(initialMetadata.localized_content?.ur?.subtitle || '');
  const [urTopic, setUrTopic] = useState(initialMetadata.localized_content?.ur?.topic || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialMetadata.estimated_minutes || 10);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>(initialMetadata.is_published ? 'published' : 'draft');

  const [canonicalDrafts, setCanonicalDrafts] = useState<CanonicalAdminSectionDraft[]>(
    extractCanonicalDrafts(initialMetadata)
  );
  const [sacredDraft, setSacredDraft] = useState<CanonicalAdminSacredDraft>(
    extractSacredDraft(initialMetadata)
  );
  const [weekContext, setWeekContext] = useState<CanonicalAdminWeekContextDraft>(
    extractWeekContextDraft(initialMetadata)
  );

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [dayNumber, title, subtitle, topic, urTitle, urSubtitle, urTopic, estimatedMinutes, publishStatus, canonicalDrafts, sacredDraft, weekContext]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validationWarnings = getValidationWarnings(canonicalDrafts, sacredDraft, weekContext, publishStatus === 'published');
  const enProgress = getTranslationProgress(canonicalDrafts, 'en');
  const urProgress = getTranslationProgress(canonicalDrafts, 'ur');

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (publish) {
      const criticalWarnings = validationWarnings.filter((w) =>
        w.id.startsWith('en-') || w.id === 'quran-range' || w.id === 'hadith-ref' ||
        w.id === 'week-title' || w.id === 'journey-identity'
      );
      if (criticalWarnings.length > 0) {
        toast.error(`Cannot publish: ${criticalWarnings[0].message}`);
        return;
      }
    }

    const metadataPayload: JourneyLessonMetadata = {
      ...initialMetadata,
      id: initialMetadata.id,
      day_number: dayNumber,
      title: title.trim(),
      subtitle: subtitle.trim() || '',
      topic: topic.trim(),
      description: '',
      estimated_minutes: estimatedMinutes,
      is_published: publish || publishStatus === 'published',
      localized_content: {
        ...(initialMetadata.localized_content || {}),
        ur: {
          ...(initialMetadata.localized_content?.ur || {}),
          title: urTitle.trim(),
          subtitle: urSubtitle.trim(),
          topic: urTopic.trim(),
        },
      },
      translation_status: {
        en: 'qa_approved',
        ur: urProgress.pct === 100 ? 'qa_approved' : urProgress.filled > 0 ? 'draft_localized' : 'untranslated',
      },
    };

    const mergedMetadata = buildMetadataFromDrafts(metadataPayload, canonicalDrafts, sacredDraft, weekContext);

    setSaving(true);
    const result = await saveCanonicalLesson(mergedMetadata, userId);
    setSaving(false);

    if (result.success) {
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success(publish ? 'Lesson published!' : 'Draft saved');
      if (!initialData?.metadata?.id) {
        router.replace(`/admin/journey/${result.lessonId}/edit`);
      }
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  const updateSection = (sectionId: CanonicalJourneySectionId, field: 'content_en' | 'content_ur', value: string) => {
    setCanonicalDrafts((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const updateSacredField = (field: keyof CanonicalAdminSacredDraft, value: string | number | boolean | number[]) => {
    setSacredDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateWeekField = (field: keyof CanonicalAdminWeekContextDraft, value: string | number) => {
    setWeekContext((prev) => ({ ...prev, [field]: value }));
  };

  const sectionContentForPreview = (sectionId: CanonicalJourneySectionId): string | undefined => {
    const draft = canonicalDrafts.find((s) => s.id === sectionId);
    if (!draft) return undefined;
    const preferred = previewLang === 'ur' ? draft.content_ur.trim() : draft.content_en.trim();
    const fallback = previewLang === 'ur' ? draft.content_en.trim() : draft.content_ur.trim();
    return preferred || fallback || undefined;
  };

  const canonicalSectionTitles = Object.fromEntries(
    canonicalDrafts.map((s) => [s.id, s.heading])
  ) as Partial<Record<CanonicalJourneySectionId, string>>;

  const previewRange = sanitizeQuranRange({
    surah_id: sacredDraft.quran_range_surah_id,
    ayah_start: sacredDraft.quran_range_ayah_start,
    ayah_end: sacredDraft.quran_range_ayah_end,
  }) || DEFAULT_QURAN_RANGE;

  const previewVerseKeys = buildVerseKeysFromQuranRange(previewRange);
  const previewHadithSource = sacredDraft.hadith_source.trim() ||
    canonicalHadithSourceLabel(sacredDraft.hadith_collection, sacredDraft.hadith_number) || '';
  const previewTranslationId = getDefaultTranslationIdForLanguage(previewLang);

  const renderTab = () => {
    switch (activeTab) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Day Number</label>
                <input type="number" min={1} value={dayNumber}
                  onChange={(e) => setDayNumber(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Estimated Minutes</label>
                <input type="number" min={1} value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
              </div>
            </div>

            <hr className="border-[var(--color-border)]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Week Identity</label>
                <input type="text" value={weekContext.week_title}
                  onChange={(e) => updateWeekField('week_title', e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                  placeholder="e.g. Knowing Allah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Day Identity</label>
                <input type="text" value={weekContext.journey_identity}
                  onChange={(e) => updateWeekField('journey_identity', e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                  placeholder="e.g. Allah Sees You" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Primary Emotion</label>
                <input type="text" value={weekContext.emotional_tone}
                  onChange={(e) => updateWeekField('emotional_tone', e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                  placeholder="e.g. Being Seen" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Journey Phase</label>
                <input type="text" value={weekContext.week_arc}
                  onChange={(e) => updateWeekField('week_arc', e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                  placeholder="e.g. Week 1" />
              </div>
            </div>

            <hr className="border-[var(--color-border)]" />

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Publishing Status</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPublishStatus('draft')}
                  className={`px-5 py-2 rounded-xl text-sm border transition-colors ${publishStatus === 'draft' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30'}`}
                >
                  Draft
                </button>
                <button
                  onClick={() => setPublishStatus('published')}
                  className={`px-5 py-2 rounded-xl text-sm border transition-colors ${publishStatus === 'published' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-emerald-300'}`}
                >
                  Published
                </button>
              </div>
            </div>
          </div>
        );

      case 'sources':
        return (
          <div className="space-y-8">

            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Quran Reflection</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">Author references the source. System fetches Arabic, translation, audio, and verse metadata automatically.</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Surah Number</label>
                  <input type="number" min={1} max={114} value={sacredDraft.quran_range_surah_id}
                    onChange={(e) => updateSacredField('quran_range_surah_id', Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Start Ayah</label>
                  <input type="number" min={1} value={sacredDraft.quran_range_ayah_start}
                    onChange={(e) => updateSacredField('quran_range_ayah_start', Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">End Ayah</label>
                  <input type="number" min={1} value={sacredDraft.quran_range_ayah_end}
                    onChange={(e) => updateSacredField('quran_range_ayah_end', Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Hadith Connection</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">System fetches hadith content by collection and ID.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Collection</label>
                  <input type="text" value={sacredDraft.hadith_collection}
                    onChange={(e) => updateSacredField('hadith_collection', e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    placeholder="e.g. bukhari" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Hadith ID</label>
                  <input type="number" min={1} value={sacredDraft.hadith_number}
                    onChange={(e) => updateSacredField('hadith_number', Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Seerah Moment</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">Future-ready: Seerah content retrievable by ID.</p>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Seerah ID</label>
                <input type="text"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] opacity-60 focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                  placeholder="e.g. SEERAH_001 (coming)" disabled />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Tafsir Insight</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">Author selects reference source. System auto-fetches content from API — no manual copy-paste needed.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Default scholar ID</label>
                  <input type="number" min={1} value={sacredDraft.tafsir_default_id}
                    onChange={(e) => updateSacredField('tafsir_default_id', Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Scholar language</label>
                  <select
                    value=""
                    disabled
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] opacity-60"
                  >
                    <option value="">Auto (API determines)</option>
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Content auto-fetches from Quran Foundation API. Scholar name displayed at runtime.
              </p>
              <label className="flex items-center gap-2 mt-3 text-sm text-[var(--color-text)]">
                <input type="checkbox" checked={sacredDraft.tafsir_enabled}
                  onChange={(e) => updateSacredField('tafsir_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)]" />
                Enable tafsir section
              </label>
            </section>
          </div>
        );

      case 'english':
      case 'urdu': {
        const isEn = activeTab === 'english';
        const progress = isEn ? enProgress : urProgress;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] mb-2">
              <span>Translation completeness</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden max-w-[200px]">
                <div
                  className={`h-full rounded-full transition-all ${progress.pct === 100 ? 'bg-emerald-500' : progress.pct > 0 ? 'bg-amber-400' : 'bg-[var(--color-border)]'}`}
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <span className={`font-medium ${progress.pct === 100 ? 'text-emerald-600' : 'text-[var(--color-text)]'}`}>{progress.pct}%</span>
            </div>

            {isEn ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Title</label>
                  <input type="text" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    placeholder="e.g. Allah Sees You" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Subtitle</label>
                  <input type="text" value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    placeholder="Optional subtitle" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Topic</label>
                  <input type="text" value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    placeholder="e.g. Purpose & Creation" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Urdu Title</label>
                  <input type="text" value={urTitle}
                    onChange={(e) => setUrTitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    dir="rtl" placeholder="اردو عنوان" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Urdu Subtitle</label>
                  <input type="text" value={urSubtitle}
                    onChange={(e) => setUrSubtitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    dir="rtl" placeholder="اردو ذیلی عنوان" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Urdu Topic</label>
                  <input type="text" value={urTopic}
                    onChange={(e) => setUrTopic(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12"
                    dir="rtl" placeholder="اردو موضوع" />
                </div>
              </>
            )}

            {SECTION_ORDER.map((sectionId, index) => {
              const draft = canonicalDrafts.find((s) => s.id === sectionId);
              if (!draft) return null;
              const content = isEn ? draft.content_en : draft.content_ur;
              return (
                <section key={sectionId} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <span className="text-xs text-[var(--color-text-muted)]">Section {index + 1}</span>
                      <h3 className="text-sm font-medium text-[var(--color-text)] mt-0.5">{SECTION_LABELS[sectionId]}</h3>
                    </div>
                    {draft.required && <span className="shrink-0 text-xs text-[var(--color-text-muted)]">Required</span>}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">{SECTION_GUIDES[sectionId]}</p>
                  <textarea
                    value={content}
                    onChange={(e) => updateSection(sectionId, isEn ? 'content_en' : 'content_ur', e.target.value)}
                    className={`w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] resize-none transition-colors focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12 ${!isEn ? 'font-urdu' : ''}`}
                    rows={5}
                    dir={!isEn ? 'rtl' : 'ltr'}
                    placeholder={!isEn ? 'اردو میں تحریر کریں...' : `Write ${SECTION_LABELS[sectionId].toLowerCase()} content...`}
                  />
                </section>
              );
            })}
          </div>
        );
      }

      case 'preview':
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setPreviewLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs border ${previewLang === 'en' ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
              >
                English
              </button>
              <button
                onClick={() => setPreviewLang('ur')}
                className={`px-3 py-1.5 rounded-lg text-xs border ${previewLang === 'ur' ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
              >
                Urdu
              </button>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-5">
                <DayOneCanonicalExperience
                  lessonId={initialMetadata.id || 'preview-lesson'}
                  dayNumber={dayNumber}
                  lessonTitle={previewLang === 'ur' ? (urTitle || title) : title}
                  lessonSubtitle={subtitle || null}
                  translationId={previewTranslationId}
                  tafsirId={sacredDraft.tafsir_default_id}
                  canonicalVerseKeys={previewVerseKeys}
                  quranRangeLabel={toCanonicalVerseReferenceLabel(previewRange)}
                  quranIntroText={sectionContentForPreview('quran-reflection')}
                  openingReflectionText={sectionContentForPreview('opening-reflection')}
                  seerahMomentText={sectionContentForPreview('seerah-moment')}
                  tafsirInsightText={sectionContentForPreview('tafsir-insight')}
                  reflectionPromptText={sectionContentForPreview('reflection-prompt')}
                  tinyActionText={sectionContentForPreview('tiny-action')}
                  closingDuaText={sectionContentForPreview('closing-dua')}
                  hadithCollection={sacredDraft.hadith_collection}
                  hadithNumber={sacredDraft.hadith_number}
                  hadithText={sectionContentForPreview('hadith-connection') || null}
                  hadithSource={previewHadithSource}
                  hadithLanguage={previewLang === 'ur' ? 'urdu' : 'english'}
                  tafsirEnabled={sacredDraft.tafsir_enabled}
                  tafsirRevealMode={sacredDraft.tafsir_reveal_mode}
                  tafsirFallbackUsed={false}
                  sectionTitles={canonicalSectionTitles}
                  initialReflection=""
                  isCompleted={false}
                  hasNextDay={true}
                  previewOnly
                  languageOverride={previewLang}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  const hasActiveWarnings = validationWarnings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            {title ? `${title}` : `Day ${dayNumber}`}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Journey Authoring Studio</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-xl text-sm hover:bg-[var(--color-surface)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || hasActiveWarnings}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            title={hasActiveWarnings ? 'Resolve warnings before publishing' : undefined}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Validation warnings */}
      {validationWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-1.5">
          <p className="text-sm font-medium text-amber-900">Items needing attention</p>
          {validationWarnings.map((w) => (
            <p key={w.id} className="text-sm text-amber-800">• {w.message}</p>
          ))}
        </div>
      )}

      {/* Progress overview */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">English</span>
            <span className={enProgress.pct === 100 ? 'text-emerald-600 font-medium' : 'text-[var(--color-text)]'}>{enProgress.pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div className={`h-full rounded-full ${enProgress.pct === 100 ? 'bg-emerald-500' : enProgress.pct > 0 ? 'bg-amber-400' : 'bg-[var(--color-border)]'}`}
              style={{ width: `${enProgress.pct}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Urdu</span>
            <span className={urProgress.pct === 100 ? 'text-emerald-600 font-medium' : 'text-[var(--color-text)]'}>{urProgress.pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div className={`h-full rounded-full ${urProgress.pct === 100 ? 'bg-emerald-500' : urProgress.pct > 0 ? 'bg-amber-400' : 'bg-[var(--color-border)]'}`}
              style={{ width: `${urProgress.pct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {renderTab()}
      </div>
    </div>
  );
}
