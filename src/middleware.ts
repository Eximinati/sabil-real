import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  isSupportedLanguage,
  normalizeLanguage,
} from '@/lib/i18n/config';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

function resolveRequestLanguage(request: NextRequest) {
  const queryLanguage = request.nextUrl.searchParams.get('lang');
  if (isSupportedLanguage(queryLanguage)) {
    return queryLanguage;
  }

  const cookieLanguage = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;
  if (isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  const accept = request.headers.get('accept-language');
  if (accept) {
    const candidate = accept
      .split(',')
      .map((token) => token.trim().split(';')[0]?.toLowerCase())
      .map((token) => token.split('-')[0])
      .find((token) => isSupportedLanguage(token));

    if (candidate) {
      return candidate;
    }
  }

  return DEFAULT_LANGUAGE;
}

function setLanguageCookie(response: NextResponse, language: string) {
  response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}

export async function middleware(request: NextRequest) {
  let requestLanguage = normalizeLanguage(resolveRequestLanguage(request));

  request.cookies.set(LANGUAGE_COOKIE_NAME, requestLanguage);

  let supabaseResponse = NextResponse.next({
    request,
  });

  setLanguageCookie(supabaseResponse, requestLanguage);

  if (!request.cookies.get('csrf-token')?.value) {
    setCsrfCookie(supabaseResponse, generateCsrfToken());
  }

  if (request.nextUrl.searchParams.has('lang')) {
    const redirectedUrl = request.nextUrl.clone();
    redirectedUrl.searchParams.delete('lang');
    const redirectResponse = NextResponse.redirect(redirectedUrl);
    setLanguageCookie(redirectResponse, requestLanguage);
    return redirectResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('ui_language')
      .eq('user_id', user.id)
      .maybeSingle();

    if (preferences?.ui_language && isSupportedLanguage(preferences.ui_language) && preferences.ui_language !== requestLanguage) {
      requestLanguage = preferences.ui_language;
      setLanguageCookie(supabaseResponse, requestLanguage);
    }
  }

  const { pathname } = request.nextUrl;
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname === path + '/' || pathname.startsWith('/api/auth'));

  if (!user) {
    const protectedPaths = ['/journey', '/quran', '/search', '/tafsir', '/hadith', '/settings', '/bookmarks'];
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isPublicPath && isProtected) {
      const loginUrl = new URL('/login', request.url);
      const originalPath = request.nextUrl.pathname + request.nextUrl.search;
      if (originalPath !== '/login' && originalPath !== '/register') {
        loginUrl.searchParams.set('redirect', originalPath);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
