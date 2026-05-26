'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { signInWithGoogle } from '@/lib/google-auth';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const copy = useCopy();
  const { setLanguage, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(copy.auth.errors.enterEmailPassword);
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Check onboarding status after successful login
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      
      if (user) {
        const { data: prefs } = await supabaseBrowser
          .from('user_preferences')
          .select('onboarding_completed, ui_language')
          .eq('user_id', user.id)
          .single();

        const preferredLanguage =
          prefs?.ui_language === 'en' || prefs?.ui_language === 'ur'
            ? prefs.ui_language
            : language;

        setLanguage(preferredLanguage);
        
        // Redirect based on onboarding status
        if (!prefs?.onboarding_completed) {
          router.push('/onboarding');
        } else {
          router.push('/journey');
        }
      } else {
        router.push('/journey');
      }
      
      router.refresh();
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-semibold text-[var(--color-primary)]">Sabil</h1>
        <p className="font-arabic text-[var(--color-accent)] text-lg mt-1" dir="rtl">سبيل</p>
      </div>

      <p className="text-[var(--color-text)] font-medium mb-1">{copy.auth.login.welcomeBack}</p>
      <p className="text-[var(--color-text-muted)] text-sm mb-6">{copy.auth.login.continueJourney}</p>

      {error && (
        <div className="mb-4 text-sm text-[var(--color-error)] animate-fade-in">
          {error}
        </div>
      )}

<div className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.auth.login.emailPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.auth.login.passwordPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {copy.auth.login.signingIn}
            </>
          ) : (
            copy.auth.login.signIn
          )}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--color-bg)] px-2 text-[var(--color-text-muted)]">{copy.auth.shared.or}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-[var(--color-surface)] text-[var(--color-text)] py-3 rounded-lg font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {copy.auth.shared.continueWithGoogle}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        {copy.auth.login.noAccount}{' '}
        <a href="/register" className="text-[var(--color-accent)] hover:underline">
          {copy.auth.login.register}
        </a>
      </p>
    </div>
  );
}
