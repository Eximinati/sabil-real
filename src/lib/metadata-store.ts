'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

interface FetchCacheEntry<T> {
  data: T;
  timestamp: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  subscribers: Array<(data: T) => void>;
}

class MetadataStore {
  private cache = new Map<string, FetchCacheEntry<any>>();
  private pending = new Map<string, PendingRequest<any>>();
  private cacheExpiry = 3600000;
  
  private requestLog: Array<{ url: string; timestamp: number; cached: boolean }> = [];
  private maxLogSize = 100;

  setExpiry(ms: number) {
    this.cacheExpiry = ms;
  }

  private isExpired(entry: FetchCacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.cacheExpiry;
  }

  get<T>(url: string): T | null {
    const entry = this.cache.get(url);
    if (entry && !this.isExpired(entry)) {
      this.log(url, true);
      return entry.data as T;
    }
    this.log(url, false);
    return null;
  }

  set<T>(url: string, data: T): void {
    this.cache.set(url, { data, timestamp: Date.now() });
  }

  private async fetchWithDeduplication<T>(url: string): Promise<T> {
    const pending = this.pending.get(url) as PendingRequest<T> | undefined;
    
    if (pending) {
      const data = await pending.promise;
      return data;
    }

    const promise = fetch(url).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    this.pending.set(url, {
      promise: promise as Promise<any>,
      subscribers: []
    });

    try {
      const data = await promise;
      this.set(url, data);
      this.pending.delete(url);
      return data as T;
    } catch (error) {
      this.pending.delete(url);
      throw error;
    }
  }

  async fetch<T>(url: string, options?: {
    cache?: boolean;
    expiresIn?: number;
    skipCache?: boolean;
  }): Promise<T> {
    const { cache = true, expiresIn, skipCache = false } = options || {};
    
    if (expiresIn) {
      const originalExpiry = this.cacheExpiry;
      this.cacheExpiry = expiresIn;
      const result = await this.fetchWithDeduplication<T>(url);
      this.cacheExpiry = originalExpiry;
      return result;
    }

    if (cache && !skipCache) {
      const cached = this.get<T>(url);
      if (cached) return cached;
    }

    return this.fetchWithDeduplication<T>(url);
  }

  invalidate(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  private log(url: string, cached: boolean): void {
    this.requestLog.push({ url, timestamp: Date.now(), cached });
    if (this.requestLog.length > this.maxLogSize) {
      this.requestLog.shift();
    }
  }

  getLog() {
    return [...this.requestLog];
  }

  clearLog() {
    this.requestLog = [];
  }

  getStats() {
    const total = this.requestLog.length;
    const cached = this.requestLog.filter(l => l.cached).length;
    const uncached = total - cached;
    
    const byUrl = new Map<string, number>();
    for (const entry of this.requestLog) {
      byUrl.set(entry.url, (byUrl.get(entry.url) || 0) + 1);
    }

    return {
      total,
      cached,
      uncached,
      cacheHitRate: total > 0 ? (cached / total * 100).toFixed(1) + '%' : '0%',
      byUrl: Object.fromEntries(byUrl),
    };
  }
}

export const metadataStore = new MetadataStore();

export function useMetadataFetch<T>(
  url: string | null | undefined,
  options?: {
    cache?: boolean;
    expiresIn?: number;
    skipCache?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!url || fetchedRef.current) return;
    
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await metadataStore.fetch<T>(url, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [url, options?.cache, options?.expiresIn, options?.skipCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    if (url) {
      metadataStore.invalidate(url);
    }
    fetchData();
  }, [fetchData, url]);

  return { data, loading, error, refetch };
}

export function usePrefetchMetadata() {
  const prefetch = useCallback(async (url: string) => {
    const cached = metadataStore.get(url);
    if (!cached) {
      await metadataStore.fetch(url, { cache: true });
    }
  }, []);

  return { prefetch };
}

export function getMetadataStats() {
  return metadataStore.getStats();
}

export function clearMetadataLog() {
  metadataStore.clearLog();
}

export function getMetadataLog() {
  return metadataStore.getLog();
}