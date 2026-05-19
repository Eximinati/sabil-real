'use client';

import { useEffect, useRef, useState } from 'react';
import { getMetadataStats, getMetadataLog, clearMetadataLog } from '@/lib/metadata-store';

interface RequestStats {
  total: number;
  cached: number;
  uncached: number;
  cacheHitRate: string;
  byUrl: Record<string, number>;
}

interface RequestLogEntry {
  url: string;
  timestamp: number;
  cached: boolean;
}

export function RequestMonitor({ 
  enabled = false,
  onStatsChange,
}: { 
  enabled?: boolean;
  onStatsChange?: (stats: RequestStats) => void;
}) {
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [log, setLog] = useState<RequestLogEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const updateStats = () => {
      const newStats = getMetadataStats();
      const newLog = getMetadataLog();
      setStats(newStats);
      setLog(newLog);
      onStatsChange?.(newStats);
    };

    updateStats();
    intervalRef.current = setInterval(updateStats, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, onStatsChange]);

  const clearLog = () => {
    clearMetadataLog();
    setLog([]);
    setStats(null);
  };

  if (!enabled || !stats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg max-w-xs text-xs">
      <div className="font-medium mb-2 text-[var(--color-text)]">Request Monitor</div>
      <div className="space-y-1 text-[var(--color-text-muted)]">
        <div>Total: {stats.total}</div>
        <div>Cached: {stats.cached}</div>
        <div>Uncached: {stats.uncached}</div>
        <div>Hit Rate: {stats.cacheHitRate}</div>
      </div>
      {Object.keys(stats.byUrl).length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
          <div className="font-medium mb-1 text-[var(--color-text)]">By URL:</div>
          {Object.entries(stats.byUrl).slice(0, 5).map(([url, count]) => (
            <div key={url} className="text-[var(--color-text-muted)] truncate">
              {url.split('/').pop()}: {count}
            </div>
          ))}
        </div>
      )}
      <button 
        onClick={clearLog}
        className="mt-2 text-[var(--color-primary)] hover:underline"
      >
        Clear
      </button>
    </div>
  );
}

export function useRequestMonitor() {
  const [stats, setStats] = useState<RequestStats | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getMetadataStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}