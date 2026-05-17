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
      console.error('Failed to save reflection:', e);
    }
    setSaving(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection here..."
        className="w-full min-h-[120px] border border-[#E8E0D5] rounded-xl p-4 resize-none focus:outline-none focus:border-[#2D6A4F] text-[#1A1A1A]"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="bg-[#2D6A4F] text-white rounded-lg px-5 py-2 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Reflection'}
        </button>
      </div>
    </div>
  );
}