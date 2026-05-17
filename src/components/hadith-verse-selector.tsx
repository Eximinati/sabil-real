'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

interface HadithVerseSelectorProps {
  chapters: Chapter[];
}

export function HadithVerseSelector({ chapters }: HadithVerseSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedSurah, setSelectedSurah] = useState(searchParams.get('surah') || '1');
  const [selectedVerse, setSelectedVerse] = useState(searchParams.get('verse') || '1');

  const currentChapter = chapters.find((c) => c.id === parseInt(selectedSurah, 10));
  const maxVerse = currentChapter?.verses_count || 1;

  const handleSubmit = () => {
    const params = new URLSearchParams();
    params.set('surah', selectedSurah);
    params.set('verse', selectedVerse);
    router.push(`/hadith?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end justify-center mb-8">
      <div>
        <label className="block text-sm text-[#6B7280] mb-1">Surah</label>
        <select
          value={selectedSurah}
          onChange={(e) => {
            setSelectedSurah(e.target.value);
            const chapter = chapters.find((c) => c.id === parseInt(e.target.value, 10));
            if (chapter && parseInt(selectedVerse, 10) > chapter.verses_count) {
              setSelectedVerse('1');
            }
          }}
          className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F] min-w-[200px]"
        >
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.id}. {chapter.name_simple}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm text-[#6B7280] mb-1">Verse</label>
        <input
          type="number"
          value={selectedVerse}
          onChange={(e) => setSelectedVerse(e.target.value)}
          min={1}
          max={maxVerse}
          className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F] w-24"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1B4332] transition-colors"
      >
        Find Hadith
      </button>
    </div>
  );
}