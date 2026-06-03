import { NextResponse } from 'next/server';
import { searchQuran } from '@/lib/qf-api';
import { withRateLimit } from '@/lib/rate-limit';

const handler = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('size') || '10', 10);

    if (!query || query.trim() === '') {
      return NextResponse.json({ results: [], total: 0 });
    }

    const data = await searchQuran(query, page, size);

    return NextResponse.json({
      results: data.search.results,
      total: data.search.total_results,
      total_pages: data.search.total_pages,
      current_page: data.search.current_page,
      query: data.search.query,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ results: [], total: 0, error: message });
  }
};

export const GET = withRateLimit(handler, 'search');