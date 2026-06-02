-- Restore proper RLS for journey content
-- Reverses migration 004 which granted full access to all authenticated users

-- Drop the overly permissive policies from migration 004
DROP POLICY IF EXISTS "Admins can manage all lessons" ON journey_lessons;
DROP POLICY IF EXISTS "Admins can manage all lesson blocks" ON journey_lesson_blocks;

-- Ensure RLS is enabled
ALTER TABLE journey_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_lesson_blocks ENABLE ROW LEVEL SECURITY;

-- Published lessons: readable by any authenticated user
DROP POLICY IF EXISTS "Published lessons are readable" ON journey_lessons;
CREATE POLICY "Published lessons are readable"
  ON journey_lessons FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (is_published = TRUE OR created_by = auth.uid())
  );

-- Users can read published lesson blocks
DROP POLICY IF EXISTS "Published lesson blocks are readable" ON journey_lesson_blocks;
CREATE POLICY "Published lesson blocks are readable"
  ON journey_lesson_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journey_lessons
      WHERE journey_lessons.id = journey_lesson_blocks.lesson_id
      AND (journey_lessons.is_published = TRUE OR journey_lessons.created_by = auth.uid())
    )
  );

-- Lesson creation: user must set themselves as creator
DROP POLICY IF EXISTS "Users can insert own lessons" ON journey_lessons;
CREATE POLICY "Users can insert own lessons"
  ON journey_lessons FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Lesson updates: only the creator can modify
DROP POLICY IF EXISTS "Users can update own lessons" ON journey_lessons;
CREATE POLICY "Users can update own lessons"
  ON journey_lessons FOR UPDATE
  USING (auth.uid() = created_by);

-- Lesson deletion: only the creator can delete
DROP POLICY IF EXISTS "Users can delete own lessons" ON journey_lessons;
CREATE POLICY "Users can delete own lessons"
  ON journey_lessons FOR DELETE
  USING (auth.uid() = created_by);

-- Block mutations: only if user owns the parent lesson
DROP POLICY IF EXISTS "Users can manage own lesson blocks" ON journey_lesson_blocks;
CREATE POLICY "Users can manage own lesson blocks"
  ON journey_lesson_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journey_lessons
      WHERE journey_lessons.id = journey_lesson_blocks.lesson_id
      AND journey_lessons.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own lesson blocks"
  ON journey_lesson_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journey_lessons
      WHERE journey_lessons.id = journey_lesson_blocks.lesson_id
      AND journey_lessons.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lesson blocks"
  ON journey_lesson_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM journey_lessons
      WHERE journey_lessons.id = journey_lesson_blocks.lesson_id
      AND journey_lessons.created_by = auth.uid()
    )
  );
