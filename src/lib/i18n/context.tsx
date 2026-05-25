'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDictionary } from './dictionary';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type LanguageCode,
} from './config';
import type { AppCopy } from './types';

interface LanguageContextValue {
  language: LanguageCode;
  dictionary: AppCopy;
  isHydrated: boolean;
  setLanguage: (nextLanguage: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function setDocumentLanguage(language: LanguageCode) {
  const root = document.documentElement;
  root.lang = language;
  root.setAttribute('data-language', language);
  root.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
}

function writeLanguageCookie(language: LanguageCode) {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: LanguageCode;
}) {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setDocumentLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    const next = initialLanguage || DEFAULT_LANGUAGE;

    setLanguageState(next);
    setDocumentLanguage(next);
    writeLanguageCookie(next);
    const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (stored !== next) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    }
    setIsHydrated(true);
  }, [initialLanguage]);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    setDocumentLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    writeLanguageCookie(nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    dictionary: getDictionary(language),
    isHydrated,
    setLanguage,
  }), [isHydrated, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
