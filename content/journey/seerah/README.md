# The Long Road to Madinah — Seerah/Qisas al-Anbiya Journey Track

A second, longer companion to Sabil's existing 30-day journey (`content/journey/days/`):
a 365-day chronological walk from the first testimony of Tawḥīd (Adam) through every
named prophet to the completion of the message with Muhammad ﷺ, and what followed —
the Rightly-Guided Caliphs.

Full research, sourcing, and the day-by-day outline live in
[`CURRICULUM_OUTLINE.md`](./CURRICULUM_OUTLINE.md) (also published as a browsable
reference at the artifact "The Long Road to Madinah"). This folder holds the actual
authored lesson content, written progressively era by era.

## Track identity

`journey_track = 'seerah-365'` (see `supabase/migrations/012_journey_tracks.sql`).
Runs alongside `'sabil-30'`, the existing journey — this track does not replace it.

## Directory structure

Mirrors `content/journey/days/` exactly, so the same authoring conventions and
(once wired) the same sync pipeline apply:

```
content/journey/seerah/
  day-001/
    en.md
    ur.md
    meta.json
    qa.md
  day-002/
    ...
```

Day numbers are zero-padded to 3 digits (`day-001` … `day-365`) since this track
runs past 99, unlike the 30-day journey's 2-digit `day-01` … `day-30`.

## Canonical section structure

Same nine-part rhythm as `SABIL_CONTENT_SYSTEM.md`, with one adapted label:

1. **Arrival moment** — settle and welcome
2. **Opening reflection** — prepare the heart
3. **Seerah moment** — the day's historical/prophetic scene. For Days 1–165 (before
   Muhammad ﷺ is born into the story) this is a moment from *that era's* prophet —
   Adam, Nūḥ, Ibrāhīm, Yūsuf, Mūsā, and so on — not literally the Seerah of Muhammad ﷺ.
   The heading text is kept as "Seerah moment" (rather than introducing a second
   heading string) so it stays compatible with the existing block-parsing pipeline;
   only the content changes per era.
4. **Quran reflection** — verse keys only (e.g. `112:1`, `112:2`), one per line,
   exactly as the existing days do — the app fetches verse text from the Quran API
   by key, so lesson markdown never hardcodes translated verse text.
5. **Tafsir support** — brief, condensed-first contextual note
6. **Hadith connection** — included only where a hadith's wording and attribution
   are confident and well-established; omitted on days without one, rather than
   risk misquoting or misattributing. Cited by collection name (e.g. "Bukhārī",
   "Hadith Qudsi"), not by a specific number unless that number is certain.
7. **Private reflection** — one open, honest prompt
8. **Tiny action** — one small, non-pressuring step
9. **Closing moment** — peaceful, hopeful close

## Editorial notes specific to this track

- **Accuracy over completeness.** Every "Seerah moment" and historical note is
  written to match the mainstream Sunni sourcing named in `CURRICULUM_OUTLINE.md`
  (Ibn Hishām, Ibn Kathīr, al-Mubārakpūrī, al-Ṭabarī) and to what the Qur'an states
  directly. Where classical sources differ on a detail, the lesson stays general
  rather than asserting one version as certain.
- **Urdu is written natively, not translated.** Per the existing `days/README.md`
  rule: emotional equivalence, not literal sentence mirroring.
- **Day-pacing is pedagogical.** Sequencing 365 days onto a story that spans
  roughly 5,600 years is a teaching order, not a claim about exact historical
  dating — stated up front in each era's framing so it is never implied as
  precision the sources don't have.

## What is NOT done yet (follow-up engineering work)

Writing lesson content and adding the schema column is safe, additive, and doesn't
touch anything currently running. Actually serving this track in the app requires
further changes that are deliberately **out of scope for this content-writing pass**,
so they can be reviewed and tested on their own:

- `src/app/api/journey/sync-content/route.ts` — currently hardcodes
  `loadJourneyDayBundles(1, 30)` and upserts by `day_number` alone. Needs a `track`
  parameter, a `content/journey/seerah` source path, and `journey_track` set on
  insert/upsert (using the new `(journey_track, day_number)` unique constraint).
- `src/lib/journey-emotional-arc.ts` (`getDayIdentity`, `getWeekForDay`,
  `WEEKLY_EMOTIONAL_ARCS`) — currently modeled for exactly 30 days / a handful of
  weeks. Needs a parallel arc table for a 365-day/12-era shape, or to accept the
  track and branch.
- `src/lib/journey.ts` and the `/journey`, `/journey/[day]`, `/journey/reflections`
  routes — currently query `journey_lessons` without a track filter. Needs a
  track selector (or a separate route group, e.g. `/journey/seerah/[day]`) so a
  user's "current day" and progress are computed per track, not globally.
- `src/components/admin/journey-authoring-studio.tsx` and `admin-journey-actions.ts`
  — the authoring UI would need a track switcher to edit/publish this content
  through the same admin flow as the 30-day journey.

Recommend tackling that as its own PR once a first batch of this track's content
has been reviewed, rather than bundling a large, hard-to-test pipeline change in
with devotional writing.
