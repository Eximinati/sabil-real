-- Journey Tracks: allow more than one day-numbered journey to exist at once.
--
-- Today journey_lessons.day_number is globally UNIQUE, which only works
-- because exactly one journey (the 30-day "Sabil" arc) exists. Adding a
-- second, longer journey (a 365-day chronological Seerah/Qisas al-Anbiya
-- track) needs day_number to repeat across journeys, scoped by which
-- journey it belongs to.
--
-- This migration is additive and backward-compatible: every existing row
-- is assigned the 'sabil-30' track by default, so the current journey
-- keeps working unchanged. It does not wire any application code to the
-- new column — that is separate follow-up work (sync-content route,
-- admin authoring studio, emotional-arc/day-identity lookups, and the
-- /journey pages all currently assume a single implicit track and read
-- lessons by day_number alone).

ALTER TABLE journey_lessons
ADD COLUMN IF NOT EXISTS journey_track TEXT NOT NULL DEFAULT 'sabil-30';

COMMENT ON COLUMN journey_lessons.journey_track IS E'Which journey this lesson belongs to, e.g. ''sabil-30'' (the original 30-day arc) or ''seerah-365'' (the chronological Adam-to-Rashidun arc). Scopes day_number uniqueness.';

-- day_number was UNIQUE on its own (supabase/migrations/001_journey.sql);
-- replace that with a per-track uniqueness constraint so two journeys can
-- each have their own "Day 1", "Day 2", etc.
ALTER TABLE journey_lessons DROP CONSTRAINT IF EXISTS journey_lessons_day_number_key;
ALTER TABLE journey_lessons ADD CONSTRAINT journey_lessons_track_day_number_key UNIQUE (journey_track, day_number);

CREATE INDEX IF NOT EXISTS idx_journey_lessons_track ON journey_lessons(journey_track);

-- user_journey_progress and user_reflections key off lesson_id (a UUID
-- foreign key into journey_lessons), not day_number directly, so they
-- already support multiple tracks without any change here — a user's
-- progress rows naturally partition by which lesson_id they reference.
