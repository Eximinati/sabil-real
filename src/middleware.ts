import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  isSupportedLanguage,
  normalizeLanguage,
} from '@/lib/i18n/config';

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

export async function middleware(request: NextRequest) {
  const requestLanguage = normalizeLanguage(resolveRequestLanguage(request));

  let supabaseResponse = NextResponse.next({
    request,
  });

  supabaseResponse.cookies.set(LANGUAGE_COOKIE_NAME, requestLanguage, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  if (request.nextUrl.searchParams.has('lang')) {
    const redirectedUrl = request.nextUrl.clone();
    redirectedUrl.searchParams.delete('lang');
    const redirectResponse = NextResponse.redirect(redirectedUrl);
    redirectResponse.cookies.set(LANGUAGE_COOKIE_NAME, requestLanguage, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
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
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set(LANGUAGE_COOKIE_NAME, requestLanguage, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { pathname } = request.nextUrl;
    
    const publicPaths = ['/', '/login', '/register', '/test'];
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/api/auth'));
    
    const protectedPaths = ['/journey', '/quran', '/search', '/tafsir', '/hadith', '/settings'];
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));
    
    const adminPaths = ['/admin'];
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
    
    if (isAdminPath && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!isPublicPath && isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
