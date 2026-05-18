'use client';

import { useState, useEffect } from 'react';

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
}

export function PreferencesForm({ initialTranslationId, initialTafsirId }: PreferencesFormProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [tafsirs, setTafsirs] = useState<Tafsir[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [translationId, setTranslationId] = useState(initialTranslationId.toString());
  const [tafsirId, setTafsirId] = useState(initialTafsirId.toString());

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translationId: parseInt(translationId, 10),
          tafsirId: parseInt(tafsirId, 10),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      // Silent fail
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Loading preferences...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-[var(--color-text-muted)] mb-2">Default Translation</label>
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
        <label className="block text-sm text-[var(--color-text-muted)] mb-2">Default Tafsir</label>
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
            Saving...
          </>
        ) : saved ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </>
        ) : (
          'Save Preferences'
        )}
      </button>
    </div>
  );
}