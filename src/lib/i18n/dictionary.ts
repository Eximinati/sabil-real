import { DEFAULT_LANGUAGE, type LanguageCode } from './config';
import { EN_COPY } from './dictionaries/en';
import type { AppCopy, DeepPartial } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep<T>(base: T, partial?: DeepPartial<T>): T {
  if (!partial) return base;

  if (Array.isArray(base)) {
    return (Array.isArray(partial) ? partial : base) as T;
  }

  if (!isPlainObject(base) || !isPlainObject(partial)) {
    return (partial as T) ?? base;
  }

  const merged: Record<string, unknown> = { ...base };

  for (const key of Object.keys(partial)) {
    const baseValue = (base as Record<string, unknown>)[key];
    const partialValue = partial[key as keyof typeof partial] as unknown;

    if (partialValue === undefined) {
      continue;
    }

    if (Array.isArray(baseValue)) {
      merged[key] = Array.isArray(partialValue) ? partialValue : baseValue;
      continue;
    }

    if (isPlainObject(baseValue) && isPlainObject(partialValue)) {
      merged[key] = mergeDeep(baseValue, partialValue);
      continue;
    }

    merged[key] = partialValue;
  }

  return merged as T;
}

export async function getDictionary(language: LanguageCode): Promise<AppCopy> {
  if (language === DEFAULT_LANGUAGE) {
    return EN_COPY;
  }

  const { UR_COPY } = await import('./dictionaries/ur');
  return mergeDeep(EN_COPY, UR_COPY as DeepPartial<AppCopy>);
}
