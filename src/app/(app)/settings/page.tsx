import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserPreferences } from '@/lib/journey';
import { PreferencesForm } from '@/components/preferences-form';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

interface Tafsir {
  id: number;
  name: string;
  author_name: string;
}

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const preferences = await getUserPreferences(user.id);

  const [translationsRes, tafsirsRes] = await Promise.all([
    fetch(`${API_BASE}/api/translations`, { cache: 'no-store' }),
    fetch(`${API_BASE}/api/tafsirs`, { cache: 'no-store' }),
  ]);

  const translationsData = await translationsRes.json();
  const tafsirsData = await tafsirsRes.json();

  const translations = translationsData.translations || translationsData;
  const tafsirs = tafsirsData.tafsirs || tafsirsData;

  const currentTranslation = translations.find((t: Translation) => t.id === preferences.translation_id);
  const currentTafsir = tafsirs.find((t: Tafsir) => t.id === preferences.tafsir_id);

  const createdDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : 'Unknown';

  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">الإعدادات</h1>
        <p className="text-[#6B7280] text-sm mt-2">Settings</p>
      </div>

      <div className="max-w-[680px] mx-auto space-y-8">
        <div>
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-4">Account</h2>
          <div className="bg-white border border-[#E8E0D5] rounded-xl p-6">
            <div className="mb-4">
              <p className="text-sm text-[#6B7280]">Email</p>
              <p className="text-[#1A1A1A] font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Member since</p>
              <p className="text-[#1A1A1A]">{createdDate}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-4">Reading Preferences</h2>
          <div className="bg-white border border-[#E8E0D5] rounded-xl p-6">
            <div className="mb-4">
              <p className="text-sm text-[#6B7280] mb-1">Current Translation</p>
              <p className="text-[#1A1A1A]">
                {currentTranslation 
                  ? `${currentTranslation.author_name} (${currentTranslation.language_name})`
                  : `ID: ${preferences.translation_id}`}
              </p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-[#6B7280] mb-1">Current Tafsir</p>
              <p className="text-[#1A1A1A]">
                {currentTafsir 
                  ? `${currentTafsir.name} - ${currentTafsir.author_name}`
                  : `ID: ${preferences.tafsir_id}`}
              </p>
            </div>
            <PreferencesForm 
              initialTranslationId={preferences.translation_id}
              initialTafsirId={preferences.tafsir_id}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-4">About</h2>
          <div className="bg-white border border-[#E8E0D5] rounded-xl p-6">
            <p className="text-[#2D6A4F] font-semibold text-lg mb-1">Sabil</p>
            <p className="text-sm text-[#6B7280] mb-3">Phase 1 — Foundation</p>
            <p className="text-[#1A1A1A] mb-3">A guided Islamic learning platform</p>
            <p className="text-sm text-[#6B7280]">Built with Quran Foundation API</p>
          </div>
        </div>
      </div>
    </div>
  );
}