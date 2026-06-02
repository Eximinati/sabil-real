import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { LANGUAGE_COOKIE_NAME, normalizeLanguage } from '@/lib/i18n/config';
import { validateOAuthState, validateRedirectPath } from '@/lib/oauth-utils';

function redirectWithLanguage(targetUrl: string, languageInput?: string | null) {
  const language = normalizeLanguage(languageInput);
  const response = NextResponse.redirect(targetUrl);
  response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const next = url.searchParams.get('next');

  if (code) {
    if (state) {
      const stateResult = await validateOAuthState(state);
      if (!stateResult.valid) {
        console.error('OAuth state validation failed');
        return NextResponse.redirect(new URL('/login?error=auth', url.origin));
      }
    }

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const metadataLanguage = normalizeLanguage((user.user_metadata?.preferred_language as string | undefined) ?? null);
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('onboarding_completed, ui_language')
          .eq('user_id', user.id)
          .maybeSingle();

        const preferredLanguage =
          prefs?.ui_language === 'en' || prefs?.ui_language === 'ur'
            ? prefs.ui_language
            : metadataLanguage;

        if (!prefs) {
          await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              onboarding_completed: false,
            });

          return redirectWithLanguage(`${url.origin}/onboarding`, preferredLanguage);
        }

        if (!prefs.onboarding_completed) {
          return redirectWithLanguage(`${url.origin}/onboarding`, preferredLanguage);
        }

        const safePath = validateRedirectPath(next);
        return redirectWithLanguage(`${url.origin}${safePath}`, preferredLanguage);
      }
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', url.origin));
}
