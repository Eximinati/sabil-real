'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useCopy } from '@/hooks/use-copy';

export default function ForgotPasswordPage() {
  const copy = useCopy();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError(copy.auth.errors.fillAllFields);
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(copy.auth.forgotPassword.errorGeneric);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <svg className="h-7 w-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{copy.auth.forgotPassword.successTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {copy.auth.forgotPassword.successDescription}
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary-hover)]"
        >
          {copy.auth.forgotPassword.backToLogin}
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-[var(--color-text)] text-center mb-2">
        {copy.auth.forgotPassword.title}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
        {copy.auth.forgotPassword.description}
      </p>

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
            placeholder={copy.auth.forgotPassword.emailPlaceholder}
            className="w-full px-[14px] py-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all border-l-4 border-l-transparent focus:border-l-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? copy.auth.forgotPassword.submitting : copy.auth.forgotPassword.submit}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <a href="/login" className="text-[var(--color-accent)] hover:underline">
          {copy.auth.forgotPassword.backToLogin}
        </a>
      </p>
    </div>
  );
}
