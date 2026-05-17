-- Add onboarding_completed column to user_preferences
ALTER TABLE user_preferences 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add hadith_collection and hadith_number to journey_lessons
ALTER TABLE journey_lessons 
  ADD COLUMN IF NOT EXISTS hadith_collection TEXT,
  ADD COLUMN IF NOT EXISTS hadith_number INTEGER;

-- Update Day 1 with hadith data
UPDATE journey_lessons 
SET hadith_collection = 'bukhari', hadith_number = 1
WHERE day_number = 1;