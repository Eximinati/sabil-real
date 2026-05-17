-- User preferences (translation + tafsir choices)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  translation_id INTEGER NOT NULL DEFAULT 131,
  tafsir_id INTEGER NOT NULL DEFAULT 169,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Journey lessons (created by you manually in Supabase)
CREATE TABLE journey_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  topic TEXT NOT NULL,
  description TEXT,
  verse_keys TEXT[] DEFAULT '{}',
  lesson_text TEXT,
  hadith_text TEXT,
  hadith_source TEXT,
  reflection_prompt TEXT,
  estimated_minutes INTEGER DEFAULT 15,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User journey progress
CREATE TABLE user_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES journey_lessons(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- User reflections
CREATE TABLE user_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES journey_lessons(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reflections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Published lessons are public to authenticated users"
  ON journey_lessons FOR SELECT
  USING (auth.role() = 'authenticated' AND is_published = TRUE);

CREATE POLICY "Users manage own progress"
  ON user_journey_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own reflections"
  ON user_reflections FOR ALL
  USING (auth.uid() = user_id);

-- Insert Day 1 sample lesson so we can test
INSERT INTO journey_lessons (
  day_number, title, subtitle, topic, description,
  verse_keys, lesson_text, hadith_text, hadith_source,
  reflection_prompt, estimated_minutes, is_published
) VALUES (
  1,
  'Why Are We Here?',
  'The Purpose of Life',
  'Purpose & Creation',
  'On the first day of your journey, we explore the most fundamental question every human asks: Why do I exist? Islam gives a clear, profound answer.',
  ARRAY['51:56', '2:30', '67:2'],
  'Allah created us for one purpose: to worship Him. But worship in Islam is not just prayer — it is living every moment consciously aware of Allah. This awareness transforms everything you do into an act of worship.

The Arabic word used is *ibadah* — often translated as worship, but it means so much more. It means servitude, devotion, and a complete orientation of your life toward your Creator.

When Allah told the angels He was placing a *khalifah* (steward/vicegerent) on earth, He was describing your role. You are not here by accident. You are here as Allah''s representative on this earth, entrusted with a sacred responsibility.',
  'The Prophet (ﷺ) said: "Allah said: I created My servants as hunafa (monotheists), then the devils came and led them astray from their religion."',
  'Sahih Muslim 2865',
  'What does it mean to you personally that Allah created you with a purpose? How does knowing your purpose change how you see your daily life?',
  20,
  TRUE
);