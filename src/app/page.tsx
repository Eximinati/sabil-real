import { PublicPageLogger } from '@/components/public-page-logger';
import { LandingContent } from '@/components/landing-content';

export const revalidate = 3600;

export const dynamic = 'force-static';

export const metadata = {
  title: 'Sabil — A Gentle Guided Journey',
  description: 'A gentle guided journey through Quran, Seerah, and reflection for anyone seeking to walk toward Allah one day at a time.',
  openGraph: {
    title: 'Sabil — A Gentle Guided Journey',
    description: 'A calm, beginner-friendly space for Quran, Seerah, and reflection.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sabil — A Gentle Guided Journey',
    description: 'A calm, beginner-friendly space for Quran, Seerah, and reflection.',
  },
};

const STATIC_BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
const STATIC_QURAN_65_3 = 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مِنْ أَمْرِهِ يُسْرًا';

const STATIC_CHAPTERS = [
  { id: 1, name_simple: 'Al-Fatiha', name_arabic: 'ٱلْفَاتِحَة', verses_count: 7 },
  { id: 2, name_simple: 'Al-Baqarah', name_arabic: 'ٱلْبَقَرَة', verses_count: 286 },
];

const STATIC_PREVIEW_DAYS = [
  { day: 1, title: "Why Are We Here?", topic: "Purpose & Creation" },
  { day: 2, title: "Who is Allah?", topic: "Names & Attributes" },
  { day: 3, title: "The First Revelation", topic: "Prophethood" },
  { day: 4, title: "What is the Quran?", topic: "Scripture" },
  { day: 5, title: "How to Read with Presence", topic: "Mindfulness" },
  { day: 6, title: "The Purpose of Prayer", topic: "Worship" },
  { day: 7, title: "Tawakkul — Trust in Allah", topic: "Reliance" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <PublicPageLogger pageName="Landing Page" />
      
      <LandingContent 
        staticChapters={STATIC_CHAPTERS}
        staticBismillah={STATIC_BISMILLAH}
        staticQuran65={STATIC_QURAN_65_3}
        previewDays={STATIC_PREVIEW_DAYS}
      />
    </div>
  );
}
