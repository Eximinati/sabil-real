-- Phase 5K: language preferences for hadith and interface

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS hadith_language TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS ui_language TEXT DEFAULT 'auto';

UPDATE user_preferences
SET hadith_language = 'auto'
WHERE hadith_language IS NULL
   OR hadith_language NOT IN ('auto', 'english', 'urdu');

UPDATE user_preferences
SET ui_language = 'auto'
WHERE ui_language IS NULL
   OR ui_language NOT IN ('auto', 'en', 'ur');

ALTER TABLE user_preferences
  ALTER COLUMN hadith_language SET DEFAULT 'auto',
  ALTER COLUMN hadith_language SET NOT NULL,
  ALTER COLUMN ui_language SET DEFAULT 'auto',
  ALTER COLUMN ui_language SET NOT NULL;

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_hadith_language_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_hadith_language_check
  CHECK (hadith_language IN ('auto', 'english', 'urdu'));

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_ui_language_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_ui_language_check
  CHECK (ui_language IN ('auto', 'en', 'ur'));

COMMENT ON COLUMN user_preferences.hadith_language IS
  'Hadith translation preference: auto, english, urdu';

COMMENT ON COLUMN user_preferences.ui_language IS
  'Interface language preference: auto, en, ur';
