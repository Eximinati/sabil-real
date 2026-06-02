import { cookies } from 'next/headers';
import { validateRedirectPath } from './redirect-utils';

const OAUTH_STATE_COOKIE = 'oauth-state';

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

export { validateRedirectPath };
