import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserPreferences } from '@/lib/journey';
import { PreferencesForm } from '@/components/preferences-form';
import { getCachedTranslations, getCachedTafsirs } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const preferences = await getUserPreferences(user.id);

  const [translations, tafsirs] = await Promise.all([
    getCachedTranslations(),
    getCachedTafsirs(),
  ]);

  const currentTranslation = translations.find(t => t.id === preferences.translation_id);
  const currentTafsir = tafsirs.find(t => t.id === preferences.tafsir_id);

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