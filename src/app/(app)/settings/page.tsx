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

  const userInitials = user.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">الإعدادات</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">Settings</p>
      </div>

      <div className="max-w-[680px] mx-auto space-y-8">
        <div>
          <h2 className="section-heading">Account</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-medium text-lg">
                {userInitials}
              </div>
              <div>
                <p className="text-[var(--color-text)] font-medium truncate max-w-[200px]">{user.email}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Account</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                <p className="text-[var(--color-text)]">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Member since</p>
                <p className="text-[var(--color-text)]">{createdDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="section-heading">Reading Preferences</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Current Translation</p>
              <p className="text-[var(--color-text)]">
                {currentTranslation 
                  ? `${currentTranslation.author_name} (${currentTranslation.language_name})`
                  : `ID: ${preferences.translation_id}`}
              </p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Current Tafsir</p>
              <p className="text-[var(--color-text)]">
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
          <h2 className="section-heading">About</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-primary)] font-semibold text-lg mb-1">Sabil</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">Your Guided Islamic Journey</p>
            <p className="text-[var(--color-text)] mb-3">A structured, gentle journey through the Qur'an, one day at a time.</p>
            <p className="text-sm text-[var(--color-text-muted)]">Built with Quran Foundation API</p>
          </div>
        </div>
      </div>
    </div>
  );
}