import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

let redis: Redis | null = null;
if (redisConfigured) {
  redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
}

export const limits = {
  auth: { tokens: 5, window: '60s', description: '5 req/min' },
  search: { tokens: 10, window: '60s', description: '10 req/min' },
  reflection: { tokens: 20, window: '60s', description: '20 req/min' },
  bookmark: { tokens: 30, window: '60s', description: '30 req/min' },
  default: { tokens: 100, window: '60s', description: '100 req/min' },
};

const ratelimiters = new Map<string, Ratelimit>();

function getRatelimiter(identifier: string, config: { tokens: number; window: string }): Ratelimit {
  const key = `${identifier}:${config.tokens}:${config.window}`;
  if (!ratelimiters.has(key)) {
    ratelimiters.set(
      key,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(config.tokens, config.window as `${number} ${'s' | 'ms' | 'm' | 'h' | 'd'}`),
        analytics: true,
        prefix: `sabil:ratelimit:${identifier}`,
      })
    );
  }
  return ratelimiters.get(key)!;
}

export function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}

export function getRateLimitKey(request: NextRequest | Request, userId?: string): string {
  return userId || getClientIp(request);
}

export async function checkRateLimit(
  request: NextRequest | Request,
  endpoint: keyof typeof limits,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; reset: number } | null> {
  if (!redisConfigured || !redis) {
    return { allowed: true, remaining: 999, reset: 0 };
  }

  const config = limits[endpoint] || limits.default;
  const identifier = getRateLimitKey(request, userId);
  const ratelimit = getRatelimiter(endpoint, config);
  const result = await ratelimit.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitResponse(remaining: number, reset: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}

export function withRateLimit(
  handler: (request: NextRequest | Request, ...args: any[]) => Promise<NextResponse>,
  endpoint: keyof typeof limits
) {
  return async function rateLimitedHandler(request: NextRequest | Request, ...args: any[]): Promise<NextResponse> {
    const result = await checkRateLimit(request, endpoint);

    if (result && !result.allowed) {
      return rateLimitResponse(result.remaining, result.reset);
    }

    return handler(request, ...args);
  };
}
