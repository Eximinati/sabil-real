# Streaming & Progressive Lesson Rendering - Testing Guide

## Overview

This guide explains how to test the streaming and progressive rendering implemented in Phase 7.4.

## Architecture Summary

The Journey lesson page now uses a layered streaming architecture:

1. **Instant Shell**: Header, title, topic, and description render immediately (no Suspense)
2. **Suspense Boundaries**: Each content section (verses, tafsir, hadith, reflection) has its own boundary
3. **Progressive Loading**: Content streams in as data becomes available

## Testing Procedures

### 1. Initial Shell Rendering

**Expected Behavior:**
- Page shell appears immediately on navigation
- Day number, estimated time, and completion status visible instantly
- Topic, title, subtitle, and description render without waiting for API calls

**How to Test:**
1. Open browser DevTools → Network tab
2. Navigate to `/journey/1`
3. Observe: Header content renders before any API requests complete
4. Check DevTools Console for: `[Stream] VerseContent resolved`, `[Stream] HadithContent resolved`, etc.

**Expected Timing:**
- Shell render: < 50ms (from server response)
- First content (verses): 200-800ms depending on API latency

### 2. Progressive Section Loading

**Expected Behavior:**
- Each section appears independently
- No blocking between sections
- Skeleton placeholders show while loading

**How to Test:**
1. Open DevTools → Performance tab
2. Record a page load
3. Look for multiple "LCP" events (one per section)
4. Each section should have distinct loading timeline

**Expected Behavior:**
- Verse section: First verse shows quickly, more load progressively
- Tafsir: Collapsed by default, loads on expand
- Hadith: Shows skeleton → content
- Reflection: Shows skeleton → input field

### 3. Verse Streaming

**Expected Behavior:**
- First verse appears within 300ms
- Remaining verses load progressively
- "Loading more verses..." indicator shows during progressive load

**How to Test:**
1. Navigate to a lesson with multiple verses (e.g., Day 1)
2. Observe the first verse appears almost immediately
3. Watch subsequent verses appear
4. Check console for: `[Performance] Verse content loaded: XXXms`

### 4. Tafsir Loading Behavior

**Expected Behavior:**
- Tafsir section NOT visible by default (collapsed)
- "Tafsir" button shows in the section order
- Clicking expands and triggers API call
- Loading skeleton shows while fetching
- Max 3 tafsir verses show when expanded

**How to Test:**
1. Navigate to any lesson
2. Scroll to find "Tafsir" button (between verses and hadith)
3. Click to expand
4. Observe: Button expands → Loading state → Content appears
5. Network tab: Should see `/api/tafsirs/{id}/{chapter}` request

### 5. Hadith Loading Behavior

**Expected Behavior:**
- Shows skeleton immediately
- Fetches from `/api/hadith` endpoint
- Falls back to static hadith_text if API fails

**How to Test:**
1. Navigate to a lesson with hadith
2. Observe skeleton for ~200-500ms
3. Then content appears
4. If slow network: Still can interact with other sections

### 6. Mobile Streaming Behavior

**Expected Behavior:**
- No layout shifts during streaming
- Skeletons match final content dimensions
- Smooth scrolling maintained

**How to Test:**
1. Open DevTools → Toggle Device Toolbar
2. Select iPhone 12 or similar
3. Navigate to lesson
4. Observe: No jumping or shifting as content loads
5. Scroll smoothly through loading sections

### 7. Skeleton Appearance

**Expected Behavior:**
- Shimmer animation on skeletons
- Layout matches final content closely
- Consistent height/width with real content

**How to Test:**
1. Throttle Network to "Fast 3G"
2. Navigate to lesson
3. Observe premium shimmer effect on all skeletons
4. Compare skeleton dimensions to loaded content

### 8. Hydration Improvements

**Expected Behavior:**
- Reduced JavaScript payload
- Faster Time to Interactive (TTI)

**How to Test:**
1. DevTools → Performance → Lighthouse
2. Run audit on Journey lesson page
3. Compare metrics:
   - Total Blocking Time should be reduced
   - Hydration should be faster

### 9. Dark Mode Compatibility

**Expected Behavior:**
- Skeletons use CSS variables for theming
- Streaming works in both light/dark modes

**How to Test:**
1. Toggle dark mode in app settings
2. Navigate to lesson
3. Observe: Skeletons and content adapt to theme

## Performance Metrics

### Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Time to First Content | ~800ms | ~50ms |
| Time to Interactive | ~1500ms | ~800ms |
| Perceived Load Time | Full wait | Progressive |
| Layout Shifts | Multiple | Minimal |

### Console Logs (Development)

When streaming works, you'll see:
```
⚡ VerseContent Rendered
  Render time: 523.45ms
  
[Stream] VerseContent resolved
[Stream] HadithContent resolved
[Stream] ReflectionContent resolved
[Stream] CompleteButton resolved
```

### Key Performance Indicators

1. **First Contentful Paint (FCP)**: Should be near-instant due to server-rendered header
2. **Largest Contentful Paint (LCP)**: First verse content
3. **Time to Interactive (TTI)**: Reduced due to partial interactivity
4. **Cumulative Layout Shift (CLS)**: Minimal due to skeleton sizing

## Debugging Tips

### If Shell Doesn't Render Instantly
- Check if header is wrapped in unnecessary Suspense
- Verify data is passed as props (not fetched inside component)

### If Sections Don't Stream
- Ensure each section is in its own Suspense boundary
- Check for Promise.all that blocks all sections

### If Skeletons Jump
- Verify skeleton dimensions match content
- Check for missing height/width on containers

### If Mobile is Slow
- Check for large hydration payload
- Consider code-splitting more aggressively

## Files Changed

- `src/components/journey-lesson-streaming.tsx` - Main streaming shell
- `src/components/journey-lesson-skeleton.tsx` - Premium skeletons with shimmer
- `src/components/journey-verse-content-inner.tsx` - Progressive verse loading
- `src/components/journey-tafsir-streaming.tsx` - Collapsible tafsir section
- `src/components/performance-logger.tsx` - Performance tracking utilities
- `src/app/(app)/journey/[day]/page.tsx` - Page with tafsirId prop