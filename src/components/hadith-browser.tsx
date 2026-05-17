'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Collection {
  id: string;
  name: string;
  arabic: string;
}

interface HadithData {
  number: number;
  arabic: string;
  english: string;
  collection: string;
  name: string;
}

export function HadithBrowser({
  initialCollection,
  initialNumber,
}: {
  initialCollection?: string;
  initialNumber?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hadith, setHadith] = useState<HadithData | null>(null);
  const [hadithLoading, setHadithLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputNumber, setInputNumber] = useState(initialNumber || (collection === 'muslim' ? '93' : '1'));

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
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (collection && number) {
      setHadithLoading(true);
      setError(null);
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
        .catch((e) => {
          setError('Failed to load hadith');
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
    setInputNumber(defaultNum);
  };

  const handleRead = () => {
    if (!inputNumber || parseInt(inputNumber, 10) < 1) return;
    const params = new URLSearchParams();
    params.set('collection', collection);
    params.set('number', inputNumber);
    router.push(`/hadith?${params.toString()}`);
  };

  const navigateHadith = (delta: number) => {
    const currentNum = parseInt(number, 10) || 1;
    const newNum = Math.max(1, currentNum + delta);
    const params = new URLSearchParams();
    params.set('collection', collection);
    params.set('number', newNum.toString());
    router.push(`/hadith?${params.toString()}`);
    setInputNumber(newNum.toString());
  };

  if (loading) {
    return (
      <div className="px-16 pt-12 pb-12">
        <p className="text-center text-[#6B7280]">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">الحديث</h1>
        <p className="text-[#6B7280] text-sm mt-2">Hadith Collections</p>
        <p className="text-[#6B7280] text-sm mt-1 max-w-lg mx-auto">
          Browse authentic hadith collections from the six major books.
        </p>
      </div>

      {!collection ? (
        <div className="max-w-[680px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCollectionSelect(c.id)}
                className="bg-white border border-[#E8E0D5] rounded-xl p-5 text-left hover:border-[#2D6A4F] transition-colors"
              >
                <span className="font-arabic text-[20px] text-[#B7922A] block" dir="rtl">
                  {c.arabic}
                </span>
                <span className="text-sm text-[#6B7280] mt-1 block">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[680px] mx-auto">
          <button
            onClick={() => router.push('/hadith')}
            className="text-[#2D6A4F] hover:underline mb-6 block"
          >
            ← Back to Collections
          </button>

          <div className="flex items-center gap-4 mb-8">
            <label className="text-sm text-[#6B7280]">Enter hadith number:</label>
            <input
              type="number"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              min={1}
              className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F] w-24"
            />
            <button
              onClick={handleRead}
              disabled={hadithLoading || !inputNumber}
              className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50"
            >
              Read
            </button>
          </div>

          {hadithLoading ? (
            <p className="text-center text-[#6B7280]">Loading hadith...</p>
          ) : error ? (
            <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 text-center">
              <p className="text-[#DC2626]">{error}</p>
            </div>
          ) : hadith ? (
            <div className="bg-white border border-[#E8E0D5] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#2D6A4F] font-medium">{hadith.name}</span>
                <span className="bg-[#B7922A] text-white text-xs px-3 py-1 rounded-full">
                  Hadith #{hadith.number}
                </span>
              </div>
              
              {hadith.section && (
                <p className="text-xs text-[#6B7280] mb-3">Chapter: {hadith.section}</p>
              )}
              
              <div className="border-t border-[#E8E0D5] pt-4">
                {hadith.english ? (
                  <p 
                    className="text-[15px] leading-[1.9] text-[#1A1A1A]"
                    dangerouslySetInnerHTML={{ 
                      __html: hadith.english.replace(/<script[^>]*>.*?<\/script>/gi, '')
                    }}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[#6B7280] text-sm">
                      Text not available for this hadith number.
                    </p>
                    <p className="text-[#6B7280] text-xs mt-1">
                      Try hadith #93 or later for Sahih Muslim.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t border-[#E8E0D5]">
                <button
                  onClick={() => navigateHadith(-1)}
                  disabled={parseInt(number, 10) <= 1}
                  className="text-sm text-[#2D6A4F] hover:underline disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => navigateHadith(1)}
                  className="text-sm text-[#2D6A4F] hover:underline"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}