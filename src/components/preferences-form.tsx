'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import { csrfHeader } from '@/lib/csrf-client';

interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

interface Tafsir {
  id: number;
  name: string;
  author_name: string;
}

interface PreferencesFormProps {
  initialTranslationId: number;
  initialTafsirId: number;
  initialHadithLanguage: 'auto' | 'english' | 'urdu';
  initialUiLanguage: 'auto' | 'en' | 'ur';
  initialJourneyLanguage: 'auto' | 'en' | 'ur';
  initialRemindersEnabled: boolean;
  initialReminderTime: string;
  initialReminderLanguage: 'auto' | 'en' | 'ur';
}

export function PreferencesForm({
  initialTranslationId,
  initialTafsirId,
  initialHadithLanguage,
  initialUiLanguage,
  initialJourneyLanguage,
  initialRemindersEnabled,
  initialReminderTime,
  initialReminderLanguage,
}: PreferencesFormProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [tafsirs, setTafsirs] = useState<Tafsir[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const copy = useCopy();
  const { language, setLanguage } = useLanguage();

  const [translationId, setTranslationId] = useState(initialTranslationId.toString());
  const [tafsirId, setTafsirId] = useState(initialTafsirId.toString());
  const [hadithLanguage, setHadithLanguage] = useState<'auto' | 'english' | 'urdu'>(initialHadithLanguage);
  const [uiLanguage, setUiLanguage] = useState<'auto' | 'en' | 'ur'>(initialUiLanguage);
  const [journeyLanguage, setJourneyLanguage] = useState<'auto' | 'en' | 'ur'>(initialJourneyLanguage);
  const [remindersEnabled, setRemindersEnabled] = useState(initialRemindersEnabled);
  const [reminderTime, setReminderTime] = useState(initialReminderTime);
  const [reminderLanguage, setReminderLanguage] = useState<'auto' | 'en' | 'ur'>(initialReminderLanguage);

  useEffect(() => {
    Promise.all([
      fetch('/api/translations').then(res => res.json()),
      fetch('/api/tafsirs').then(res => res.json()),
    ]).then(([transData, tafsData]) => {
      setTranslations(transData.translations || transData || []);
      setTafsirs(tafsData.tafsirs || tafsData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          translationId: parseInt(translationId, 10),
          tafsirId: parseInt(tafsirId, 10),
          hadithLanguage,
          uiLanguage,
          journeyLanguage,
          remindersEnabled,
          reminderTime,
          reminderLanguage,
        }),
      });
      if (res.ok) {
        if ((uiLanguage === 'en' || uiLanguage === 'ur') && uiLanguage !== language) {
          setLanguage(uiLanguage);
        }
        document.cookie = `sabil-journey-language=${journeyLanguage}; path=/; max-age=31536000; samesite=lax`;
        setSaved(true);
        toast.success(copy.common.toasts.preferencesUpdated);
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(copy.common.toasts.somethingWentWrong);
      }
    } catch {
      toast.error(copy.common.toasts.somethingWentWrong);
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">{copy.settings.loadingPreferences}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-[var(--color-text-muted)] mb-2">{copy.settings.defaultTranslation}</label>
        <select
          value={translationId}
          onChange={(e) => setTranslationId(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
        >
          {translations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.author_name} ({t.language_name})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-[var(--color-text-muted)] mb-2">{copy.settings.defaultTafsir}</label>
        <select
          value={tafsirId}
          onChange={(e) => setTafsirId(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
        >
          {tafsirs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - {t.author_name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4 space-y-4">
        <div>
          <label className="block text-sm text-[var(--color-text)] mb-1">{copy.settings.hadithLanguage}</label>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">{copy.settings.hadithLanguageDescription}</p>
          <select
            value={hadithLanguage}
            onChange={(e) => setHadithLanguage(e.target.value as 'auto' | 'english' | 'urdu')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          >
            <option value="auto">{copy.settings.hadithLanguageAuto}</option>
            <option value="english">{copy.settings.hadithLanguageEnglish}</option>
            <option value="urdu">{copy.settings.hadithLanguageUrdu}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--color-text)] mb-1">{copy.settings.uiLanguage}</label>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">{copy.settings.uiLanguageDescription}</p>
          <select
            value={uiLanguage}
            onChange={(e) => setUiLanguage(e.target.value as 'auto' | 'en' | 'ur')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          >
            <option value="auto">{copy.settings.uiLanguageAuto}</option>
            <option value="en">{copy.settings.uiLanguageEnglish}</option>
            <option value="ur">{copy.settings.uiLanguageUrdu}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--color-text)] mb-1">{copy.settings.journeyLanguage}</label>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">{copy.settings.journeyLanguageDescription}</p>
          <select
            value={journeyLanguage}
            onChange={(e) => setJourneyLanguage(e.target.value as 'auto' | 'en' | 'ur')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          >
            <option value="auto">{copy.settings.journeyLanguageAuto}</option>
            <option value="en">{copy.settings.journeyLanguageEnglish}</option>
            <option value="ur">{copy.settings.journeyLanguageUrdu}</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">{copy.settings.reminders}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{copy.settings.remindersDescription}</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
            />
            {copy.settings.reminderEnabled}
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">{copy.settings.reminderTime}</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={!remindersEnabled}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-60"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-2">{copy.settings.reminderTimeHint}</p>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">{copy.settings.reminderLanguage}</label>
            <select
              value={reminderLanguage}
              onChange={(e) => setReminderLanguage(e.target.value as 'auto' | 'en' | 'ur')}
              disabled={!remindersEnabled}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-60"
            >
              <option value="auto">{copy.settings.reminderLanguageAuto}</option>
              <option value="en">{copy.settings.reminderLanguageEnglish}</option>
              <option value="ur">{copy.settings.reminderLanguageUrdu}</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {copy.common.labels.saving}
          </>
        ) : saved ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {copy.common.labels.saved}
          </>
        ) : (
          copy.common.actions.savePreferences
        )}
      </button>
    </div>
  );
}
