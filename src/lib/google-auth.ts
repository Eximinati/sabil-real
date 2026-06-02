import { supabaseBrowser } from '@/lib/supabase-browser';
import { generateOAuthState, storeOAuthStateClient } from '@/lib/oauth-client-utils';

export async function signInWithGoogle() {
  const state = generateOAuthState();
  storeOAuthStateClient(state);

  return supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/journey`,
      queryParams: { state },
    },
  });
}
