-- Phase 5H: Notification preferences and gentle return context

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_time TIME NOT NULL DEFAULT '20:30:00',
  ADD COLUMN IF NOT EXISTS reminder_language TEXT NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_reminder_language_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_reminder_language_check
  CHECK (reminder_language IN ('auto', 'en', 'ur'));

CREATE INDEX IF NOT EXISTS idx_user_preferences_last_active_at
  ON user_preferences(last_active_at);

COMMENT ON COLUMN user_preferences.reminders_enabled IS 'Whether user wants optional reminders';
COMMENT ON COLUMN user_preferences.reminder_time IS 'Preferred local reminder time';
COMMENT ON COLUMN user_preferences.reminder_language IS 'Reminder copy language: auto, en, ur';
COMMENT ON COLUMN user_preferences.last_active_at IS 'Last time user opened journey surface';
