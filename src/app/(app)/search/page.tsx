import { SearchBar } from '@/components/search-bar';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
}

interface SearchResult {
  verse_key: string;
  text: string;
  highlighted: string;
  translations: Array<{
    text: string;
    highlighted: string;
    resource_name: string;
  }>;
}

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

function getChapterName(verseKey: string, chapters: Chapter[]): string {
  const chapterId = parseInt(verseKey.split(':')[0], 10);
  const chapter = chapters.find(c => c.id === chapterId);
  return chapter?.name_simple ?? `Surah ${chapterId}`;
}

function formatHighlightedText(html: string): string {
  return html
    .replace(/<em class="highlight">/g, '<mark class="bg-[#FFF3CD] rounded px-0.5">')
    .replace(/<\/em>/g, '</mark>');
}

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: query, page: pageNum } = await searchParams;
  const currentPage = parseInt(pageNum || '1', 10);

  let chapters: Chapter[] = [];
  let searchResults: SearchResult[] = [];
  let total = 0;
  let totalPages = 0;
  let error: string | null = null;

  try {
    const chaptersRes = await fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' });
    const chaptersData = await chaptersRes.json();
    chapters = chaptersData.chapters ?? chaptersData;
  } catch (e) {
    console.error('Failed to fetch chapters:', e);
  }

  if (query && query.trim()) {
    try {
      const searchRes = await fetch(
        `${API_BASE}/api/search?q=${encodeURIComponent(query)}&page=${currentPage}&size=10`,
        { cache: 'no-store' }
      );
      const searchData = await searchRes.json();
      console.log('Search response:', JSON.stringify(searchData).slice(0, 500));
      searchResults = searchData.results || [];
      total = searchData.total || 0;
      totalPages = searchData.total_pages || 0;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Search failed';
    }
  }

  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-8">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">البحث</h1>
        <p className="text-[#6B7280] text-sm mt-2">Search the Quran</p>
      </div>

      <div className="mb-8">
        <SearchBar initialQuery={query || ''} />
      </div>

      {query && query.trim() && (
        <div className="max-w-4xl mx-auto">
          {error ? (
            <p className="text-[#DC2626] text-center">Error: {error}</p>
          ) : searchResults.length === 0 ? (
            <div className="text-center">
              <p className="text-[#6B7280]">No results found for '{query}'</p>
              <p className="text-sm text-[#6B7280] mt-2">Try searching in Arabic or use different keywords</p>
            </div>
          ) : (
            <>
              <p className="text-[#6B7280] text-sm mb-6">
                {total} results for '{query}'
              </p>

              <div className="space-y-4">
                {searchResults.map((result, index) => {
                  const chapterName = getChapterName(result.verse_key, chapters);
                  const chapterId = result.verse_key.split(':')[0];
                  const translation = result.translations?.[0];

                  return (
                    <div
                      key={index}
                      className="bg-white border border-[#E8E0D5] rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-[#B7922A] text-white rounded-full text-xs">
                          {chapterName} {result.verse_key.split(':')[1]}
                        </span>
                        <a
                          href={`/quran/${chapterId}`}
                          className="text-xs text-[#2D6A4F] hover:underline"
                        >
                          Open Surah →
                        </a>
                      </div>

                      {result.highlighted ? (
                        <p
                          className="font-arabic text-[22px] text-right text-[#1A1A1A] mb-3 leading-relaxed"
                          dir="rtl"
                          dangerouslySetInnerHTML={{
                            __html: formatHighlightedText(result.highlighted),
                          }}
                        />
                      ) : (
                        <p
                          className="font-arabic text-[22px] text-right text-[#1A1A1A] mb-3 leading-relaxed"
                          dir="rtl"
                        >
                          {result.text}
                        </p>
                      )}

                      {translation && (
                        <div>
                          <p className="text-xs text-[#6B7280] mb-1">{translation.resource_name}</p>
                          {translation.highlighted ? (
                            <p
                              className="text-[15px] text-[#4B5563] leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatHighlightedText(translation.highlighted),
                              }}
                            />
                          ) : (
                            <p className="text-[15px] text-[#4B5563] leading-relaxed">
                              {translation.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  {currentPage > 1 ? (
                    <a
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                      className="border border-[#E8E0D5] rounded-lg px-4 py-2 text-sm hover:border-[#2D6A4F] transition-colors"
                    >
                      ← Previous
                    </a>
                  ) : (
                    <span className="border border-[#E8E0D5] rounded-lg px-4 py-2 text-sm text-[#6B7280]">
                      ← Previous
                    </span>
                  )}

                  <span className="text-sm text-[#6B7280]">
                    Page {currentPage} of {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <a
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                      className="border border-[#E8E0D5] rounded-lg px-4 py-2 text-sm hover:border-[#2D6A4F] transition-colors"
                    >
                      Next →
                    </a>
                  ) : (
                    <span className="border border-[#E8E0D5] rounded-lg px-4 py-2 text-sm text-[#6B7280]">
                      Next →
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}