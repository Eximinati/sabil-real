import { supabaseBrowser } from '@/lib/supabase-browser';
import { generateOAuthState, storeOAuthStateClient } from '@/lib/oauth-client-utils';

export async function signInWithGoogle() {
  const state = generateOAuthState();
  storeOAuthStateClient(state);

  const currentPath = window.location.pathname + window.location.search;
  const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(currentPath)}`;

  return supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { state },
    },
  });
}
