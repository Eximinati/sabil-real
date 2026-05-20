import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

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
        // Check if user_preferences record exists and onboarding status
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();
        
        // If no prefs record exists, create one and send to onboarding
        if (!prefs) {
          // Create default preferences for new user
          await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              onboarding_completed: false,
            });
          
          return NextResponse.redirect(`${url.origin}/onboarding`);
        }
        
        // If prefs exists but onboarding not completed, send to onboarding
        if (!prefs.onboarding_completed) {
          return NextResponse.redirect(`${url.origin}/onboarding`);
        }
      }
      
      // Use provided next or go to journey
      return NextResponse.redirect(`${url.origin}${next || '/journey'}`);
    }
  }

  return NextResponse.redirect(`${url.origin}/login?error=auth`);
}