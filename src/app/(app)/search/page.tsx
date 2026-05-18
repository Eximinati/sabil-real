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
    // Silent fail
  }

  if (query && query.trim()) {
    try {
      const searchRes = await fetch(
        `${API_BASE}/api/search?q=${encodeURIComponent(query)}&page=${currentPage}&size=10`,
        { cache: 'no-store' }
      );
      const searchData = await searchRes.json();
      searchResults = searchData.results || [];
      total = searchData.total || 0;
      totalPages = searchData.total_pages || 0;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Search failed';
    }
  }

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-8">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">البحث</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">Search the Quran</p>
      </div>

      <div className="mb-8">
        <SearchBar initialQuery={query || ''} />
      </div>

      {query && query.trim() && (
        <div className="max-w-4xl mx-auto">
          {error ? (
            <p className="text-[var(--color-error)] text-center">Error: {error}</p>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-[var(--color-border)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-[var(--color-text-muted)]">No results found for '{query}'</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">Try searching in Arabic or use different keywords</p>
            </div>
          ) : (
            <>
              <p className="text-[var(--color-text-muted)] text-sm mb-6">
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
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-5 shadow-sm hover:border-[var(--color-primary)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-full text-xs">
                          {chapterName} {result.verse_key.split(':')[1]}
                        </span>
                        <a
                          href={`/quran/${chapterId}`}
                          className="text-xs text-[var(--color-primary)] hover:underline"
                        >
                          Open Surah →
                        </a>
                      </div>

                      {result.highlighted ? (
                        <p
                          className="font-arabic text-[20px] md:text-[22px] text-right text-[var(--color-text)] mb-3 leading-relaxed"
                          dir="rtl"
                          dangerouslySetInnerHTML={{
                            __html: formatHighlightedText(result.highlighted),
                          }}
                        />
                      ) : (
                        <p
                          className="font-arabic text-[20px] md:text-[22px] text-right text-[var(--color-text)] mb-3 leading-relaxed"
                          dir="rtl"
                        >
                          {result.text}
                        </p>
                      )}

                      {translation && (
                        <div>
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">{translation.resource_name}</p>
                          {translation.highlighted ? (
                            <p
                              className="text-[14px] md:text-[15px] text-[var(--color-text-secondary)] leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatHighlightedText(translation.highlighted),
                              }}
                            />
                          ) : (
                            <p className="text-[14px] md:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
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
                      className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      ← Previous
                    </a>
                  ) : (
                    <span className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-muted)]">
                      ← Previous
                    </span>
                  )}

                  <span className="text-sm text-[var(--color-text-muted)]">
                    Page {currentPage} of {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <a
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                      className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Next →
                    </a>
                  ) : (
                    <span className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-muted)]">
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