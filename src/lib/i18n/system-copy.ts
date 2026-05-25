import { normalizeLanguage } from './config';

export function getSystemCopy(languageInput: string | null | undefined) {
  const language = normalizeLanguage(languageInput);

  if (language === 'ur') {
    return {
      globalError: {
        title: 'ابھی کچھ ٹھیک سے نہیں ہو سکا',
        description: 'عارضی خلل پیش آیا ہے۔ ذرا سکون سے دوبارہ کوشش کریں۔',
        retry: 'دوبارہ کوشش کریں',
        verse: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',
      },
      notFound: {
        title: 'یہ صفحہ نہیں ملا',
        description: 'شاید یہ صفحہ منتقل ہو گیا ہے یا دستیاب نہیں رہا۔',
        goToJourney: 'سفر پر واپس جائیں',
        verse: 'وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      },
      journeyError: {
        title: 'سفر ابھی نہیں کھل سکا',
        description: 'ذرا دیر بعد دوبارہ کھولیں۔',
        retry: 'دوبارہ کوشش کریں',
      },
      quranError: {
        title: 'یہ سورت ابھی نہیں کھل سکی',
        description: 'براہ کرم کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
        retry: 'دوبارہ کوشش کریں',
      },
      searchError: {
        title: 'تلاش مکمل نہیں ہو سکی',
        description: 'براہ کرم کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
        retry: 'دوبارہ کوشش کریں',
      },
      tafsirError: {
        title: 'تفسیر ابھی نہیں کھل سکی',
        description: 'تفسیر کا متن اس وقت نہیں آ سکا۔ دوبارہ کوشش کریں۔',
        retry: 'دوبارہ کوشش کریں',
      },
      hadithError: {
        title: 'حدیث ابھی نہیں کھل سکی',
        description: 'براہ کرم دوبارہ کوشش کریں۔',
        retry: 'دوبارہ کوشش کریں',
      },
    };
  }

  return {
    globalError: {
      title: 'Something went wrong',
      description: 'A temporary issue appeared. Please try again gently.',
      retry: 'Try again',
      verse: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',
    },
    notFound: {
      title: 'Page not found',
      description: 'This page may have moved or is no longer available.',
      goToJourney: 'Go to Journey',
      verse: 'وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    },
    journeyError: {
      title: "Couldn't load your journey",
      description: 'Please try again in a moment.',
      retry: 'Try again',
    },
    quranError: {
      title: "Couldn't load this surah",
      description: 'Please check your connection and try again.',
      retry: 'Try again',
    },
    searchError: {
      title: 'Search could not finish',
      description: 'Please check your connection and try again.',
      retry: 'Try again',
    },
    tafsirError: {
      title: "Couldn't load tafsir",
      description: 'We could not retrieve this explanation right now. Please try again.',
      retry: 'Try again',
    },
    hadithError: {
      title: "Couldn't load hadith",
      description: 'Please try again in a moment.',
      retry: 'Try again',
    },
  };
}

export function getSystemCopyFromClient() {
  if (typeof window === 'undefined') {
    return getSystemCopy('en');
  }

  const stored = window.localStorage.getItem('sabil-language');
  const cookieMatch = document.cookie.match(/(?:^|; )sabil-language=([^;]+)/);
  const fromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  return getSystemCopy(stored || fromCookie);
}
