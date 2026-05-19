'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userEmail: string;
  isFocusMode?: boolean;
  onThemeToggle?: () => void;
  onSignOut?: () => void;
}

const navItems = [
  { href: '/journey', label: 'Journey', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', primary: true },
  { href: '/journey/reflections', label: 'Reflections', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { href: '/quran', label: 'Quran', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { href: '/tafsir', label: 'Tafsir', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/hadith', label: 'Hadith', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/bookmarks', label: 'Bookmarks', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
  { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function SidebarSkeleton({ email }: { email: string }) {
  return (
    <aside className="w-[240px] bg-[var(--sidebar-bg)] text-white flex flex-col fixed h-screen hidden md:flex">
      <div className="p-6 pt-7">
        <h1 className="text-[20px] font-semibold">Sabil</h1>
        <p className="font-arabic text-white/60 text-sm mt-1" dir="rtl">سبيل</p>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <div className="px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Learning</span>
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Journey
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Reflections
        </div>
        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Reference</span>
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Quran
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Tafsir
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Hadith
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Bookmarks
        </div>
        <div className="flex items-center gap-[10px] px-4 py-[11px] rounded-lg text-white/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </div>
      </nav>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Theme
        </div>
        <p className="text-white/60 text-sm truncate">{email}</p>
        <div className="flex items-center gap-2 text-white/60 text-sm">
          Sign out
        </div>
      </div>
    </aside>
  );
}

export const Sidebar = memo(function Sidebar({ userEmail: email, isFocusMode = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={`${
        isFocusMode ? 'w-0 opacity-0' : 'w-[240px] opacity-100'
      } bg-[var(--sidebar-bg)] text-white flex flex-col fixed h-screen hidden md:flex transition-all duration-300 ease-in-out overflow-hidden`}
    >
      <div className="p-6 pt-7">
        <h1 className="text-[20px] font-semibold">Sabil</h1>
        <p className="font-arabic text-white/60 text-sm mt-1" dir="rtl">سبيل</p>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <div className="px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Learning</span>
        </div>
        
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-[10px] px-4 py-[11px] rounded-lg transition-all ${
                isActive
                  ? item.primary
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold shadow-lg shadow-[var(--color-primary)]/30'
                    : 'bg-white/20 text-white font-medium'
                  : item.primary
                    ? 'text-white/90 hover:text-white hover:bg-white/15 hover:shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
        
        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Reference</span>
        </div>
        
        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-[10px] px-4 py-[11px] rounded-lg transition-all ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-3">
        <SidebarActions />
        <p className="text-white/60 text-sm truncate" title={email}>{email}</p>
        <SidebarSignOut />
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

function SidebarActions() {
  const { ThemeToggle } = require('./theme-toggle');
  return <ThemeToggle />;
}

function SidebarSignOut() {
  const { SignOutButton } = require('./signout-button');
  return <SignOutButton />;
}