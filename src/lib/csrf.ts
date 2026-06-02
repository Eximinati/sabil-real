import { NextResponse } from 'next/server';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE, token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (name) result[name] = value;
  }
  return result;
}

export function validateCsrf(request: Request): { valid: boolean } {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return { valid: true };
      }
    } catch {
      return { valid: false };
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return { valid: true };
      }
    } catch {
      return { valid: false };
    }
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = request.headers.get(CSRF_HEADER);

  if (cookieToken && headerToken && cookieToken === headerToken) {
    return { valid: true };
  }

  return { valid: false };
}

export function csrfErrorResponse(): NextResponse {
  console.error('CSRF validation failed');
  return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
}
