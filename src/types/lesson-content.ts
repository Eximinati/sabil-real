export interface VerseReference {
  verseKey: string;
  chapterId: number;
  verseNumber: number;
}

export interface TafsirReference {
  chapterId: number;
  tafsirId: number;
}

export interface HadithReference {
  collection: string;
  hadithNumber: number;
}

export interface AudioReference {
  verseKey: string;
  reciterId: number;
}

export interface LessonFragment {
  type: 'verse' | 'tafsir' | 'hadith' | 'text' | 'reflection' | 'takeaway';
  order: number;
  data?: Record<string, unknown>;
}

export interface LessonMetadata {
  id: string;
  dayNumber: number;
  title: string;
  subtitle?: string;
  topic: string;
  description?: string;
  estimatedMinutes: number;
  isPublished: boolean;
  default_tafsir_id?: number;
  fallback_tafsir_id?: number;
  enable_user_tafsir?: boolean;
}

export interface LessonContent {
  metadata: LessonMetadata;
  fragments: LessonFragment[];
  verseReferences: VerseReference[];
  audioReferences: AudioReference[];
  tafsirReferences: TafsirReference[];
  hadithReferences: HadithReference[];
}

export interface ResolvedVerse {
  verseKey: string;
  textUthmani: string;
  chapterName: string;
  translations: {
    text: string;
    resourceName: string;
    resourceId: number;
  }[];
  audioUrl?: string;
}

export interface ResolvedTafsir {
  chapterId: number;
  verseNumber: number;
  text: string;
}

export interface ResolvedHadith {
  collection: string;
  hadithNumber: number;
  name: string;
  english: string;
  arabic?: string;
}

export interface ResolvedLesson {
  metadata: LessonMetadata;
  verses: ResolvedVerse[];
  tafsirs: ResolvedTafsir[];
  hadiths: ResolvedHadith[];
  lessonText?: string;
  reflectionPrompt?: string;
}

export interface LessonResolutionOptions {
  translationId: number;
  tafsirId: number;
  reciterId: number;
}

export interface LessonCache {
  verses: Map<string, ResolvedVerse>;
  tafsirs: Map<string, ResolvedTafsir>;
  hadiths: Map<string, ResolvedHadith>;
}

export interface MultilingualLesson {
  language: string;
  lessonText?: string;
  reflectionPrompt?: string;
  takeaway?: string;
}

export interface SeerahReference {
  topic: string;
  content: string;
}

export interface FutureLessonExtensions {
  multilingualContent?: Record<string, MultilingualLesson>;
  seerahReferences?: SeerahReference[];
  additionalNotes?: string[];
}