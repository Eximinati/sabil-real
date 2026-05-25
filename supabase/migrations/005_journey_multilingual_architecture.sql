-- Phase 5C: Journey Content Language Architecture
-- Add shared multilingual structures while keeping legacy content compatible.

ALTER TABLE journey_lessons
ADD COLUMN IF NOT EXISTS localized_content JSONB,
ADD COLUMN IF NOT EXISTS translation_status JSONB DEFAULT '{"en":"ready","ur":"planned"}'::jsonb,
ADD COLUMN IF NOT EXISTS shared_metadata JSONB;

UPDATE journey_lessons
SET translation_status = COALESCE(
  translation_status,
  '{"en":"ready","ur":"planned"}'::jsonb
);

UPDATE journey_lessons
SET shared_metadata = COALESCE(
  shared_metadata,
  jsonb_build_object(
    'lesson_order', day_number,
    'estimated_minutes', estimated_minutes,
    'qa_status', '{}'::jsonb
  )
);

CREATE INDEX IF NOT EXISTS idx_journey_lessons_translation_status ON journey_lessons USING gin (translation_status);
CREATE INDEX IF NOT EXISTS idx_journey_lessons_shared_metadata ON journey_lessons USING gin (shared_metadata);

COMMENT ON COLUMN journey_lessons.localized_content IS E'Language-specific lesson fields by language code, e.g. {"ur": {"title": "..."}}';
COMMENT ON COLUMN journey_lessons.translation_status IS E'Translation readiness map by language code, e.g. {"en":"ready","ur":"planned"}';
COMMENT ON COLUMN journey_lessons.shared_metadata IS E'Shared cross-language lesson identity metadata: arc, week, QA, order.';
