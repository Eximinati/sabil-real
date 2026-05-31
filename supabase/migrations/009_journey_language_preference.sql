-- Phase 5K: dedicated journey language preference

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS journey_language TEXT DEFAULT 'auto';

UPDATE user_preferences
SET journey_language = 'auto'
WHERE journey_language IS NULL
   OR journey_language NOT IN ('auto', 'en', 'ur');

ALTER TABLE user_preferences
  ALTER COLUMN journey_language SET DEFAULT 'auto',
  ALTER COLUMN journey_language SET NOT NULL;

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_journey_language_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_journey_language_check
  CHECK (journey_language IN ('auto', 'en', 'ur'));

COMMENT ON COLUMN user_preferences.journey_language IS
  'Journey content language preference: auto, en, ur';
