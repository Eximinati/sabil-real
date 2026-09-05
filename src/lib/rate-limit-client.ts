const RATE_LIMIT_FETCH_TIMEOUT_MS = 5000;

/**
 * Calls /api/auth/check-rate-limit and reports whether the attempt is
 * allowed. Always resolves — never throws and never hangs — so a caller can
 * safely `await` it inside a try/finally that resets a loading spinner.
 * Any failure (network error, timeout, non-JSON response) fails open,
 * since a broken rate-limit check must never block sign-in/sign-up.
 */
export async function checkAuthRateLimit(): Promise<{ allowed: boolean; message?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RATE_LIMIT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('/api/auth/check-rate-limit', {
      method: 'POST',
      signal: controller.signal,
    });

    if (response.ok) {
      return { allowed: true };
    }

    try {
      const data = await response.json();
      return { allowed: false, message: data.error || 'Too many attempts. Please try again later.' };
    } catch {
      return { allowed: false, message: 'Too many attempts. Please try again later.' };
    }
  } catch {
    // Network failure, timeout/abort, or anything else — don't block the
    // user's attempt on our own rate-limit plumbing being unavailable.
    return { allowed: true };
  } finally {
    clearTimeout(timeoutId);
  }
}
