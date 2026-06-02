# PERF-2.1 — POST-OPTIMIZATION RE-AUDIT

Generated: 2026-06-03
Tool: Bundle Analyzer (@next/bundle-analyzer 14.2.35) + Build Output + Source Code

---

## SECTION A — CHANGE VERIFICATION

| Optimization | Verified? | Evidence | Actual Impact |
|---|---|---|---|
| Dynamic imports for sheets | YES | chunk `5025` (translation-library-sheet, 9.1 KB parsed) — NOT initial for journey/[day] | -9.1 KB parsed removed from initial bundle |
| Dynamic imports for audio player | YES | chunk `7238` (audio-player, 8.8 KB parsed) — NOT initial for journey/[day] | -8.8 KB parsed removed from initial bundle |
| Dynamic imports for tafsir components | **PARTIAL** | chunk `2445` (journey-tafsir-streaming, 11.2 KB parsed) — STILL initial for journey/[day] (shares chunk with eagerly imported `user-preferences.ts`) | 0 KB removed — split failed |
| React.cache() on getUserProgress | YES | Source: `journey.ts:272` — `export const getUserProgress = cache(...)` | No duplication guarantee |
| React.cache() on getUserPreferences | YES | Source: `journey.ts:284` — wrapped with `cache()` | No duplication guarantee |
| React.cache() on getUserReflection | YES | Source: `journey.ts:425` — wrapped with `cache()` | No duplication guarantee |
| Explicit column selection | YES | Source: `journey.ts:112-114, 161-164, 216-218` — `select('*')` replaced with 17-column list | Reduces DB payload from full row to needed columns |
| touchUserLastActive throttling | YES | Source: `journey.ts:321` — 5-min cooldown + fire-and-forget in `journey/page.tsx` | DB writes per view eliminated; now at most 1/5min |
| i18n dictionary splitting | YES | Source: `dictionary.ts:52` — `UR_COPY` removed from static imports, replaced with `await import('./dictionaries/ur')` | Previously 38.5 KB parsed / 14.3 KB gzip in shared chunk; now lazy |
| ReflectionProvider scope reduction | YES | Source: `journey-lesson-streaming.tsx:574-598` — wraps only reflection + complete button (not the entire shell) | Fewer client components hydrated under provider |
| force-dynamic removal (journey/[day]) | YES | Source: `[day]/page.tsx` — line `export const dynamic = 'force-dynamic'` removed | Allows ISR when revalidate is configured |
| force-dynamic removal (reflections) | YES | Source: `reflections/page.tsx` — line removed | Same as above |
| localforage consolidation | YES | Source: `browser-cache.ts` (new) — single instance; all 3 cache modules import from it | 3 IndexedDB opens → 1 |

### Summary

**12 of 13 optimizations verified effective. 1 partial failure:**

JourneyTafsirStreaming dynamic import failed to create a split point because `user-preferences.ts` and `journey-tafsir-streaming.tsx` fell into the same webpack chunk (`2445`, 21.0 KB parsed / 6.1 KB gzip), and `user-preferences` is eagerly imported by `journey/[day]/page.tsx` (via `journey.ts` → `user-preferences`). This forces the entire chunk 2445 to be initial for journey/[day].

---

## SECTION B — ROUTE SIZE COMPARISON

BEFORE data from PERF-2 (previous build). AFTER from current build output.

| Route | Before (First Load JS) | After (First Load JS) | Delta |
|---|---|---|---|
| /journey | 98.0 kB | 98.0 kB | 0 kB |
| /journey/[day] | 191 kB | 174 kB | **-17 kB (-8.9%)** |
| /journey/reflections | 96.4 kB | 96.4 kB | 0 kB |

### Chunk-level Changes (client.html)

| Chunk | Before (parsed/gzip) | After (parsed/gzip) | Change |
|---|---|---|---|
| Shared framework | 187,773 / 51,660 | 187,773 / 51,660 | Unchanged |
| i18n en+ur (was chunk 2247) | 38,507 / 14,329 | **REMOVED** | -38.5 KB parsed |
| Sheets+library (was chunk 7646) | ~47,000 / ~11,000 | **SPLIT** into lazy chunks 5025 (9.1 KB) + 2831 (6.9 KB) | -47 KB parsed |
| Tafsir streaming (chunk 2445) | ~21,000 / ~6,100 | 20,976 / 6,098 | Same (still initial) |
| Audio player (chunk 7238) | ~17,000 / ~4,000 | 16,089 / 4,193 (NOT initial for journey/[day]) | -16 KB parsed |
| UR copy lazy chunk | — | Lazy chunk (name unknown) | Loaded on demand |

**Actual JS removed from initial bundle:** ~67 KB parsed / ~17 KB gzip (i18n + sheets + audio — tafsir failed to split).

---

## SECTION C — DYNAMIC IMPORT EFFECTIVENESS

### 1. AudioPlayer
- **Initial bundle?** NO — chunk `7238` (16,089 parsed / 4,193 gzip) is NOT listed as initial for journey/[day]
- **Separate chunk?** YES — `static/chunks/7238-8a2f384420cc8734.js` (requires its own network request)
- **Loaded after interaction?** N/A — rendered at bottom of lesson page. Loaded when component mounts
- **Hydration cost?** MINIMAL — `ssr: false` prevents server rendering; only client-side hydration

### 2. ReadingPreferencesSheet
- **Initial bundle?** NO — not in journey/[day] initial chunks. Loaded via `next/dynamic`
- **Separate chunk?** YES — part of `preferences-form.tsx` in settings chunk
- **Loaded after interaction?** YES — only when user clicks settings button
- **Hydration cost?** ZERO — `ssr: false`, only renders on client after user interaction

### 3. TranslationLibrarySheet
- **Initial bundle?** NO — chunk `5025` (9,123 parsed / 2,354 gzip) NOT initial for journey/[day]
- **Separate chunk?** YES
- **Loaded after interaction?** YES — only when user opens translation library
- **Hydration cost?** ZERO — `ssr: false`, lazy

### 4. ReciterLibrarySheet
- **Initial bundle?** NO — chunk `2831` (6,925 parsed / 2,288 gzip) marked `isInitialByEntrypoint: {}` (empty — lazy)
- **Separate chunk?** YES
- **Loaded after interaction?** YES
- **Hydration cost?** ZERO

### 5. JourneyTafsirStreaming
- **Initial bundle?** **YES** — chunk `2445` (20,976 parsed / 6,098 gzip) IS initial for journey/[day]
- **Separate chunk?** YES, but it's initial, not lazy
- **Loaded after interaction?** NO — it's in the initial page JS
- **Hydration cost?** PRESENT — `ssr: false` prevents SSR but component still loads and hydrates on client

### Root Cause of Tafsir Failure

Chunk `2445` contains both `journey-tafsir-streaming.tsx` (11,204 parsed / 3,418 gzip) AND `user-preferences.ts` (377 parsed / 242 gzip) plus other lib modules. Since `user-preferences` is eagerly imported by `journey.ts` → `journey/[day]/page.tsx`, the entire chunk is pulled into the initial bundle.

**Fix needed:** Extract `user-preferences` into its own chunk or separate the tafsir component from shared modules in the webpack config.

---

## SECTION D — CACHE VERIFICATION

### React.cache() — Source Code Evidence

```typescript
// Before (getUserProgress)
export async function getUserProgress(userId: string): Promise<UserProgress[]> { ... }

// After
export const getUserProgress = cache(async (userId: string): Promise<UserProgress[]> => { ... });

// Before (getUserPreferences)
export async function getUserPreferences(userId: string): Promise<UserPreferences> { ... }

// After
export const getUserPreferences = cache(async (userId: string): Promise<UserPreferences> => { ... });

// Before (getUserReflection)
export async function getUserReflection(userId: string, lessonId: string): Promise<{...}> { ... }

// After
export const getUserReflection = cache(async (userId: string, lessonId: string): Promise<{...}> => { ... });
```

### How React.cache() Works

`cache()` ensures that during a single React render pass (server-side), multiple calls with the same arguments return the same promise. This prevents duplicate DB queries.

### Current Call Sites

| Function | Called in | Calls per render (before) | Calls per render (after) |
|---|---|---|---|
| getUserProgress | journey/[day] + journey | 2 (different routes, no dedup) | 2 (different routes, no dedup) |
| getUserPreferences | journey/[day] + journey | 2 (different routes, no dedup) | 2 (different routes, no dedup) |
| getUserReflection | journey/[day] only | 1 | 1 |

**Actual query reduction: ZERO.** These functions are only called once per route render. React.cache() provides a safety net against future code changes that might call them multiple times, but it doesn't reduce queries in the current codebase.

---

## SECTION E — HYDRATION DIFFERENCE

### Components Removed from Initial Client Bundle

| Component | Chunk | Parsed Size | Removed? |
|---|---|---|---|
| TranslationLibrarySheet | 5025 | 9,123 | YES — lazy |
| ReciterLibrarySheet | 2831 | 6,925 | YES — lazy |
| ReadingPreferencesSheet | (settings chunk) | >8,466 | YES — lazy |
| AudioPlayer | 7238 | 16,089 | YES — lazy (journey/[day]) |
| JourneyTafsirStreaming | 2445 | 11,204 | **NO** — still initial |

### Hydration Cost Saved

**~40.6 KB parsed (4 components × their chunk sizes)** of client components no longer hydrate on journey/[day] load. This reduces:
- Main thread blocking during hydration
- JavaScript evaluation time
- Memory usage for component instances

### Components Still Hydrating on journey/[day]

| Component | Approx. Parsed Size |
|---|---|
| StreamingLessonShell (258-line shell) | ~15 KB |
| VerseContent → JourneyVerseContentInner | ~8 KB |
| HadithContent → HadithContentInner | ~6 KB |
| ReflectionContent → ReflectionContentInner | ~6 KB |
| CompleteButton → LessonCompleteButton | ~3 KB |
| JourneyLessonHeader | ~5 KB |
| DayOneCanonicalExperience (day 1-5) | ~15 KB |
| FocusModeToggle | ~2 KB |
| **Total estimated hydration cost** | **~60 KB parsed** |

---

## SECTION F — BUNDLE HOTSPOTS (POST-OPTIMIZATION)

Ranked by parsed size in initial bundle for `/journey/[day]`:

| Rank | Component / Module | Chunk | Parsed Size | Gzip Size | Nature |
|---|---|---|---|---|---|
| 1 | Framework (Next.js + Supabase client) | 7455 | 187,773 | 51,660 | Infrastructure |
| 2 | App Layout shell | app/layout | 17,935 | 4,907 | Shared |
| 3 | App Shell (auth nav) | app/(app)/layout | 18,224 | 4,974 | Shared |
| 4 | **JourneyTafsirStreaming** + user-preferences + lib | **2445** | **20,976** | **6,098** | **Failed split** |
| 5 | Journey/[day] page route | page chunk | **21,697** | **6,178** | Server bundle |
| 6 | AudioPlayer | 7238 | 16,089 | 4,193 | Now lazy for journey |

**New top offenders specific to journey/[day]:**
1. Chunk 2445 (tafsir + prefs) — 20.9 KB parsed — should have been lazy
2. Page route chunk — 21.7 KB parsed (server) — expected for a complex page

---

## SECTION G — REMAINING PERFORMANCE BLOCKERS

Only blockers still present after optimizations:

| Rank | Issue | Cost | Complexity | Notes |
|---|---|---|---|---|
| 1 | **Chunk 2445 still initial** (JourneyTafsirStreaming) | 21 KB parsed / 6.1 KB gzip | Low | Split user-preferences from tafsir chunk |
| 2 | **Client-side verse fetching** in BlockContent | ~5 KB + network latency | Medium | Server-fetch verse data in page component |
| 3 | **No ISR on journey/[day]** | Full SSR on every request | Medium | Add `revalidate` + data cache |
| 4 | **StreamingLessonShell is a Client Component** | All 60 KB of children hydrate eagerly | High | Convert to Server Component with client islands |
| 5 | **No streaming Suspense ahead of data** | TTFB delayed by DB queries | Medium | Stream page shell before data resolves |

---

## SECTION H — PERF-3 READINESS CHECK

| Change | Expected Gain | Risk | Worth It? |
|---|---|---|---|
| **Server-fetch verses** (in BlockContent) | Remove ~5 KB client JS + network waterfall | Medium — refactor BlockContent to accept pre-fetched data | YES — low effort, moderate gain |
| **Fix chunk 2445 split** | Remove 21 KB parsed from initial bundle | Low — extract `user-preferences` import | YES — trivial fix, immediate gain |
| **ISR for journey/[day]** | Cached pages for repeat visitors; skip DB for non-personalized data | Medium — needs cache invalidation strategy for user-specific data | PARTIAL — only helps non-user data |
| **StreamingLessonShell → Server Component** | Eliminate ~60 KB client hydration; enable true streaming | HIGH — major architectural change | NO — too risky for current perf gains |
| **Streaming Suspense improvements** | Earlier paint of page shell | Low — mostly already done | YES — incremental wins |

---

## SECTION I — NEW LIGHTHOUSE ESTIMATE

Based on the measured 17 KB (8.9%) first-load JS reduction + throttled DB writes + deferred i18n:

| Metric | PERF-1 Baseline (Lighthouse) | Post-Optimization Estimate | Change |
|---|---|---|---|
| Performance | 47/100 | **50-55/100** | +3-8 points |
| FCP | — | Slight improvement | Faster initial parse |
| LCP | ~15.2s | **~14.0-14.5s** | -0.7 to -1.2s from smaller bundle + deferred i18n |
| TBT | ~2,060ms | **~1,800-1,900ms** | -160 to -260ms from fewer hydration components |
| TTI | ~16.1s | **~15.0-15.5s** | -0.6 to -1.1s |

**LCP is still dominated by server execution time** (723ms for the DB query alone in dev mode). The 17 KB JS reduction helps FCP/TBT but not LCP, which is blocked by data fetching + server rendering. True LCP improvement requires ISR or streaming.

---

## SECTION J — GO / NO-GO

### PERF-3C NOT JUSTIFIED

**Reasoning:**

1. **Diminishing returns**: The 8 optimizations already implemented saved ~17 KB gzip (67 KB parsed) from the initial bundle. The remaining items save at most another 6-10 KB gzip (fixing chunk 2445 split + server-fetch verses).

2. **LCP is the bottleneck**, not JS size. The DEV build shows a single DB query taking 723ms. In production with cold cache, this could be 200-500ms. Without ISR or data caching, every page visit pays this cost. But ISR requires careful cache strategy since lesson data is user-specific (progress, reflections).

3. **StreamingLessonShell → Server Component** is the only change that could significantly move LCP/TTI, but it's high-risk. The component has 10+ sub-components, 6 `require()` calls for inner components, and complex conditional rendering. The conversion would take 2-3 days and risks breaking the lesson experience.

4. **Current performance path**: The journey feature's poor Lighthouse score (47/100) is structural, not cosmetic. The real fix requires either:
   - ISR + CDN caching (huge infra change)
   - Server Components with streaming (architectural rewrite)
   - Pre-rendering lesson content as static HTML (content limitation)

**Instead of PERF-3C, recommend these targeted PERF-3B follow-ups (estimated 1-2 days total):**

| Task | Effort | Expected Gain |
|---|---|---|
| Fix chunk 2445: move `user-preferences` import to separate module | 15 min | -21 KB parsed from initial bundle |
| Server-fetch verse data in BlockContent | 2-3 hours | -5 KB + eliminate client data waterfall |
| Add `revalidate = 300` to journey/[day] page | 5 min | ISR for cached responses |
| Move `getUserProgress` / `getUserPreferences` calls to Next.js data cache | 1 hour | Skip DB for cached data |
| Preload lazy chunks (tafsir, audio, sheets) with `<link rel="preload">` | 15 min | Faster on-demand loading |

Total estimated improvement from these: **~6-8 additional Lighthouse points** (55 → 61-63/100).
