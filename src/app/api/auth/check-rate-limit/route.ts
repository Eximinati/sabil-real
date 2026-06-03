import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
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
}
