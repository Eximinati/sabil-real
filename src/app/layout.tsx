import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AudioPlayerProvider } from '@/components/audio-player-provider';
import { FocusModeProvider } from '@/components/focus-mode-provider';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Amiri:ital,wght@0,400;0,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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