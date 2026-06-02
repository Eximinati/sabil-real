'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useCopy } from '@/hooks/use-copy';

export default function ResetPasswordPage() {
  const router = useRouter();
  const copy = useCopy();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setReady(true);
    }
  }, []);

  const handleSubmit = async () => {
    setError('');

    if (!password || !confirmPassword) {
      setError(copy.auth.resetPassword.errorGeneric);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.auth.resetPassword.errorMismatch);
      return;
    }

    if (password.length < 8) {
      setError(copy.auth.resetPassword.errorMinLength);
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(copy.auth.resetPassword.errorGeneric);
    } else {
      setSuccess(true);
    }
  };

  if (!ready && !success) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-muted)] text-sm">{copy.common.labels.loading}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <svg className="h-7 w-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{copy.auth.resetPassword.successTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {copy.auth.resetPassword.successDescription}
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary-hover)]"
        >
          {copy.auth.resetPassword.backToLogin}
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-[var(--color-text)] text-center mb-2">
        {copy.auth.resetPassword.title}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
        {copy.auth.resetPassword.description}
      </p>

      {error && (
        <div className="mb-4 text-sm text-[var(--color-error)] animate-fade-in">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.auth.resetPassword.newPasswordPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={copy.auth.resetPassword.confirmPasswordPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? copy.auth.resetPassword.submitting : copy.auth.resetPassword.submit}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <a href="/login" className="text-[var(--color-accent)] hover:underline">
          {copy.auth.resetPassword.backToLogin}
        </a>
      </p>
    </div>
  );
}
