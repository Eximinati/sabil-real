-- Phase 5I: Multilingual editorial workflow and localization operations safety

ALTER TABLE journey_lessons
  ALTER COLUMN translation_status SET DEFAULT '{"en":"qa_approved","ur":"untranslated"}'::jsonb;

UPDATE journey_lessons
SET translation_status = jsonb_set(
  COALESCE(translation_status, '{}'::jsonb),
  '{en}',
  '"qa_approved"'::jsonb,
  true
);

UPDATE journey_lessons
SET translation_status = jsonb_set(
  COALESCE(translation_status, '{}'::jsonb),
  '{ur}',
  CASE
    WHEN COALESCE(translation_status->>'ur', '') IN ('ready', 'qa_approved', 'published') THEN '"qa_approved"'::jsonb
    WHEN COALESCE(translation_status->>'ur', '') IN ('in_progress', 'draft_localized', 'emotionally_reviewed') THEN '"draft_localized"'::jsonb
    ELSE '"untranslated"'::jsonb
  END,
  true
);

-- Ensure editorial metadata structure exists for workflow visibility
UPDATE journey_lessons
SET shared_metadata = jsonb_set(
  COALESCE(shared_metadata, '{}'::jsonb),
  '{content_version}',
  COALESCE(shared_metadata->'content_version', '1'::jsonb),
  true
);

UPDATE journey_lessons
SET shared_metadata = jsonb_set(
  COALESCE(shared_metadata, '{}'::jsonb),
  '{editorial}',
  COALESCE(
    shared_metadata->'editorial',
    jsonb_build_object(
      'workflow_version', 1,
      'canonical_source_language', 'en',
      'cross_language_checks', '{}'::jsonb,
      'publishing_safety_checks', '{}'::jsonb,
      'language_states', '{}'::jsonb,
      'drift_flags', '[]'::jsonb
    )
  ),
  true
);

COMMENT ON COLUMN journey_lessons.translation_status IS
  'Language editorial stage map: untranslated, draft_localized, emotionally_reviewed, qa_approved, published';

COMMENT ON COLUMN journey_lessons.shared_metadata IS
  'Shared identity + editorial workflow metadata (version, source hash, checks, drift flags).';
