'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmptyState } from './ui/empty-state';
import { useToast } from '@/hooks/use-toast';

export function HadithBrowser({
  initialCollection,
  initialNumber,
}: {
  initialCollection?: string;
  initialNumber?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hadith, setHadith] = useState<any>(null);
  const [hadithLoading, setHadithLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collection = searchParams.get('collection') || initialCollection || '';
  const defaultNumber = collection === 'muslim' ? 93 : 1;
  const number = searchParams.get('number') || initialNumber || defaultNumber.toString();

  useEffect(() => {
    fetch('/api/hadith/collections')
      .then((res) => res.json())
      .then((data) => {
        setCollections(data.collections || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Could not load collections');
        setLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    if (collection && number) {
      setHadithLoading(true);
      setError(null);
      setHadith(null);
      fetch(`/api/hadith/${collection}/${number}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
            setHadith(null);
          } else {
            setHadith(data.hadith);
          }
        })
        .catch(() => {
          setError('Could not load this hadith');
          setHadith(null);
        })
        .finally(() => setHadithLoading(false));
    }
  }, [collection, number]);

  const handleCollectionSelect = (collectionId: string) => {
    const defaultNum = collectionId === 'muslim' ? '93' : '1';
    const params = new URLSearchParams();
    params.set('collection', collectionId);
    params.set('number', defaultNum);
    router.push(`/hadith?${params.toString()}`);
  };

  const handleRead = () => {
    if (!number || parseInt(number, 10) < 1) return;
    const params = new URLSearchParams();
    params.set('collection', collection);
    params.set('number', number);
    router.push(`/hadith?${params.toString()}`);
  };

  const navigateHadith = (delta: number) => {
    const currentNum = parseInt(number, 10) || 1;
    const newNum = Math.max(1, currentNum + delta);
    const params = new URLSearchParams();
    params.set('collection', collection);
    params.set('number', newNum.toString());
    router.push(`/hadith?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-48 bg-[var(--color-border)] animate-pulse rounded-xl mb-4" />
          <div className="h-48 bg-[var(--color-border)] animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">الحديث</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">Hadith Collections</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1 max-w-lg mx-auto">
          Browse authentic hadith collections from the six major books.
        </p>
      </div>

      {!collection ? (
        <div className="max-w-[680px] mx-auto">
          {collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCollectionSelect(c.id)}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-left hover:border-[var(--color-primary)] transition-colors card-hover"
                  aria-label={`Select ${c.name} collection`}
                >
                  <span className="font-arabic text-[22px] text-[var(--color-accent)] block" dir="rtl">
                    {c.arabic}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)] mt-1 block">{c.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="hadith"
              title="No collections available"
              description="Could not load hadith collections. Please refresh and try again."
              actionLabel="Refresh"
              onAction={() => window.location.reload()}
            />
          )}
        </div>
      ) : (
        <div className="max-w-[680px] mx-auto">
          <button
            onClick={() => router.push('/hadith')}
            className="text-[var(--color-primary)] hover:underline mb-6 block"
            aria-label="Back to collections"
          >
            ← Back to Collections
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            <label htmlFor="hadith-number" className="text-sm text-[var(--color-text-muted)]">Enter hadith number:</label>
            <input
              id="hadith-number"
              type="number"
              value={number}
              onChange={(e) => router.push(`/hadith?collection=${collection}&number=${e.target.value}`)}
              min={1}
              className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 w-24 transition-all"
              aria-label="Hadith number"
            />
            <button
              onClick={handleRead}
              disabled={hadithLoading || !number}
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
            >
              Read
            </button>
          </div>

          {hadithLoading ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-[var(--color-border)] rounded w-1/3" />
                <div className="h-4 bg-[var(--color-border)] rounded w-full" />
                <div className="h-4 bg-[var(--color-border)] rounded w-2/3" />
              </div>
            </div>
          ) : error ? (
            <EmptyState
              icon="hadith"
              title="Could not load hadith"
              description="The hadith you requested could not be found."
            />
          ) : hadith ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-[var(--color-primary)] font-medium">{hadith.name}</span>
                <span className="bg-[var(--color-accent)] text-white text-xs px-3 py-1 rounded-full">
                  Hadith #{hadith.number}
                </span>
              </div>
              
              {hadith.section && (
                <p className="text-xs text-[var(--color-text-muted)] mb-3">Chapter: {hadith.section}</p>
              )}
              
              <div className="border-t border-[var(--color-border)] pt-4">
                {hadith.english ? (
                  <p className="text-[15px] leading-[1.9] text-[var(--color-text)]">
                    {hadith.english}
                  </p>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[var(--color-text-muted)] text-sm">
                      Text not available for this hadith number.
                    </p>
                    <p className="text-[var(--color-text-muted)] text-xs mt-1">
                      Try hadith #93 or later for Sahih Muslim.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => navigateHadith(-1)}
                  disabled={parseInt(number, 10) <= 1}
                  className="text-sm text-[var(--color-primary)] hover:underline disabled:opacity-50"
                  aria-label="Previous hadith"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => navigateHadith(1)}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                  aria-label="Next hadith"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="hadith"
              title="Select a hadith"
              description="Enter a hadith number above to view it."
            />
          )}
        </div>
      )}
    </div>
  );
}