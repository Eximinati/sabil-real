const ALLOWED_REDIRECT_PATHS = [
  '/journey', '/onboarding', '/quran', '/search', '/tafsir', '/hadith', '/settings', '/bookmarks',
];

export function validateRedirectPath(
  path: string | null
): string {
  if (!path) return '/journey';

  if (!path.startsWith('/')) {
    return '/journey';
  }

  if (path.includes('..') || path.includes('//') || path.includes(':')) {
    return '/journey';
  }

  if (path.length > 200) {
    return '/journey';
  }

  if (!ALLOWED_REDIRECT_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
    return '/journey';
  }

  return path;
}

export function isValidRedirectPath(path: string): boolean {
  return validateRedirectPath(path) === path;
}
