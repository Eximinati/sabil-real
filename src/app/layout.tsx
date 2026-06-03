import type { Metadata } from 'next';
import { Inter, Amiri, Noto_Nastaliq_Urdu } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AudioPlayerProvider } from '@/components/audio-player-provider';
import { FocusModeProvider } from '@/components/focus-mode-provider';
import { FloatingNotice } from '@/components/floating-notice';
import { GlobalRouteProgress } from '@/components/global-route-progress';
import { LanguageProvider } from '@/lib/i18n/context';
import { LANGUAGE_COOKIE_NAME, normalizeLanguage } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-amiri',
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-urdu',
});

export const metadata: Metadata = {
  title: {
    default: 'Sabil — A Gentle Guided Journey | سبیل',
    template: '%s | Sabil',
  },
  description: 'A gentle multilingual space for Quran, Seerah, and reflection - spiritually grounded, beginner-friendly, and emotionally safe.',
  keywords: ['Quran', 'Islam', 'Tafsir', 'Hadith', 'Islamic Learning', 'Daily Reading'],
  authors: [{ name: 'Sabil' }],
  openGraph: {
    title: 'Sabil — A Gentle Guided Journey | سبیل',
    description: 'A multilingual, spiritually grounded reading companion for Quran, Seerah, and reflection.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ur_PK'],
  },
  twitter: {
    card: 'summary',
    title: 'Sabil — A Gentle Guided Journey | سبیل',
    description: 'A multilingual, spiritually grounded reading companion for Quran, Seerah, and reflection.',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLanguage = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const initialDictionary = await getDictionary(initialLanguage);

  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('sabil-theme');
        var theme = stored || 'system';
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;

  const languageScript = `
    (function() {
      try {
        var stored = localStorage.getItem('sabil-language');
        var cookieMatch = document.cookie.match(/(?:^|; )sabil-language=([^;]+)/);
        var fromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
        var nextLanguage = stored || fromCookie || 'en';
        if (nextLanguage !== 'en' && nextLanguage !== 'ur') {
          nextLanguage = 'en';
        }
        document.documentElement.setAttribute('lang', nextLanguage);
        document.documentElement.setAttribute('dir', nextLanguage === 'ur' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('data-language', nextLanguage);
        if (!stored || stored !== nextLanguage) {
          localStorage.setItem('sabil-language', nextLanguage);
        }
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang={initialLanguage}
      dir={initialLanguage === 'ur' ? 'rtl' : 'ltr'}
      data-language={initialLanguage}
      className={`${inter.variable} ${amiri.variable} ${notoNastaliqUrdu.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
      </head>
      <body>
        <LanguageProvider initialLanguage={initialLanguage} initialDictionary={initialDictionary}>
          <ThemeProvider>
            <ToastProvider>
              <AudioPlayerProvider>
                <FocusModeProvider>
                  {children}
                  <GlobalRouteProgress />
                  <FloatingNotice />
                </FocusModeProvider>
              </AudioPlayerProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
