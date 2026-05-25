# Journey Content Language Architecture (Phase 5C)

This folder is multilingual journey-content foundation.
Each day keeps one shared identity with language variants.

## Structure

```
content/journey/days/
  day-02/
    en.md
    ur.md
    meta.json
    qa.md
```

## Rules

- `en.md` is canonical fallback for runtime.
- `ur.md` optional per day. If missing, app falls back to English without breaking flow.
- `meta.json` keeps shared metadata synchronized across languages.
- `qa.md` keeps bilingual emotional equivalence notes for editorial review.
- Section headings should keep canonical section contract so render and pacing stay coherent.

## Phase 5E scope (Day 1-7)

- Full bilingual emotional localization completed for day-01 to day-07.
- Urdu copy optimized for emotional authenticity, not literal translation.
- Each day includes lightweight bilingual QA (`qa.md`) for drift detection.

## meta.json keys

- `dayNumber`, `lessonOrder`
- `arcIdentity`, `weekChapter`, `emotionalNote`
- `seerahReferences`
- `estimatedMinutes`
- `translationStatus` (`en`, `ur`)
- `qaStatus`

## Editorial intent

- Keep emotional equivalence between languages.
- Do not force literal sentence mirroring.
- Preserve same day arc while letting language pacing feel native.
