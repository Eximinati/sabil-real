import type { Metadata } from 'next';
import { Inter, Amiri } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AudioPlayerProvider } from '@/components/audio-player-provider';
import { FocusModeProvider } from '@/components/focus-mode-provider';

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

export const metadata: Metadata = {
  title: 'Sabil — Your Quran Companion',
  description: 'A guided journey through the Quran. Read, reflect, and grow in understanding one day at a time.',
  keywords: ['Quran', 'Islam', 'Tafsir', 'Hadith', 'Islamic Learning', 'Daily Reading'],
  authors: [{ name: 'Sabil' }],
  openGraph: {
    title: 'Sabil — Your Quran Companion',
    description: 'A guided journey through the Quran. Read, reflect, and grow in understanding one day at a time.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Sabil — Your Quran Companion',
    description: 'A guided journey through the Quran.',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <html lang="en" className={`${inter.variable} ${amiri.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AudioPlayerProvider>
              <FocusModeProvider>
                {children}
              </FocusModeProvider>
            </AudioPlayerProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}