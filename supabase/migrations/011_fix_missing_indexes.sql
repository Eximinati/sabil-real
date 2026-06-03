CREATE INDEX IF NOT EXISTS idx_bookmarks_user_verse
  ON public.bookmarks (user_id, surah_id, verse_number);

CREATE INDEX IF NOT EXISTS idx_user_reflections_user_lesson
  ON public.user_reflections (user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_journey_progress_user
  ON public.user_journey_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON public.user_preferences (user_id);

DROP INDEX IF EXISTS idx_user_preferences_progress;
