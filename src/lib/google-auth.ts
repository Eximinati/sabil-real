import { supabaseBrowser } from '@/lib/supabase-browser';

export async function signInWithGoogle() {
  return supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/journey`,
    },
  });
}