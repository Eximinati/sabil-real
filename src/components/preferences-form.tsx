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
      console.error('Failed to save preferences:', e);
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-[#6B7280]">Loading preferences...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-[#6B7280] mb-2">Default Translation</label>
        <select
          value={translationId}
          onChange={(e) => setTranslationId(e.target.value)}
          className="w-full border border-[#E8E0D5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#2D6A4F]"
        >
          {translations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.author_name} ({t.language_name})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-[#6B7280] mb-2">Default Tafsir</label>
        <select
          value={tafsirId}
          onChange={(e) => setTafsirId(e.target.value)}
          className="w-full border border-[#E8E0D5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#2D6A4F]"
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
        className="bg-[#2D6A4F] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Preferences'}
      </button>
    </div>
  );
}