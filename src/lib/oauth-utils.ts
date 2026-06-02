import { cookies } from 'next/headers';

const OAUTH_STATE_COOKIE = 'oauth-state';
const ALLOWED_REDIRECT_PATHS = ['/journey', '/onboarding'];

export async function validateOAuthState(
  stateParam: string | null
): Promise<{ valid: boolean }> {
  if (!stateParam) {
    console.error('OAuth state parameter missing');
    return { valid: false };
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!storedState) {
    console.error('OAuth state cookie missing');
    return { valid: false };
  }

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (stateParam !== storedState) {
    console.error('OAuth state mismatch');
    return { valid: false };
  }

  return { valid: true };
}

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

  if (!ALLOWED_REDIRECT_PATHS.includes(path)) {
    return '/journey';
  }

  return path;
}
