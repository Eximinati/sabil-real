'use client';

import { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFocusMode } from './focus-mode-provider';
import { LanguageSwitcher } from './language-switcher';
import { useCopy } from '@/hooks/use-copy';

interface AppShellProps {
  children: React.ReactNode;
  userEmail: string;
}

const navItems = [
  { href: '/journey', labelKey: 'today', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', primary: true },
  { href: '/journey/reflections', labelKey: 'reflections', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', primary: true },
  { href: '/quran', labelKey: 'quran', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', primary: false },
  { href: '/search', labelKey: 'search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', primary: false },
  { href: '/tafsir', labelKey: 'tafsir', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', primary: false },
  { href: '/hadith', labelKey: 'hadith', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', primary: false },
  { href: '/bookmarks', labelKey: 'bookmarks', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', primary: false },
  { href: '/settings', labelKey: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', primary: false },
];

function getNavLabel(labelKey: string, copy: ReturnType<typeof useCopy>) {
  const nav = copy.appShell.nav;
  if (labelKey === 'today') return nav.today;
  if (labelKey === 'reflections') return nav.reflections;
  if (labelKey === 'quran') return nav.quran;
  if (labelKey === 'search') return nav.search;
  if (labelKey === 'tafsir') return nav.tafsir;
  if (labelKey === 'hadith') return nav.hadith;
  if (labelKey === 'bookmarks') return nav.bookmarks;
  return nav.settings;
}

const NavItem = memo(function NavItem({ href, isPrimary, children }: { href: string; isPrimary?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex items-center gap-[10px] px-4 py-[11px] rounded-lg transition-all ${
        isActive
          ? isPrimary
            ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold shadow-lg shadow-[var(--color-primary)]/30'
            : 'bg-white/20 text-white font-medium'
          : isPrimary
            ? 'text-white/90 hover:text-white hover:bg-white/15 hover:shadow-md'
            : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

function DesktopSidebar({ email }: { email: string }) {
  const { isFocusMode } = useFocusMode();
  const copy = useCopy();
  
  return (
    <aside 
      className={`${
        isFocusMode ? 'w-0 opacity-0' : 'w-[240px] opacity-100'
      } bg-[var(--sidebar-bg)] text-white flex flex-col fixed h-screen hidden md:flex transition-all duration-300 ease-in-out overflow-hidden`}
    >
      <div className="p-6 pt-7">
        <h1 className="text-[20px] font-semibold">Sabil</h1>
        <p className="font-arabic text-white/60 text-sm mt-1" dir="rtl">سبيل</p>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          {copy.appShell.sidebar.devotionalLine}
        </p>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <div className="px-3 py-2">
          <span className="text-xs text-white/40 font-medium">{copy.appShell.sidebar.guidedJourney}</span>
        </div>
        <NavItem href="/journey" isPrimary>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {copy.appShell.nav.today}
        </NavItem>
        <NavItem href="/journey/reflections" isPrimary>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {copy.appShell.nav.reflections}
        </NavItem>
        <div className="px-3 py-2 mt-4">
          <span className="text-xs text-white/40 font-medium">{copy.appShell.sidebar.readAndExplore}</span>
        </div>
        <NavItem href="/quran">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {copy.appShell.nav.quran}
        </NavItem>
        <NavItem href="/search">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {copy.appShell.nav.search}
        </NavItem>
        <NavItem href="/tafsir">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {copy.appShell.nav.tafsir}
        </NavItem>
        <NavItem href="/hadith">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {copy.appShell.nav.hadith}
        </NavItem>
        <NavItem href="/bookmarks">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {copy.appShell.nav.bookmarks}
        </NavItem>
        <NavItem href="/settings">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {copy.appShell.nav.settings}
        </NavItem>
      </nav>

      <div className="p-4 space-y-3 border-t border-white/10">
        <LanguageSwitcher compact />
        <ThemeToggle />
        <p className="text-white/60 text-sm truncate" title={email}>{email}</p>
        <SignOutButton />
      </div>
    </aside>
  );
}

function MobileNav({ email, onClose }: { email: string; onClose: () => void }) {
  const pathname = usePathname();
  const copy = useCopy();

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[var(--sidebar-bg)] text-white flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-[20px] font-semibold">Sabil</h1>
            <p className="font-arabic text-white/60 text-sm mt-1" dir="rtl">سبيل</p>
            <p className="mt-3 max-w-[180px] text-sm leading-relaxed text-white/55">
              {copy.appShell.sidebar.quietLine}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label={copy.appShell.sidebar.closeMenu}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-px bg-white/10 mx-4 mt-4" />

        <nav className="flex-1 px-2 pt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-[10px] px-4 py-[11px] rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={getNavLabel(item.labelKey, copy)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {getNavLabel(item.labelKey, copy)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3 border-t border-white/10">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <p className="text-white/60 text-sm truncate" title={email}>{email}</p>
          <SignOutButton />
        </div>
      </aside>
    </div>
  );
}

function ThemeToggle() {
  const { ThemeToggle: ToggleComponent } = require('./theme-toggle');
  return <ToggleComponent />;
}

function SignOutButton() {
  const { SignOutButton: ButtonComponent } = require('./signout-button');
  return <ButtonComponent />;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isFocusMode } = useFocusMode();
  const copy = useCopy();

  const handleMobileNavClose = useCallback(() => setMobileNavOpen(false), []);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <DesktopSidebar email={userEmail} />

      <button
        onClick={() => setMobileNavOpen(true)}
        className={`fixed top-4 left-4 z-50 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/92 p-3 text-[var(--color-text)] shadow-md backdrop-blur-sm md:hidden transition-all duration-300 hover:border-[var(--color-primary)]/40 ${
          isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label={copy.appShell.sidebar.openMenu}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileNavOpen && <MobileNav email={userEmail} onClose={handleMobileNavClose} />}

      <main 
        id="main-content"
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isFocusMode ? 'md:ml-0' : 'md:ml-[240px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
