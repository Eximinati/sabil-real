interface CacheEntry {
  data: unknown;
  timestamp: number;
}

class ServerCache {
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<unknown>>();
  private cacheExpiry = 3600000;

  setExpiry(ms: number) {
    this.cacheExpiry = ms;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.cacheExpiry;
  }

  get<T>(url: string): T | null {
    const entry = this.cache.get(url);
    if (entry && !this.isExpired(entry)) {
      return entry.data as T;
    }
    return null;
  }

  set<T>(url: string, data: T): void {
    this.cache.set(url, { data, timestamp: Date.now() });
  }

  private getAbsoluteUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url}`;
    }

    const candidates = (process.env.NEXT_PUBLIC_BASE_URL || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.replace(/\/$/, ''));

    let base = '';

    if (process.env.NODE_ENV !== 'production') {
      base = candidates[0] || 'http://localhost:3000';
    } else {
      const httpsCandidate = candidates.find((value) => value.startsWith('https://'));
      base = httpsCandidate || candidates[0] || '';

      if (!base) {
        base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      }
    }

    return `${base}${url}`;
  }

  async fetch<T>(url: string, options?: {
    cache?: boolean;
    expiresIn?: number;
    skipCache?: boolean;
  }): Promise<T> {
    const { cache = true, skipCache = false } = options || {};
    const absoluteUrl = this.getAbsoluteUrl(url);

    if (cache && !skipCache) {
      const cached = this.get<T>(url);
      if (cached) return cached;
    }

    if (this.pending.has(absoluteUrl)) {
      return this.pending.get(absoluteUrl) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const res = await fetch(absoluteUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cache) this.set(url, data);
        this.pending.delete(absoluteUrl);
        return data as T;
      } catch (error) {
        this.pending.delete(absoluteUrl);
        throw error;
      }
    })();

    this.pending.set(absoluteUrl, promise);
    return promise;
  }

  invalidate(url?: string): void {
    if (url) this.cache.delete(url);
    else this.cache.clear();
  }

  getStats() {
    return { total: this.cache.size, cached: 0, uncached: 0, cacheHitRate: '0%', byUrl: {} };
  }

  getLog() {
    return [];
  }

  clearLog() {}
}

export const serverCache = new ServerCache();
export const metadataStore = serverCache;

export function getMetadataStats() {
  return serverCache.getStats();
}

export function getMetadataLog() {
  return serverCache.getLog();
}

export function clearMetadataLog() {
  serverCache.clearLog();
}

export function invalidateAllMetadata() {
  serverCache.invalidate();
}
