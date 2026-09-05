import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const result = await checkRateLimit(request, 'auth');

    if (result && !result.allowed) {
      return Response.json(
        {
          allowed: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
          },
        }
      );
    }

    return Response.json({ allowed: true });
  } catch (error) {
    // Fail open: a broken or unreachable rate-limit backend (e.g. bad Upstash
    // credentials) must never block sign-in. Without this, a thrown error here
    // returns a non-JSON error page, the client's `.json()` parse throws, and
    // an unhandled rejection leaves the calling page's loading spinner stuck
    // forever since it never reaches setLoading(false).
    console.error('Rate limit check failed, allowing request:', error);
    return Response.json({ allowed: true });
  }
}
