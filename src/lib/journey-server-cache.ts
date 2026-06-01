const LOG_PREFIX = '[JourneyCache]';
const IS_DEBUG = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_JOURNEY_DEBUG === '1';
const log = IS_DEBUG
  ? (msg: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${msg}`, ...args)
  : () => {};

const DEFAULT_TTL_SECONDS = 300;

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  expirations: number;
  invalidations: number;
  size: number;
  maxEntries: number;
  ttlSeconds: number;
}

export class JourneyServerCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pending = new Map<string, Promise<unknown>>();
  private maxEntries: number;
  private ttlMs: number;
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private evictions = 0;
  private expirations = 0;
  private invalidations = 0;

  constructor(maxEntries = 50, ttlSeconds?: number) {
    this.maxEntries = maxEntries;
    const envTtl = process.env.JOURNEY_CACHE_TTL_SECONDS
      ? parseInt(process.env.JOURNEY_CACHE_TTL_SECONDS, 10)
      : undefined;
    this.ttlMs = (envTtl ?? ttlSeconds ?? DEFAULT_TTL_SECONDS) * 1000;
  }

  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        this.misses++;
        log(`MISS key=${key}`);
        return null;
      }

      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.expirations++;
        this.misses++;
        log(`EXPIRE key=${key}`);
        return null;
      }

      this.cache.delete(key);
      this.cache.set(key, entry);
      this.hits++;
      log(`HIT key=${key}`);
      return entry.data as T;
    } catch (e) {
      console.error(`${LOG_PREFIX} get error for key=${key}:`, e);
      this.misses++;
      return null;
    }
  }

  set<T>(key: string, data: T): void {
    try {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.maxEntries) {
        const oldest = this.cache.keys().next().value;
        if (oldest !== undefined) {
          this.cache.delete(oldest);
          this.evictions++;
          log(`EVICT key=${oldest}`);
        }
      }

      const now = Date.now();
      this.cache.set(key, {
        data,
        cachedAt: now,
        expiresAt: now + this.ttlMs,
      });
      this.sets++;
      log(`SET key=${key}`);
    } catch (e) {
      console.error(`${LOG_PREFIX} set error for key=${key}:`, e);
    }
  }

  invalidate(key: string): void {
    try {
      this.cache.delete(key);
      this.invalidations++;
      log(`INVALIDATE key=${key}`);
    } catch (e) {
      console.error(`${LOG_PREFIX} invalidate error for key=${key}:`, e);
    }
  }

  invalidateAll(): void {
    try {
      const count = this.cache.size;
      this.cache.clear();
      this.invalidations += count;
      log(`INVALIDATE all (${count} entries)`);
    } catch (e) {
      console.error(`${LOG_PREFIX} invalidateAll error:`, e);
    }
  }

  invalidatePattern(pattern: string): void {
    if (!pattern) {
      console.warn(`${LOG_PREFIX} invalidatePattern called with empty pattern — ignored`);
      return;
    }

    try {
      let count = 0;
      for (const key of this.cache.keys()) {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
          count++;
        }
      }
      this.invalidations += count;
      log(`INVALIDATE pattern="${pattern}" (${count} entries)`);
    } catch (e) {
      console.error(`${LOG_PREFIX} invalidatePattern error for pattern="${pattern}":`, e);
    }
  }

  getStats(): CacheStats {
    let expiredCount = 0;
    const now = Date.now();
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) expiredCount++;
    }

    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      evictions: this.evictions,
      expirations: this.expirations,
      invalidations: this.invalidations,
      size: this.cache.size,
      maxEntries: this.maxEntries,
      ttlSeconds: this.ttlMs / 1000,
    };
  }

  getPending<T>(key: string): Promise<T> | undefined {
    return this.pending.get(key) as Promise<T> | undefined;
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.pending.set(key, promise);
  }

  deletePending(key: string): void {
    this.pending.delete(key);
  }
}

export const journeyCache = new JourneyServerCache();
