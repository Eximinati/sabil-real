import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { LANGUAGE_COOKIE_NAME, normalizeLanguage } from '@/lib/i18n/config';

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
  const next = url.searchParams.get('next');

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const metadataLanguage = normalizeLanguage((user.user_metadata?.preferred_language as string | undefined) ?? null);
        // Check if user_preferences record exists and onboarding status
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('onboarding_completed, ui_language')
          .eq('user_id', user.id)
          .single();

        const preferredLanguage =
          prefs?.ui_language === 'en' || prefs?.ui_language === 'ur'
            ? prefs.ui_language
            : metadataLanguage;
        
        // If no prefs record exists, create one and send to onboarding
        if (!prefs) {
          // Create default preferences for new user
          await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              onboarding_completed: false,
            });
          
          return redirectWithLanguage(`${url.origin}/onboarding`, preferredLanguage);
        }
        
        // If prefs exists but onboarding not completed, send to onboarding
        if (!prefs.onboarding_completed) {
          return redirectWithLanguage(`${url.origin}/onboarding`, preferredLanguage);
        }

        // Use provided next or go to journey
        return redirectWithLanguage(`${url.origin}${next || '/journey'}`, preferredLanguage);
      }
    }
  }

  return NextResponse.redirect(`${url.origin}/login?error=auth`);
}
