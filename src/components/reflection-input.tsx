'use client';

import { useState } from 'react';

interface ReflectionInputProps {
  lessonId: string;
  dayNumber: number;
  initialValue?: string;
}

export function ReflectionInput({ lessonId, dayNumber, initialValue = '' }: ReflectionInputProps) {
  const [text, setText] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setSaving(true);
    try {
      await fetch('/api/journey/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, dayNumber, reflectionText: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      // Silent fail
    }
    setSaving(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection here..."
        className="w-full min-h-[140px] border border-[var(--color-border)] rounded-xl p-4 resize-none focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 text-[var(--color-text)] transition-all"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="bg-[var(--color-primary)] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
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
            'Save Reflection'
          )}
        </button>
      </div>
    </div>
  );
}