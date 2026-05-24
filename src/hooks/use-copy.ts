'use client';

import { useLanguage } from '@/lib/i18n/context';
import { interpolate } from '@/lib/i18n/format';

export function useCopy() {
  const { dictionary } = useLanguage();
  return dictionary;
}

export function useI18nText() {
  return {
    interpolate,
  };
}
