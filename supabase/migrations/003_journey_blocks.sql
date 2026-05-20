-- Add created_by column to journey_lessons
ALTER TABLE journey_lessons 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create journey_lesson_blocks table for structured content
CREATE TABLE IF NOT EXISTS journey_lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES journey_lessons(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient block retrieval
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_id 
ON journey_lesson_blocks(lesson_id, order_index);

-- Enable RLS
ALTER TABLE journey_lesson_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journey_lesson_blocks

-- Admins (service role) can do everything - handled by client
-- Published lesson blocks are readable by authenticated users
CREATE POLICY "Published lesson blocks are readable"
  ON journey_lesson_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journey_lessons 
      WHERE journey_lessons.id = journey_lesson_blocks.lesson_id 
      AND journey_lessons.is_published = TRUE
    )
  );

-- Admins can insert/update/delete their own lesson blocks
-- This is controlled at the application level using service role client

-- Update journey_lessons RLS to allow admin read for unpublished
DROP POLICY IF EXISTS "Published lessons are public to authenticated users" 
ON journey_lessons;

CREATE POLICY "Published lessons are readable"
  ON journey_lessons FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (
      is_published = TRUE 
      OR created_by = auth.uid()
    )
  );

-- Admin can insert/update/delete lessons (controlled by app-level email check)
-- For now, authenticated users who created the lesson can update it
CREATE POLICY "Users can manage own lessons"
  ON journey_lessons FOR ALL
  USING (auth.uid() = created_by);

-- Admin can manage lesson blocks
CREATE POLICY "Users can manage own lesson blocks"
  ON journey_lesson_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM journey_lessons 
      WHERE journey_lessons.id = journey_lesson_blocks.lesson_id 
      AND journey_lessons.created_by = auth.uid()
    )
  );

-- Add index on day_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_journey_lessons_day_number 
ON journey_lessons(day_number);

COMMENT ON TABLE journey_lesson_blocks IS E'Blocks for structured lesson content. Block types: heading, paragraph, reflection, arabic, transliteration, verse, quote, list';
COMMENT ON COLUMN journey_lesson_blocks.block_type IS E'Block type: heading, paragraph, reflection, arabic, transliteration, verse, quote, list';
COMMENT ON COLUMN journey_lesson_blocks.content IS E'JSON content specific to block type';