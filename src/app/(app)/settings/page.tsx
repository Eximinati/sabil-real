import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserPreferences } from '@/lib/journey';
import { PreferencesForm } from '@/components/preferences-form';
import { getCachedTranslations, getCachedTafsirs } from '@/lib/api-utils';
import { getServerDictionary } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { dictionary: copy, language } = await getServerDictionary();
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
  const reminderTimeValue = preferences.reminder_time
    ? preferences.reminder_time.slice(0, 5)
    : '20:30';

  const currentHadithLanguageLabel =
    preferences.hadith_language === 'english'
      ? copy.settings.hadithLanguageEnglish
      : preferences.hadith_language === 'urdu'
        ? copy.settings.hadithLanguageUrdu
        : copy.settings.hadithLanguageAuto;

  const currentUiLanguageLabel =
    preferences.ui_language === 'en'
      ? copy.settings.uiLanguageEnglish
      : preferences.ui_language === 'ur'
        ? copy.settings.uiLanguageUrdu
        : copy.settings.uiLanguageAuto;

  const createdDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : copy.common.labels.unknown;

  const userInitials = user.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">الإعدادات</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">{copy.settings.title}</p>
      </div>

      <div className="max-w-[680px] mx-auto space-y-8">
        <div>
          <h2 className="section-heading">{copy.settings.account}</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-medium text-lg">
                {userInitials}
              </div>
              <div>
                <p className="text-[var(--color-text)] font-medium truncate max-w-[200px]">{user.email}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{copy.settings.accountLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">{copy.settings.email}</p>
                <p className="text-[var(--color-text)]">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">{copy.settings.memberSince}</p>
                <p className="text-[var(--color-text)]">{createdDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="section-heading">{copy.settings.readingPreferences}</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{copy.settings.currentTranslation}</p>
              <p className="text-[var(--color-text)]">
                {currentTranslation 
                  ? `${currentTranslation.author_name} (${currentTranslation.language_name})`
                  : `ID: ${preferences.translation_id}`}
              </p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{copy.settings.currentTafsir}</p>
              <p className="text-[var(--color-text)]">
                {currentTafsir 
                  ? `${currentTafsir.name} - ${currentTafsir.author_name}`
                  : `ID: ${preferences.tafsir_id}`}
              </p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{copy.settings.currentHadithLanguage}</p>
              <p className="text-[var(--color-text)]">{currentHadithLanguageLabel}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{copy.settings.currentUiLanguage}</p>
              <p className="text-[var(--color-text)]">{currentUiLanguageLabel}</p>
            </div>
            <PreferencesForm 
              initialTranslationId={preferences.translation_id}
              initialTafsirId={preferences.tafsir_id}
              initialHadithLanguage={preferences.hadith_language}
              initialUiLanguage={preferences.ui_language}
              initialRemindersEnabled={preferences.reminders_enabled}
              initialReminderTime={reminderTimeValue}
              initialReminderLanguage={preferences.reminder_language}
            />
          </div>
        </div>

        <div>
          <h2 className="section-heading">{copy.settings.about}</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-primary)] font-semibold text-lg mb-1">Sabil</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">{copy.settings.appTagline}</p>
            <p className="text-[var(--color-text)] mb-3">{copy.settings.appDescription}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{copy.settings.builtWith}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
