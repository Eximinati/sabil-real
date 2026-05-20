-- Drop existing table if exists to start fresh
DROP TABLE IF EXISTS reading_positions;

-- Reading Positions table - supports multiple positions per user across surahs
CREATE TABLE reading_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id INTEGER NOT NULL,
  verse_number INTEGER NOT NULL DEFAULT 0,
  scroll_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_id)
);

-- Indexes for performance
CREATE INDEX idx_reading_positions_user_id ON reading_positions(user_id);
CREATE INDEX idx_reading_positions_user_surah ON reading_positions(user_id, surah_id);
CREATE INDEX idx_reading_positions_updated_at ON reading_positions(updated_at DESC);

-- Enable RLS
ALTER TABLE reading_positions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own positions" ON reading_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own positions" ON reading_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" ON reading_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own positions" ON reading_positions
  FOR DELETE USING (auth.uid() = user_id);

-- Migration: Copy data from reading_progress if it exists and has surah_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reading_progress' 
    AND column_name = 'surah_id'
    AND table_schema = 'public'
  ) THEN
    INSERT INTO reading_positions (user_id, surah_id, verse_number, scroll_position, created_at, updated_at)
    SELECT 
      rp.user_id,
      rp.surah_id,
      rp.verse_number,
      COALESCE(rp.scroll_position, 0),
      rp.updated_at,
      rp.updated_at
    FROM reading_progress rp
    ON CONFLICT (user_id, surah_id) DO NOTHING;
  END IF;
END $$;