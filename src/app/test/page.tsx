export const dynamic = 'force-dynamic';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:3000';

async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
  return res.json();
}

async function getChapters() {
  const res = await fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' });
  const data = await res.json();
  return data.chapters ?? data;
}

export default async function TestPage() {
  let healthStatus: { status: string; token_acquired?: boolean; test_chapter?: string; message?: string } | null = null;
  let chapters: Array<{ name_simple: string; name_arabic: string }> = [];
  let error: string | null = null;

  try {
    healthStatus = await getHealth();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to connect to API';
  }

  if (healthStatus?.status === 'ok') {
    try {
      chapters = await getChapters();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch chapters';
    }
  }

  const isConnected = healthStatus?.status === 'ok';
  const totalChapters = chapters.length;

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Quran Foundation API Test</h1>
      
      <div className="mb-6">
        {isConnected ? (
          <span className="inline-block px-4 py-2 bg-green-500 text-white rounded">
            API Connected
          </span>
        ) : (
          <span className="inline-block px-4 py-2 bg-red-500 text-white rounded">
            API Failed
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {healthStatus?.message && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Message: {healthStatus.message}
        </div>
      )}

      {isConnected && (
        <>
          <p className="text-xl mb-4">{totalChapters} chapters found</p>
          
          <h2 className="text-xl font-semibold mb-4">First 10 Surahs</h2>
          <ul className="space-y-2">
            {chapters.slice(0, 10).map((chapter, index) => (
              <li key={chapter.name_simple} className="p-2 bg-white rounded shadow">
                <span className="font-medium">{index + 1}. {chapter.name_simple}</span>
                <span className="mr-4 text-lg" dir="rtl">{chapter.name_arabic}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}