'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { signInWithGoogle } from '@/lib/google-auth';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

export default function RegisterPage() {
  const router = useRouter();
  const copy = useCopy();
  const { language } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError(copy.auth.errors.fillAllFields);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.auth.errors.passwordsMismatch);
      return;
    }

    if (password.length < 8) {
      setError(copy.auth.errors.passwordMin);
      return;
    }

    setLoading(true);

    const rateCheck = await fetch('/api/auth/check-rate-limit', { method: 'POST' });
    if (!rateCheck.ok) {
      const rateData = await rateCheck.json();
      setError(rateData.error || 'Too many attempts. Please try again later.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          language_code: language,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      setRegistered(true);
    }
  };

  const handleGoogleSignUp = async () => {
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

      <p className="text-[var(--color-text)] font-medium mb-1">{copy.auth.register.createAccount}</p>
      <p className="text-[var(--color-text-muted)] text-sm mb-6">{copy.auth.register.beginJourney}</p>

      {registered ? (
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <svg className="h-7 w-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{copy.auth.register.confirmationTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {copy.auth.register.confirmationGuide}
          </p>
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            {copy.auth.register.confirmationEmailSent}: {email}
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary-hover)]"
          >
            {copy.auth.register.signIn}
          </a>
        </div>
      ) : (
        <>
      {error && (
        <div className="mb-4 text-sm text-[var(--color-error)] animate-fade-in">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={copy.auth.register.fullNamePlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.auth.register.emailPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.auth.register.passwordPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={copy.auth.register.confirmPasswordPlaceholder}
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
              {copy.auth.register.creatingAccount}
            </>
          ) : (
            copy.auth.register.createAccountButton
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
          onClick={handleGoogleSignUp}
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
        </>
      )}

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        {copy.auth.register.haveAccount}{' '}
        <a href="/login" className="text-[var(--color-accent)] hover:underline">
          {copy.auth.register.signIn}
        </a>
      </p>
    </div>
  );
}
