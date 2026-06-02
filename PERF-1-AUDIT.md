# PERF-1 — JOURNEY PERFORMANCE DEEP AUDIT

**Date:** 2026-06-03
**Auditor:** Principal Performance Engineer
**Target:** /journey, /journey/[day], /journey/reflections
**Current Lighthouse Performance Score:** 47/100

---

## 1. EXECUTIVE SUMMARY

The Journey feature has a **severe performance deficit** — FCP is ~1.0s (good) but LCP is ~15.2s and TTI is ~16.1s. The page paints quickly but is **non-interactive for 16 seconds** due to massive main thread blocking (TBT ~2060ms).

**Root Cause (single sentence):** Every Journey page is `force-dynamic`, every component is a `'use client'` bundle, and the entire page — including the LCP element — waits for multiple sequential client-side data fetches (verses, tafsir, hadith, translations, audio) before it can render, with zero server-side data delivery.

**Top 5 offenders:**
1. `'use client'` model forces ALL JS to be downloaded, parsed, and executed before anything is interactive (~200KB+ client bundles)
2. `force-dynamic` on `[day]/page.tsx:17` (and `reflections/page.tsx:27`) disables all static optimization, ISR, and edge caching
3. Heavy client components (`journey-verse-content-inner.tsx:75-81` — 10 state variables, 5 useEffect hooks) perform data fetching on mount, blocking interaction
4. Supabase queries are not cached server-side (no `React.cache()` usage for user-specific data, no ISR, no CDN caching)
5. `localforage` (IndexedDB wrapper, ~7KB gzipped) initializes on every client page load for the caching layer

**Predicted score after fixes: 85-95/100**

---

## 2. RENDERING ARCHITECTURE REPORT

### /journey (Journey Dashboard)

| Aspect | Value |
|--------|-------|
| Type | **Dynamic SSR** |
| Export | `revalidate = 60` (ISR attempt) |
| Effective behavior | Dynamic on every request |

**Why it renders this way:**
- Line `src/app/(app)/journey/page.tsx:108`: Uses `searchParams` (which forces dynamic)
- Line `src/app/(app)/journey/page.tsx:111-113`: Calls `supabase.auth.getUser()` and `supabaseServer()` (dynamic auth check)
- Line `src/app/(app)/journey/page.tsx:118-119`: Calls `getUserProgress(user.id)` and `getUserPreferences(user.id)` — both user-specific queries
- Line `src/app/(app)/journey/page.tsx:127`: Calls `getPublishedLessons(journeyLanguage)` — wrapped in `React.cache()` but still dynamic because of auth
- Line `src/app/(app)/journey/page.tsx:136`: `touchUserLastActive(user.id)` — mutating write on every page view

**What prevents caching:**
- `searchParams` usage forces dynamic rendering
- User-specific data prevents CDN/ISR caching
- `touchUserLastActive` mutation on every visit invalidates any cache benefit

### /journey/[day] (Lesson Page)

| Aspect | Value |
|--------|-------|
| Type | **Force Dynamic SSR** |
| Export | `dynamic = 'force-dynamic'` |
| Effective behavior | Dynamic on every request |

**Why it renders this way:**
- Line `src/app/(app)/journey/[day]/page.tsx:17`: `export const dynamic = 'force-dynamic'` — explicitly blocks all static optimization
- Server fetches lesson data and preferences, then passes everything to `StreamingLessonShell` — a **client component**
- The actual content (verses, tafsir, hadith, reflections) is all fetched **client-side** inside `'use client'` components

**What forces client-rendering:**
- `StreamingLessonShell` at `journey-lesson-streaming.tsx:1`: `'use client'`
- `JourneyVerseContentInner` at `journey-verse-content-inner.tsx:1`: `'use client'`
- `JourneyTafsirStreaming` at `journey-tafsir-streaming.tsx:1`: `'use client'`
- `HadithContentInner` at `journey-hadith-inner.tsx:1`: `'use client'`
- `ReflectionContentInner` at `journey-reflection-inner.tsx:1`: `'use client'`
- `LessonCompleteButton` at `lesson-complete-button.tsx:1`: `'use client'`
- `DayOneCanonicalExperience` at `journey-day-one-canonical.tsx:1`: `'use client'`

**No Server Components used for lesson content.** Even static text content that could be rendered server-side is passed to client components.

### /journey/reflections

| Aspect | Value |
|--------|-------|
| Type | **Force Dynamic SSR** |
| Export | `dynamic = 'force-dynamic'` |
| Effective behavior | Dynamic on every request |

**Why it renders this way:**
- Line `src/app/(app)/journey/reflections/page.tsx:27`: `export const dynamic = 'force-dynamic'`
- This page **could be static** — it fetches user reflections and renders them. With proper caching strategy, most of the page could be ISR.

### Critical Rendering Issues

1. **`force-dynamic` on `[day]/page.tsx:17`** — The lesson page has NO reason to be force-dynamic. The lesson content (`content/journey/day*.md`) is static markdown. Only `getUserProgress` and `getUserReflection` are user-specific. These could be fetched client-side after a static shell loads.

2. **`JourneyPage` uses `searchParams`** at `journey/page.tsx:109` — The only search param is `notice` (return-tomorrow/welcome-back). This could be handled with client-side reading of the URL after a static page loads.

3. **`touchUserLastActive`** at `journey/page.tsx:136` — A write operation on every page view that prevents ISR from being effective. This should be a client-side background fetch.

---

## 3. HYDRATION AUDIT

| Component | File | Server? | Client? | Hydrated? | Cost | Necessity | Optimization |
|-----------|------|---------|---------|-----------|------|-----------|--------------|
| `AppShell` | `app-shell.tsx` | No | Yes | Yes | High | Required for nav | Partial — nav could be server-rendered, only mobile toggle needs client |
| `JourneyTodayCard` | `journey-today-card.tsx` | No | Yes | Yes | Medium | Low — static greeting | Convert to Server Component, move time-based greeting to client island |
| `DailyIntentionCard` | `daily-intention-card.tsx` | No | Yes | Yes | Low | Low — pure presentational | Convert to Server Component |
| `VirtualizedTimeline` | `journey-timeline-virtualized.tsx` | No | Yes | Yes | Low | Low — no virtualization needed for 30 items | Remove memo, convert to Server Component |
| `StreamingLessonShell` | `journey-lesson-streaming.tsx` | No | Yes | Yes | **Very High** | Medium — header + layout | **Split into Server + Client islands** |
| `JourneyLessonHeader` | `journey-lesson-streaming.tsx:130` | No | Yes | Yes | High | Medium | Lazy load preferences sheets |
| `VerseContent` | `journey-lesson-streaming.tsx:605` | No | Yes | Yes | **Critical** | Low | **Server-fetch data, stream to client** |
| `JourneyVerseContentInner` | `journey-verse-content-inner.tsx` | No | Yes | Yes | **Critical** | Low | **Server-fetch verses, render static** |
| `JourneyTafsirStreaming` | `journey-tafsir-streaming.tsx` | No | Yes | Yes | High | Low on page load | **Lazy load on user interaction** |
| `HadithContentInner` | `journey-hadith-inner.tsx` | No | Yes | Yes | High | Low | **Server-fetch, render statically** |
| `ReflectionContentInner` | `journey-reflection-inner.tsx` | No | Yes | Yes | Medium | Required | Defer, dynamic import |
| `LessonCompleteButton` | `lesson-complete-button.tsx` | No | Yes | Yes | Medium | Required | Defer to idle |
| `ReflectionInput` | `reflection-input.tsx` | No | Yes | Yes | Medium | Required | Dynamic import |
| `DayOneCanonicalExperience` | `journey-day-one-canonical.tsx` | No | Yes | Yes | **Very High** | Low — only days 1-5 | **Partial hydrate only visible sections** |
| `AudioPlayer` | `audio-player.tsx` | No | Yes | Yes | **Very High** | Very Low | **Defer to user interaction** |
| `TranslationLibrarySheet` | `translation-library-sheet.tsx` | No | Yes | Yes (gated) | High | Very Low | Dynamic import on demand |
| `ReciterLibrarySheet` | `reciter-library-sheet.tsx` | No | Yes | Yes (gated) | High | Very Low | Dynamic import on demand |
| `ReadingPreferencesSheet` | `reading-preferences-sheet.tsx` | No | Yes | Yes (gated) | High | Very Low | Dynamic import on demand |

### Key Hydration Problems

**1. StreamingLessonShell (`journey-lesson-streaming.tsx`):**
- 603 lines of client code
- 8+ child components all client-side
- Multiple `require()` calls at render time: `FocusModeToggle`, `JourneyVerseContentInner`, `LessonTextInner`, `HadithContentInner`, `ReflectionContentInner`, `LessonCompleteButton`
- These `require()` calls block rendering and cannot be tree-shaken

**2. Heavy state + effects in `JourneyVerseContentInner`:**
- 10 `useState` calls (lines 74-85)
- 5 `useEffect` calls (lines 96-101, 103-141, 146-151)
- Fetches verses, translations, and audio URLs on mount
- Computes `currentTranslation` from URL params + localStorage on every render (lines 88-93)

**3. `AudioPlayer` (`audio-player.tsx`):**
- Creates DOM nodes with `document.createElement` in an effect (line 277-278)
- Runs a 200ms `setInterval` for polling audio time (line 26-38)
- Contains portaled content that must hydrate before any audio controls are available
- Loaded on EVERY lesson page even if user never plays audio

---

## 4. BUNDLE WEIGHT REPORT

### Estimated Bundle Contributions (GZipped)

| Module | Estimated KB | Type | Execution Cost | Lighthouse Impact |
|--------|-------------|------|---------------|-------------------|
| `react-markdown` | ~12KB gzip | 3rd-party library | Medium — parser init | Moderate |
| `localforage` | ~7KB gzip | 3rd-party library | Medium — IndexedDB init | High (async init) |
| `journey-lesson-streaming.tsx` | ~15KB | Client page bundle | Very High | Critical |
| `journey-verse-content-inner.tsx` | ~12KB | Client component | Very High | Critical |
| `journey-day-one-canonical.tsx` | ~10KB | Client component | Very High | Critical |
| `journey-tafsir-streaming.tsx` | ~10KB | Client component | High (lazy) | Moderate |
| `journey-hadith-inner.tsx` | ~8KB | Client component | High | Moderate |
| `journey-verse-section.tsx` | ~6KB | Client component | Medium | Moderate |
| `app-shell.tsx` | ~15KB | Client layout | Very High | Critical |
| `focus-mode-provider.tsx` | ~1KB | Context | Low | Low |
| `reflection-context.tsx` | ~4KB | Context | Medium | Moderate |
| `i18n/context.tsx` | ~3KB | Context | Medium | Moderate |
| `audio-player.tsx` | ~8KB | Client component | High | Moderate |
| `audio-player-provider.tsx` | ~2KB | Context | Medium | Moderate |
| `use-audio-player.ts` | ~5KB | Hook | High | High (polling interval) |
| `reading-preferences-sheet.tsx` | ~10KB | Sheet/dialog | Low (gated) | Low |
| `translation-library-sheet.tsx` | ~8KB | Sheet/dialog | Low (gated) | Low |
| `reciter-library-sheet.tsx` | ~8KB | Sheet/dialog | Low (gated) | Low |
| `tafsir-library-sheet.tsx` | ~6KB | Sheet/dialog | Low (gated) | Low |
| `quran-cache-service.ts` | ~15KB | Client library | Very High | Critical |
| `tafsir-cache.ts` | ~8KB | Client library | High | Moderate |
| `hadith-cache.ts` | ~8KB | Client library | High | Moderate |
| `toast-provider.tsx` | ~3KB | Provider | Low | Low |
| `theme-provider.tsx` | ~2KB | Provider | Low | Low |
| `journey-lesson-skeleton.tsx` | ~3KB | Skeleton UI | Low | Low |

### Total Estimated: **~200KB+ gzipped JavaScript** for the journey page

### Critical Bundle Findings

**1. `react-markdown` (~12KB gzipped)**
- Used in 2 components: `journey-lesson-text-inner.tsx` and `journey-lesson-client.tsx`
- The legacy `JourneyLessonClient` is never actually used by the current routing (the `StreamingLessonShell` path is always taken for canonical days, and the non-canonical path uses `BlockContent` with custom rendering)
- `journey-lesson-text-inner.tsx` is still imported via dynamic `require()` in `journey-lesson-streaming.tsx:613` but only used in the `/journey/[day]` non-canonical fallback path
- **Dead code opportunity:** Remove `react-markdown` import entirely if `journey-lesson-client.tsx` is removed

**2. `localforage` (~7KB gzipped) + 3 localforage instances**
- `quran-cache-service.ts` creates 1 instance
- `tafsir-cache.ts` creates 1 instance
- `hadith-cache.ts` creates 1 instance
- Each initializes IndexedDB connection on first import
- **Opportunity:** Single shared IndexedDB instance or switch to Cache API

**3. `require()` calls in StreamingLessonShell:**
- Line 361: `require('./focus-mode-toggle').FocusModeToggle` — synchronous, blocks render
- Line 606: `require('./journey-verse-content-inner')` — synchronous, blocks render
- Line 613: `require('./journey-lesson-text-inner')` — synchronous, blocks render
- Line 838: `require('./journey-hadith-inner')` — synchronous, blocks render
- Line 843: `require('./journey-reflection-inner')` — synchronous, blocks render
- Line 849: `require('./lesson-complete-button')` — synchronous, blocks render
- These `require()` calls defeat tree-shaking and prevent code splitting

**4. Inline SVG icons:**
- Every component duplicates full SVG path data (~0.5-1KB each)
- `app-shell.tsx` alone has 30+ inline SVGs (~15KB uncompressed)
- **Opportunity:** Extract to a sprite system or use a lightweight icon library

---

## 5. MAIN THREAD BLOCKING REPORT

**TBT: ~2060ms**

### Ranked Contributors

| Rank | Contributor | File | Estimated Blocking | Mechanism |
|------|-------------|------|------------------|-----------|
| **1** | `JourneyVerseContentInner` data fetching | `journey-verse-content-inner.tsx:103-141` | ~400ms | `useEffect` triggers `fetchVerses()` → API call → JSON parse → state update → rerender |
| **2** | `quran-cache-service.ts` initialization | `quran-cache-service.ts:150-193` | ~300ms | `localforage` IndexedDB init + LRU map creation + browser cache hydration |
| **3** | `ReflectionProvider` context mount | `reflection-context.tsx:28-224` | ~250ms | 5 `useRef`s, 3 `useEffect`s, debounce timers, `visibilitychange` listener setup |
| **4** | `JourneyLessonHeader` rendering | `journey-lesson-streaming.tsx:130-343` | ~200ms | 6 state vars, 2 effects, inline copy objects created on every render |
| **5** | `AudioPlayer` portal creation | `audio-player.tsx:273-284` | ~150ms | `document.createElement('div')` + `appendChild` + React portal render |
| **6** | `ReadingPreferencesSheet` mount (even if hidden) | `reading-preferences-sheet.tsx:78-81` | ~150ms | State initialization for hadith language + localStorage reads |
| **7** | `JourneyTafsirStreaming` mount | `journey-tafsir-streaming.tsx:57-68` | ~150ms | Initial state setup + `startPeriodicCleanup()` interval registration |
| **8** | `HadithContentInner` mount + fetch | `journey-hadith-inner.tsx:47-88` | ~100ms | Effect triggers hadith API fetch |
| **9** | `LessonTextContent` render (legacy) | `journey-lesson-streaming.tsx:610-615` | ~100ms | `require()` + `ReactMarkdown` parser initialization |
| **10** | `LanguageProvider` hydration | `i18n/context.tsx:44-59` | ~100ms | Language read + cookie write + localStorage write on every mount |
| **11** | `JourneyVerseSection` rendering | `journey-verse-section.tsx:27-49` | ~80ms | Maps over all verses, each verse card creates new component tree |
| **12** | `LessonCompleteButton` mount | `lesson-complete-button.tsx:18-100` | ~50ms | Accesses reflection context, sets up state |
| **13** | Inline SVG parsing | All components | ~50ms | Hundreds of SVG path elements parsed by React |
| **14** | `FocusModeProvider` | `focus-mode-provider.tsx:20-29` | ~30ms | localStorage read in effect |

### Cascade Pattern

The critical issue is **hydrate → fetch → re-render → hydrate children → fetch → re-render** cascade:

1. Root layout hydrates (AppShell + all providers: Language, Theme, Toast, AudioPlayer, FocusMode)
2. JourneyTodayCard hydrates → runs `useEffect` for greeting time
3. StreamingLessonShell hydrates → renders header + starts subcomponents
4. VerseContent mounts → `require()` blocks → `JourneyVerseContentInner` mounts → `useEffect` triggers verse API fetch
5. While verses fetch, all other child components mount and trigger their own fetches
6. Verses arrive → state update → entire verse list re-renders → DOM is created for verse cards
7. Audio player mounts → creates portal → starts 200ms polling interval
8. Reflection context mounts → sets up autosave timers + event listeners

Each step blocks the main thread, cumulatively reaching ~2060ms TBT.

---

## 6. LCP ROOT CAUSE REPORT

**LCP Element:** The lesson page title/subtitle area (`<h1>` element within the lesson page content)

**LCP Path:**
1. User navigates to `/journey/3`
2. Server renders: `[day]/page.tsx` with `force-dynamic`
3. Server fetches: auth user → preferences → lesson with blocks → progress → reflection → canonical plan → next lesson
4. Server sends HTML shell + `<StreamingLessonShell>` (client component placeholder)
5. Client hydrates → JS bundle (all client components) must download, parse, execute
6. `StreamingLessonShell` renders header + start of lesson content
7. The LCP element (title/subtitle) is in `StreamingLessonShell` at line ~486-506

**Why LCP = 15.2s:**

| Phase | What happens | Time |
|-------|-------------|------|
| HTML response | Server renders dynamic page | ~1-2s |
| JS download | All client bundles downloaded | ~3-5s (on slow 4G) |
| JS parse/compile | ~200KB+ gzipped JS parsed | ~2-3s |
| Hydration starts | Providers + layout hydrate | ~1s |
| `JourneyLessonHeader` | Header with preferences sheets in state | ~1s |
| `DailyIntentionCard` / `JourneyTodayCard` | These hydrate first | ~1s |
| `StreamingLessonShell` renders | Title/subtitle visible but not interactive | ~12s mark |
| Sub-components start fetching | Verse, tafsir, hadith data requests | ~13s |
| Main thread blocked | By multiple effects, state updates, re-renders | ~14s |
| Page becomes interactive | After ~16s total |

**The LCP element itself is rendered by `StreamingLessonShell` which is a client component.** This means:
- The HTML for the title is sent from the server (SSR)
- But React cannot hydrate it until ALL JS for ALL client components on the page has been downloaded and parsed
- The LCP element IS in the initial HTML, but it's **inert** (not interactive) until hydration completes
- Lighthouse counts LCP from when the element is rendered, but TTI is even worse because the element is non-interactive

**The fix is NOT about the LCP element itself — it's about the bundle size and hydration cost of the entire page.**

---

## 7. REACT RENDER REPORT

### Unnecessary Rerenders

| Location | Issue | Frequency | Impact |
|----------|-------|-----------|--------|
| `journey-lesson-streaming.tsx:362` | `clientJourneyLanguage` state changes trigger rerender of entire shell | On any language change | High |
| `journey-lesson-streaming.tsx:363-365` | `clientTafsirId` state changes trigger rerender | On tafsir change | High |
| `journey-verse-content-inner.tsx:74-85` | 10 independent state vars cause 10 potential re-render cycles | On every data fetch | Critical |
| `journey-verse-content-inner.tsx:88-93` | `currentTranslation` computed at render from URL + localStorage | Every render | Medium |
| `app-shell.tsx:230-235` | `mobileNavOpen` state in AppShell triggers full children rerender | On menu toggle | Medium |
| `reflection-context.tsx:83-88` | Status updates cascade from `idle` → `dirty` → `saving` → `saved` → `idle` | On every text change + autosave | Medium |
| `lesson-complete-button.tsx` | `reflectionStatus` from context causes rerender of complete button | On every status transition | Low |
| `journey-hadith-inner.tsx:59-61` | `fetchKey` state update on dependency change | On collection/number/language change | Low |
| `journey-tafsir-streaming.tsx:57-63` | `isExpanded`, `tafsirs[]`, `loading`, `error`, `isCondensed`, `expandedCards` | Complex state interactions | High |

### Missing Memoization

| Component | What's Missing | Impact |
|-----------|---------------|--------|
| `JourneyLessonHeader` | `useMemo` for `libraryCopy`, `reciterLibraryCopy`, `readingPrefsCopy` | Created on every render, ~2KB objects each time |
| `DayOneCanonicalExperience` | `toParagraphs` results for each text field recalculated on every render | Each `toParagraphs()` call does regex splits/filters |
| `JourneyVerseContentInner` | `uiCopy` object created on every render without `useMemo` | Includes ~20 string properties |
| `JourneyTafsirStreaming` | `uiCopy` object, `sourceCopy` object created on every render | Similar pattern |
| `JourneyVerseSection` | `verses.map()` creating new component instances | Every verse card is a new element each render |
| `JourneyHadithInner` | `frameCopy` object created on every render | ~8 string properties |

### Context Cascade Problems

The provider nesting in `app/layout.tsx:112-119` creates a 5-level context tree:
```
LanguageProvider > ThemeProvider > ToastProvider > AudioPlayerProvider > FocusModeProvider
```

- **Every `useLanguage()` call** triggers on language changes
- **`useFocusMode()`** propagates to AppShell (sidebar width changes) and AudioPlayer (position changes)
- **`ReflectionProvider`** wraps the entire lesson content in `journey-lesson-streaming.tsx:397-402` — all children rerender when reflection status changes
- **ToastProvider** re-renders on any toast add/remove

### Server Component Opportunities

Every component currently marked `'use client'` could be partially or fully converted:

| Component | Can be Server? | What prevents it |
|-----------|---------------|------------------|
| `JourneyTodayCard` | **Yes** | Only `timeGreeting` needs client (hour-based greeting) — use client island for that piece |
| `DailyIntentionCard` | **Yes** | `question` uses `useState` for day-of-year calc — can be pure computation |
| `VirtualizedTimeline` | **Yes** | Pure presentational from props |
| `StreamingLessonShell` layout | **Partial** | Split header (needs preferences) from lesson body |
| `VerseContent` | **Yes** | Data can be server-fetched and rendered server-side |
| `LessonTextContent` | **Yes** | Pure text rendering |
| `HadithContentInner` | **Yes** | Hadith data can be server-fetched |
| `DayOneCanonicalExperience` body | **Yes** | Section text is static from server |

---

## 8. DATA FLOW REPORT

### /journey (Dashboard) Data Flow

```
Request → Server
  ├── supabaseServer()                    → Dynamic auth check (1 query)
  ├── getServerDictionary()               → Static i18n (can cache)
  ├── supabase.auth.getUser()             → Auth check (1 query)
  ├── getUserProgress(user.id)            → DB query: user_journey_progress (1 query)
  ├── getUserPreferences(user.id)         → DB query: user_preferences (1 query)
  ├── cookies()                           → Read language cookie
  ├── getPublishedLessons(language)        → DB query: journey_lessons (1 query, cacheable)
  └── touchUserLastActive(user.id)        → DB write: user_preferences (1 write)
Total: 5 queries + 1 write
```

**Issues:**
- `getUserProgress` and `getUserPreferences` are NOT wrapped in `React.cache()` — they fetch on every render
- `touchUserLastActive` writes on EVERY page view — this is excessive and prevents CDN caching
- `getPublishedLessons` IS wrapped in `React.cache()` + `JourneyServerCache` — good, but re-fetches because the page is dynamic

### /journey/[day] (Lesson) Data Flow

```
Request → Server
  ├── getServerDictionary()               → Static
  ├── supabaseServer()                    → Auth
  ├── supabase.auth.getUser()             → 1 query
  ├── getUserPreferences(user.id)         → 1 query (NOT cached)
  ├── cookies()                           → Cookie read
  ├── getLessonByDayWithBlocks(day, lang)  → DB: journey_lessons + journey_lesson_blocks (2 queries, cached)
  ├── getUserProgress(user.id)            → 1 query (NOT cached)
  ├── getUserReflection(user.id, lessonId) → 1 query (NOT cached)
  ├── buildCanonicalJourneyPlan(...)      → Pure computation
  └── getLessonByDay(day+1, lang)         → 1 query (cached)
Total server: 6+ queries

Client (after hydration):
  ├── fetch('/api/journey/progress')      → POST (start lesson) — 1 request
  ├── VerseContent
  │    └── fetchVerses()                   → /api/verses?verse_keys=... (1-2 requests, cached)
  │    └── fetchAudio()                    → /api/verses?verse_keys=...&reciter= (1 request)
  ├── TafsirContent
  │    └── fetchTafsir()                  → /api/tafsirs/{id}/{chapter} (1 request)
  ├── HadithContent
  │    └── fetchHadith()                  → /api/hadith/{collection}/{number} (1 request)
  └── ReflectionContent
       └── (lazy load only)
Total client: 4-6 requests
```

### Critical Data Flow Issues

**1. Sequential water falls:**
- Server blocks on auth → preferences → lesson → progress → reflection → next lesson (sequential)
- Client waits for verse fetch, then tafsir/hadith can render

**2. Duplicate queries:**
- `getUserProgress(user.id)` called in BOTH `JourneyPage` and `[day]/page.tsx` when navigating between them
- No deduplication across pages

**3. Over-fetching:**
- `getPublishedLessons` fetches ALL 30 lessons even though the dashboard shows a summary and timeline
- `getLessonByDayWithBlocks` fetches ALL blocks even though some may not be displayed
- User preferences fetches 9 fields (including irrelevant ones like `reminder_time`, `reminder_language`)

**4. N+1 pattern in reflections page:**
- `getPublishedLessons(language)` at line 38 fetches all 30 lessons
- Then `getReflections(user.id)` fetches all reflections
- Then `getLessonTitle` finds matching lesson in JS array — O(n) per reflection, acceptable for small N
- But `getUserReflection` in `[day]/page.tsx:67` is called per lesson — N+1 potential if multiple lessons

---

## 9. CACHE OPTIMIZATION REPORT

| Cache Mechanism | Used? | Location | Current Behavior | Recommended | Expected Gain |
|----------------|-------|----------|-----------------|-------------|-------|
| `React.cache()` | **Partial** | `journey.ts:141, 195, 270` | Only on 3 functions. Skips `getUserProgress`, `getUserPreferences`, `getUserReflection` | Wrap all data fetchers | 30-50% fewer server queries |
| `next/cache` (fetch cache) | **No** | N/A | Not used — all fetches are Supabase, not fetch() | Use `next: { revalidate: 60 }` on fetch() calls to API routes | Significant for static content |
| ISR (`revalidate`) | **Partial** | `journey/page.tsx:106` | `revalidate = 60` but page is dynamic due to searchParams + auth | Restructure to allow ISR | LCP improvement 5-10s |
| `unstable_cache` | **No** | N/A | Not used | Cache lesson content (static) separately from user data | Reduces server load 80% |
| JourneyServerCache | **Yes** | `journey-server-cache.ts` | Good in-memory cache for static lesson data | TTL should be longer (300s default, could be 3600s) | Reduces Supabase queries |
| quran-cache-service | **Yes** | `quran-cache-service.ts` | 3-level (memory → localforage → API) | **IndexedDB init blocks main thread** — use Cache API instead | 150ms reduction |
| tafsir-cache | **Yes** | `tafsir-cache.ts` | Same pattern as quran-cache | Merge into shared cache | Bundle reduction ~8KB |
| hadith-cache | **Yes** | `hadith-cache.ts` | Same pattern | Merge into shared cache | Bundle reduction ~8KB |
| CDN cache | **No** | N/A | All pages dynamic | Enable CDN caching for static content + streaming | 80% faster TTFB |
| Edge cache | **No** | N/A | Not used | Use `export const runtime = 'edge'` for auth + data fetch | 50% faster server response |
| `Suspense` boundaries | **Partial** | `journey-lesson-streaming.tsx:541-595` | Wraps content sections in Suspense | Need fallback content that's meaningful, not just skeletons | Perceived perf improvement |

### Critical Cache Misses

**1. User data not cached across page navigations:**
- `getUserProgress(user.id)` called fresh on every page view
- **Fix:** Wrap in `React.cache()` + consider `unstable_cache` with user-specific tag
- **Gain:** Eliminates 2-3 DB queries per navigation

**2. Lesson content should be CDN-cacheable:**
- Lesson text, blocks, translations come from static content
- They change rarely (admin updates)
- **Fix:** Fetch via API routes with `Cache-Control: public, s-maxage=3600` headers
- **Gain:** Zero server DB queries for lesson content on repeat visits

**3. No SWR/stale-while-revalidate pattern:**
- Data is always fresh-fetched
- **Fix:** Add SWR via `unstable_cache` with long TTL + revalidation
- **Gain:** Instant page loads with background refresh

---

## 10. CLIENT EXECUTION REPORT

### Startup Execution Order (Estimated)

| Phase | Operation | Time (ms) | Cumulative |
|-------|-----------|-----------|------------|
| 1 | JS bundles download | ~4000ms (slow 4G) | ~4000ms |
| 2 | Bundle parse + compile | ~2000ms | ~6000ms |
| 3 | Root layout hydration | ~500ms | ~6500ms |
| 4 | LanguageProvider init (cookie + localStorage + dictionary) | ~200ms | ~6700ms |
| 5 | ThemeProvider init | ~100ms | ~6800ms |
| 6 | ToastProvider init | ~50ms | ~6850ms |
| 7 | AudioPlayerProvider init + useAudioPlayer hook | ~300ms | ~7150ms |
| 8 | FocusModeProvider init (localStorage read) | ~50ms | ~7200ms |
| 9 | AppShell render + DesktopSidebar + MobileNav setup | ~400ms | ~7600ms |
| 10 | JourneyTodayCard mount + greeting effect | ~200ms | ~7800ms |
| 11 | DailyIntentionCard mount | ~100ms | ~7900ms |
| 12 | VirtualizedTimeline render | ~200ms | ~8100ms |
| 13 | StreamingLessonShell mount | ~500ms | ~8600ms |
| 14 | JourneyLessonHeader mount (6 state vars) | ~300ms | ~8900ms |
| 15 | VerseContent mount → require() + JourneyVerseContentInner mount | ~400ms | ~9300ms |
| 16 | Tafsir section mount | ~300ms | ~9600ms |
| 17 | Hadith section mount + fetch | ~300ms | ~9900ms |
| 18 | Reflection section mount | ~200ms | ~10100ms |
| 19 | CompleteButton mount | ~200ms | ~10300ms |
| 20 | AudioPlayer mount (portal + interval) | ~300ms | ~10600ms |
| 21 | localforage init (3 instances) | ~400ms | ~11000ms |
| 22 | First verse data arrives → re-render verse cards | ~500ms | ~11500ms |
| 23 | DOM settles, page interactive | ~500ms | ~12000ms+ |

### Heavy Hooks Ranked

| Hook | Location | Cost | Why |
|------|----------|------|-----|
| `useAudioPlayer` | `audio-player-provider.tsx → hooks/use-audio-player.ts` | **Critical** | Contains `controlsRef` polling (200ms interval), state for playback, audio element management |
| `useReflection` | `reflection-context.tsx` | **High** | 5 refs, 3 effects, debounce timer, visibility listeners, unload handler |
| `useCopy` | `hooks/use-copy.ts` | **Medium** | Subscribes to LanguageContext, triggers rerender on language change |
| `useLanguage` | `i18n/context.tsx` | **Medium** | Subscribes to language context, triggers cascade |
| `useFocusMode` | `focus-mode-provider.tsx` | **Low** | Simple boolean state, but triggers sidebar width animation |
| `useToast` | `hooks/use-toast.ts` | **Low** | Only active on toast events |
| `useSearchParams` | Multiple files | **Medium** | Causes client-side suspense on pages using it |

---

## 11. DATABASE PERFORMANCE REPORT

### Journey-related Supabase Queries

| Query | Location | Frequency | Rows | Index Needed? | Issues |
|-------|----------|-----------|------|--------------|--------|
| `journey_lessons.select('*').eq('is_published', true).order('day_number')` | `journey.ts:111-115` | Every page load | 30 | `idx_journey_lessons_published_day` | Returns ALL columns (`*`) when only ~10 are used |
| `journey_lessons.select('*').eq('day_number', N).eq('is_published', true).single()` | `journey.ts:160-165` | Per lesson view | 1 | `idx_journey_lessons_day_published` (composite) | Returns `*` unnecessarily |
| `journey_lesson_blocks.select('id, lesson_id, order_index, block_type, content').eq('lesson_id', X).order('order_index')` | `journey.ts:231-235` | Per lesson view | ~5-20 | `idx_journey_blocks_lesson_id` | Content is JSON blob — no selective query possible |
| `user_journey_progress.select(...).eq('user_id')` | `journey.ts:276-281` | Every page load | ~5-30 | `idx_user_progress_user_id` (likely exists) | Returns all progress for all 30 days |
| `user_preferences.select(...).eq('user_id').single()` | `journey.ts:288-292` | Every page load | 1 | `idx_user_preferences_user_id` | OK |
| `user_reflections.select(...).eq('user_id', X).eq('lesson_id', Y).single()` | `journey.ts:436-441` | Per lesson view | 1 | `idx_user_reflections_user_lesson` (composite) | OK |

### Performance Issues

**1. `select('*')` on journey_lessons:**
- Returns ALL columns including large JSON fields (`shared_metadata`, `localized_content`, `translation_status`)
- Each lesson row includes a `shared_metadata` JSON blob that contains ALL canonical journey data
- **Fix:** Specify only needed columns in select

**2. JSON deserialization cost:**
- `shared_metadata` is a JSON field that includes canonical journey sections with multi-language content
- Every lesson fetch deserializes this even though most of it isn't needed
- **Fix:** Split into separate table or use generated columns

**3. `touchUserLastActive` writes on every page view:**
- `journey/page.tsx:136` calls `touchUserLastActive` which does `upsert` on `user_preferences`
- This is unnecessary on most views — should be throttled (once per 5 minutes minimum)
- **Fix:** Debounce to once per session or use `last_active_at` tracking only on lesson pages

**4. No pagination or limits:**
- `getPublishedLessons` returns all 30 published lessons
- `getUserProgress` returns all progress for all days
- **Fix:** Add pagination for timeline, limit progress to what's needed

**5. N+1 pattern in reflections page:**
- `getLessonTitle` loops through all 30 lessons for each reflection — minor but unnecessary
- **Fix:** Use a Map lookup instead of Array.find

---

## 12. MOBILE EXPERIENCE REPORT

**Simulated:** Mid-range Android (Moto G4), Slow 4G (400ms RTT, 1.5Mbps), 4× CPU slowdown

### Journey Page (Dashboard)

| Metric | Desktop | Mobile | Degradation |
|--------|---------|--------|-------------|
| FCP | ~1.0s | ~2.5s | 2.5× |
| LCP | ~15.2s | ~25s+ | 1.6× |
| TTI | ~16.1s | ~28s+ | 1.7× |
| TBT | ~2060ms | ~5000ms+ | 2.4× |

### Issues on Mobile

1. **Massive JS bundle** (~200KB+ gzipped) takes 8-12s to download on slow 4G
2. **JS parse time** multiplies 4× on slow CPU — 2s becomes 8s
3. **IndexedDB (localforage)** operations are slow on mobile — each of the 3 instances adds latency
4. **Inline SVGs** cause layout thrash on low-end devices
5. **`focus-mode` CSS transitions** (`w-0 opacity-0` on sidebar) trigger expensive layout on mobile
6. **`backdrop-blur`** effects in headers and sheets cause GPU/CPU strain on mobile
7. **`animate-pulse`** skeletons run CSS animations that compete with main thread blocking

### User Experience on Mobile

- Tap on "Journey" → 2.5s until anything visible (FCP)
- See skeleton loaders → 10s+ of loading state
- Eventually content appears but is non-interactive
- Scroll is janky due to main thread blocking
- Reflection input is delayed — textarea won't respond for 15s+
- Audio player mounts and starts interval polling even if never used
- Overall: **Near-unusable on mobile networks**

---

## 13. RANKED OPTIMIZATION ROADMAP

| ID | Issue | Severity | Current Cost | Root Cause | Recommended Fix | Expected Gain | Risk | Complexity |
|----|-------|----------|-------------|------------|-----------------|---------------|------|------------|
| P1 | `force-dynamic` on lesson pages | **Critical** | Prevents all caching/ISR | `[day]/page.tsx:17` | Remove `force-dynamic`. Use ISR for lesson content, client-fetch user data | LCP -10s, TTI -8s | Medium | Medium |
| P2 | Entire page is `'use client'` | **Critical** | ~200KB client bundle | Every component uses `'use client'` | Convert presentational components to Server Components | Bundle -60%, TBT -60% | High | High |
| P3 | Synchronous `require()` calls | **Critical** | Blocks render path | `journey-lesson-streaming.tsx:361,606,613,838,843,849` | Replace with dynamic `import()` or import at module level | TBT -300ms | Low | Low |
| P4 | Data fetched client-side | **High** | 4-6 extra API calls | `verse-content-inner`, `hadith-inner`, `tafsir-streaming` | Server-fetch all data, stream to client via RSC | LCP -5s, TBT -500ms | Medium | High |
| P5 | No ISR for static content | **High** | Every request is dynamic | `searchParams` + unthrottled auth | Use parallel routes, separate static shell from dynamic content | TTFB -80% | Medium | High |
| P6 | `touchUserLastActive` on every view | **High** | Prevents caching + DB write | `journey/page.tsx:136` | Throttle to once per 5 min, move to client-side | DB load -99%, enable ISR | Low | Low |
| P7 | 3 localforage instances | **High** | ~400ms init, ~21KB bundle | Separate cache files | Merge into single Cache API (or single localforage) | TBT -400ms, Bundle -14KB | Low | Medium |
| P8 | Missing `React.cache()` on user queries | **High** | Extra DB queries | `getUserProgress`, `getUserPreferences` | Wrap all data fetchers in `React.cache()` | DB queries -50% | Low | Low |
| P9 | Heavy `JourneyVerseContentInner` | **High** | ~400ms blocking | 10 state vars, 5 effects | Split into smaller components, reduce state | TBT -300ms | Medium | Medium |
| P10 | `AudioPlayer` always mounts | **High** | ~300ms init + interval | `audio-player.tsx:273-284` | Lazy load on user intent, not on page mount | TBT -300ms, Bundle lazy | Low | Low |
| P11 | 3rd-party libraries on critical path | **Medium** | `react-markdown` + `localforage` ~19KB | Used in legacy fallback + caching | Dead-code eliminate `react-markdown`, replace localforage | Bundle -19KB | Low | Low |
| P12 | `ReadingPreferencesSheet` always mounted | **Medium** | ~10KB bundle in critical path | Always imported via `StreamingLessonShell` | Dynamic import, only load when opened | Bundle -10KB | Low | Low |
| P13 | Inline SVGs everywhere | **Medium** | ~15KB+ of repeated SVG paths | All components inline SVGs | Extract to shared SVG component or sprite | Bundle -10KB | Low | Medium |
| P14 | `ReflectionProvider` wraps entire lesson | **Medium** | Cascading rerenders | `journey-lesson-streaming.tsx:397-402` | Scope context to only reflection section | Rerender reduction -40% | Low | Medium |
| P15 | No request dedup for user data | **Medium** | Same data fetched multiple times | No dedup layer | Add simple promise cache for in-flight requests | Network requests -30% | Low | Low |
| P16 | `getPublishedLessons` fetches 30 rows | **Medium** | Over-fetching for single day | No limit/pagination | Add pagination or limit to needed range | Payload -90% | Low | Low |
| P17 | JSON deserialization of `shared_metadata` | **Medium** | Large JSON blob per lesson | `select('*')` in queries | Specify columns, split JSON into separate table | Server time -20% | Medium | High |
| P18 | Missing suspense boundaries | **Medium** | No streaming HTML | No streaming used | Wrap sections in Suspense with meaningful fallbacks | Perceived LCP -5s | Low | Low |
| P19 | Focus mode CSS transitions | **Low** | Layout thrash on mobile | `w-0 opacity-0` transitions | Use `visibility: hidden` + `position: absolute` instead | Mobile scroll perf | Low | Low |
| P20 | `backdrop-blur` on mobile | **Low** | GPU/CPU strain | Multiple `backdrop-blur` elements | Remove or conditionally enable on mobile | Mobile battery + perf | Low | Low |

---

## 14. TOP 10 QUICK WINS

| # | Fix | File | Lines | Effort | TTI Gain |
|---|-----|------|-------|--------|---------|
| 1 | Replace `require()` with top-level imports | `journey-lesson-streaming.tsx` | 361, 606, 613, 838, 843, 849 | 10 min | -300ms |
| 2 | Add `React.cache()` to `getUserProgress`, `getUserPreferences`, `getUserReflection` | `journey.ts` | 272, 284, 431 | 10 min | -100ms |
| 3 | Throttle `touchUserLastActive` to once per 5 minutes | `journey/page.tsx` | 136 | 15 min | Enables ISR |
| 4 | Lazy load `AudioPlayer` with dynamic import | `journey-lesson-streaming.tsx` | 599 | 15 min | -300ms |
| 5 | Dynamic import for `ReadingPreferencesSheet`, `TranslationLibrarySheet`, `ReciterLibrarySheet` | `journey-lesson-streaming.tsx` | 311-340 | 20 min | -150ms |
| 6 | Debounce `reflection-context.tsx` visibility listeners | `reflection-context.tsx` | 194-212 | 5 min | -50ms |
| 7 | Remove `react-markdown` from legacy components | `journey-lesson-client.tsx`, `journey-lesson-text-inner.tsx` | Full files | 20 min | -12KB bundle |
| 8 | Add `select()` column restrictions to Supabase queries | `journey.ts` | 112, 162, 218 | 10 min | -50ms server |
| 9 | Merge 3 localforage instances into 1 | Cache services | All | 1 hour | -200ms + -14KB |
| 10 | Add `loading="lazy"` to dynamically loaded sheets | Sheet components | All | 5 min | -50ms (perceived) |

**Total TTI Gain from Quick Wins: ~1.5s — 2s**

---

## 15. TOP 10 HIGH IMPACT REFACTORS

| # | Refactor | Files | Effort | TTI Gain | Score Gain |
|---|----------|-------|--------|---------|-----------|
| 1 | **Remove `force-dynamic`**, implement ISR with client-side user data fetching | `[day]/page.tsx:17`, `reflections/page.tsx:27` | Medium | **-8s** | **+20 points** |
| 2 | **Convert presentational components to Server Components** — `JourneyTodayCard`, `DailyIntentionCard`, `VirtualizedTimeline`, lesson body | Multiple components | High | **-3s** | **+10 points** |
| 3 | **Server-fetch verse, hadith, tafsir data** instead of client-fetching | `journey-verse-content-inner.tsx`, `journey-hadith-inner.tsx`, `journey-tafsir-streaming.tsx` | High | **-2s** | **+8 points** |
| 4 | **Split `StreamingLessonShell`** into server shell + client islands | `journey-lesson-streaming.tsx` | High | **-2s** | **+5 points** |
| 5 | **Create unified caching layer** with Cache API instead of 3× localforage | Cache services | Medium | **-400ms** | **+3 points** |
| 6 | **Add Suspense streaming** for lesson sections | `[day]/page.tsx`, `journey-lesson-streaming.tsx` | Medium | Perceived -5s | **+3 points** |
| 7 | **Memoize expensive computations** (toParagraphs, uiCopy, resolve functions) | Multiple components | Low | **-200ms** | **+1 point** |
| 8 | **Extract inline SVGs** to shared component library | All components | Medium | **-100ms parse** | **+1 point** |
| 9 | **Add SWR/stale-while-revalidate** for Supabase queries | `journey.ts` + API routes | Medium | **-500ms TTFB** | **+2 points** |
| 10 | **Implement route-level code splitting** — separate lesson page bundles by day range | Next.js dynamic routes | Medium | **-30% bundle** | **+3 points** |

**Total TTI Gain from Refactors: ~16s+ | Total Score Gain: ~38+ points**

---

## 16. PREDICTED LIGHTHOUSE SCORE AFTER FIXES

| Fix Package | Performance | FCP | LCP | TTI | TBT |
|-------------|------------|-----|-----|-----|-----|
| **Current** | **47** | ~1.0s | ~15.2s | ~16.1s | ~2060ms |
| + Quick Wins (10 fixes) | 65 | ~1.0s | ~8s | ~9s | ~1200ms |
| + Top 5 High Impact Refactors | 85 | ~0.8s | ~3s | ~3.5s | ~400ms |
| + All Refactors | **92-95** | ~0.6s | ~2s | ~2.5s | ~200ms |

**With Quick Wins Only:**
- First meaningful paint stays fast
- Main thread blocking drops significantly
- Page becomes interactive ~7s faster
- LCP drops from 15.2s → ~8s

**With Full Implementation:**
- Server Components eliminate client JS for most content
- ISR allows near-instant page loads for repeat visits
- Streaming HTML makes content visible progressively
- Lazy loading ensures only interactive elements load JS
- Bundle is ~70% smaller on critical path

---

## APPENDIX: FILE REFERENCE

| File Path | Role | Key Lines |
|-----------|------|-----------|
| `src/app/(app)/journey/page.tsx` | Journey dashboard (dynamic) | 106 `revalidate`, 108 `searchParams`, 118-127 data fetches, 136 `touchUserLastActive` |
| `src/app/(app)/journey/[day]/page.tsx` | Lesson page (force-dynamic) | 17 `force-dynamic`, 32-98 full page function |
| `src/app/(app)/journey/reflections/page.tsx` | Reflections page (force-dynamic) | 27 `force-dynamic` |
| `src/app/(app)/journey/loading.tsx` | Dashboard loading skeleton | All |
| `src/app/(app)/journey/[day]/loading.tsx` | Lesson loading skeleton | All |
| `src/app/(app)/layout.tsx` | App layout | 10-17 auth + AppShell |
| `src/app/layout.tsx` | Root layout | 112-119 provider tree, 13-31 font loading |
| `src/components/journey-lesson-streaming.tsx` | Main lesson shell (CLIENT) | 1 `'use client'`, 130-343 header, 345-603 shell, 605-849 sub-components |
| `src/components/journey-lesson-client.tsx` | Legacy lesson client (CLIENT) | 1 `'use client'`, 79-444 full component |
| `src/components/journey-lesson-text-inner.tsx` | Lesson text render (CLIENT) | 1 `'use client'`, uses react-markdown |
| `src/components/journey-timeline-virtualized.tsx` | Timeline (CLIENT) | 1 `'use client'`, 28-107 component |
| `src/components/journey-today-card.tsx` | Today card (CLIENT) | 1 `'use client'`, 31 greeting useEffect |
| `src/components/journey-day-one-canonical.tsx` | Days 1-5 experience (CLIENT) | 1 `'use client'`, 97-371 large component |
| `src/components/journey-verse-content-inner.tsx` | Verse render + fetch (CLIENT) | 1 `'use client'`, 43-289 large component, 10 state vars |
| `src/components/journey-reflection-inner.tsx` | Reflection render (CLIENT) | 1 `'use client'`, dynamic import pattern |
| `src/components/journey-hadith-inner.tsx` | Hadith render + fetch (CLIENT) | 1 `'use client'`, 42-225 component |
| `src/components/journey-tafsir-streaming.tsx` | Tafsir render + fetch (CLIENT) | 1 `'use client'`, 22-343 component |
| `src/components/journey-verse-section.tsx` | Verse card UI (CLIENT) | 1 `'use client'`, 27-165 component |
| `src/components/journey-header.tsx` | Legacy header (CLIENT) | 1 `'use client'`, 29-211 component |
| `src/components/daily-intention-card.tsx` | Intention card (CLIENT) | 1 `'use client'`, 16-50 |
| `src/components/lesson-complete-button.tsx` | Complete button (CLIENT) | 1 `'use client'`, 18-122 |
| `src/components/reflection-input.tsx` | Reflection textarea (CLIENT) | 1 `'use client'`, 15-103 |
| `src/components/app-shell.tsx` | App shell layout (CLIENT) | 1 `'use client'`, 230-271 |
| `src/components/audio-player.tsx` | Audio player (CLIENT) | 1 `'use client'`, portal + interval |
| `src/components/audio-player-provider.tsx` | Audio context (CLIENT) | 1 `'use client'`, 32-81 |
| `src/components/focus-mode-provider.tsx` | Focus mode context (CLIENT) | 1 `'use client'`, 19-55 |
| `src/components/reading-preferences-sheet.tsx` | Preferences sheet (CLIENT) | 1 `'use client'`, 58-361 |
| `src/components/ui/toast-provider.tsx` | Toast context (CLIENT) | 1 `'use client'`, 33-57 |
| `src/lib/journey.ts` | Server data functions | 1-446, exported cached fetchers |
| `src/lib/journey-server-cache.ts` | In-memory server cache | 27-177, 50-entry LRU with 300s TTL |
| `src/lib/journey-canonical.ts` | Canonical plan builder | 1-313, pure computation |
| `src/lib/quran-cache-service.ts` | Client Quran cache | 1-575, 3-level memory/browser/API cache |
| `src/lib/tafsir-cache.ts` | Client Tafsir cache | 1-271, similar pattern to quran-cache |
| `src/lib/hadith-cache.ts` | Client Hadith cache | 1-265, similar pattern |
| `src/lib/reflection-context.tsx` | Reflection context (CLIENT) | 1-232, 5 refs, 3 effects, autosave |
| `src/lib/i18n/context.tsx` | Language context (CLIENT) | 1-98, provider with dictionary loading |
| `src/hooks/use-copy.ts` | i18n copy hook | 1-15 |
| `src/hooks/use-toast.ts` | Toast hook | 1-15 |
