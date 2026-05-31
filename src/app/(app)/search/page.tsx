import { SearchBar } from '@/components/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { getCachedChapters } from '@/lib/api-utils';
import { getApiUrl } from '@/lib/api-url';
import { sanitizeHtml } from '@/lib/sanitize';
import { getServerDictionary } from '@/lib/i18n/server';
import { interpolate } from '@/lib/i18n/format';
import { CacheHydrator } from '@/components/cache-hydrator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getChapterName(verseKey: string, chapters: any[]): string {
  const chapterId = parseInt(verseKey.split(':')[0], 10);
  const chapter = chapters.find(c => c.id === chapterId);
  return chapter?.name_simple ?? `Surah ${chapterId}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { dictionary: copy } = await getServerDictionary();
  const { q: query, page: pageNum } = await searchParams;
  const currentPage = parseInt(pageNum || '1', 10);

  let chapters: any[] = [];
  let searchResults: any[] = [];
  let total = 0;
  let totalPages = 0;

  try {
    chapters = await getCachedChapters();
  } catch (e) {
    chapters = [];
  }

  if (query && query.trim()) {
    try {
      const searchRes = await fetch(
        getApiUrl(`/search?q=${encodeURIComponent(query)}&page=${currentPage}&size=10`),
        { cache: 'no-store' }
      );
      const searchData = await searchRes.json();
      searchResults = searchData.results || [];
      total = searchData.total || 0;
      totalPages = searchData.total_pages || 0;
    } catch (e) {
      return (
        <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
          <div className="text-center mb-8">
            <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">البحث</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-2">{copy.search.subtitle}</p>
          </div>
          <div className="mb-8">
            <SearchBar initialQuery={query || ''} />
          </div>
          <EmptyState
            icon="search"
            title={copy.search.failedTitle}
            description={copy.search.failedDescription}
            actionLabel={copy.search.tryAgain}
            actionHref={`/search?q=${encodeURIComponent(query)}`}
          />
        </div>
      );
    }
  }

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-8">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">البحث</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">{copy.search.subtitle}</p>
      </div>

      <div className="mb-8">
        <SearchBar initialQuery={query || ''} />
      </div>

      {query && query.trim() && (
        <div className="max-w-4xl mx-auto">
          {searchResults.length === 0 ? (
            <EmptyState
              icon="search"
              title={interpolate(copy.search.noResultsTitle, { query })}
              description={copy.search.noResultsDescription}
            />
          ) : (
            <>
              <p className="text-[var(--color-text-muted)] text-sm mb-6">
                {interpolate(copy.search.resultsLine, { total, query })}
              </p>

              <CacheHydrator
                verses={searchResults.map((r: any) => ({
                  verse_key: r.verse_key,
                  text_uthmani: r.text || '',
                  chapterName: getChapterName(r.verse_key, chapters),
                }))}
              />
              <div className="space-y-4">
                {searchResults.map((result: any, index: number) => {
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
                          {copy.search.openSurah} →
                        </a>
                      </div>

                      {result.highlighted ? (
                        <p
                          className="font-arabic text-[20px] md:text-[22px] text-right text-[var(--color-text)] mb-3 leading-relaxed"
                          dir="rtl"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(result.highlighted),
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
                                __html: sanitizeHtml(translation.highlighted),
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
                      ← {copy.search.previous}
                    </a>
                  ) : (
                    <span className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-muted)]">
                      ← {copy.search.previous}
                    </span>
                  )}

                  <span className="text-sm text-[var(--color-text-muted)]">
                    {interpolate(copy.search.pageLine, { current: currentPage, total: totalPages })}
                  </span>

                  {currentPage < totalPages ? (
                    <a
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                      className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {copy.search.next} →
                    </a>
                  ) : (
                    <span className="border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-muted)]">
                      {copy.search.next} →
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
