import { getChapters } from '@/lib/qf-api';
import { HadithPageContent } from '@/components/hadith-page-content';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

export const dynamic = 'force-dynamic';

export default async function HadithPage({
  searchParams,
}: {
  searchParams: Promise<{ surah?: string; verse?: string }>;
}) {
  const { surah, verse } = await searchParams;

  const chaptersRes = await fetch(
    process.env.NODE_ENV === 'production' ? '/api/chapters' : 'http://localhost:3000/api/chapters',
    { cache: 'no-store' }
  );
  const chaptersData = await chaptersRes.json();
  const chapters = (Array.isArray(chaptersData) ? chaptersData : []) as Chapter[];

  return (
    <HadithPageContent
      chapters={chapters}
      initialSurah={surah}
      initialVerse={verse}
    />
  );
}