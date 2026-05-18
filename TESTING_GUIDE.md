# Testing Guide - Sabil Production Polish

This guide covers how to test all the production-quality improvements made to the Sabil app.

## Table of Contents

1. [Error Pages](#1-error-pages)
2. [Empty States](#2-empty-states)
3. [Toast Failures](#3-toast-failures)
4. [Loading Skeletons](#4-loading-skeletons)
5. [Accessibility Navigation](#5-accessibility-navigation)
6. [Metadata/Favicon](#6-metadatafavicon)
7. [Sanitization Safety](#7-sanitization-safety)
8. [Dark Mode Compatibility](#8-dark-mode-compatibility)
9. [Mobile Behavior](#9-mobile-behavior)

---

## 1. Error Pages

### Test: Global Error Boundary

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/quran/9999` | Navigate to non-existent Surah | Elegant error card with "Couldn't load this Surah" message, retry button, Arabic phrase "إنا لله وإنا إليه راجعون" |
| `/tafsir?tafsir=1&surah=999` | Invalid tafsir selection | Error card with "Couldn't load Tafsir" message |
| `/hadith?collection=bukhari&number=999999` | Invalid hadith number | Error card with "Couldn't load Hadith" message |
| `/journey/999` | Non-existent lesson day | Error card with "Couldn't load your Journey" message |
| `/search?q=test` then simulate error | Force API failure | Error card with "Search failed" message |

**Acceptance Criteria:**
- No raw stack traces visible
- Calm, human-readable error messages
- Retry button functional
- Dark mode compatible styling
- Arabic phrases displayed correctly

---

## 2. Empty States

### Test: Reflections Empty State

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/journey/1` | Load lesson without reflection | Show empty state: "Write your reflection here..." placeholder |
| `/journey/2` | Load lesson where reflection was never saved | Empty textarea with calm placeholder |

### Test: Bookmarks Empty State

| Route | Action | Expected Result |
|-------|--------|------------------|
| Any Surah page | Click bookmark icon on verses | Shows bookmark icon, no empty state needed here |
| Settings (if bookmarks exist) | Navigate to bookmark settings | Empty state if no bookmarks |

### Test: Search Results Empty State

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/search?q=xyznonexistent123` | Search for impossible query | Empty state: "No results for 'xyznonexistent123'", suggestion to try Arabic |

### Test: Hadith Empty State

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/hadith` | Load hadith page | Collection cards display properly |
| `/hadith?collection=invalid` | Invalid collection | Empty state: "No collections available" with refresh button |

### Test: Tafsir Empty State

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/tafsir?tafsir=1&surah=5` | Select a Surah with no tafsir | Empty state: "No tafsir available for this Surah" |

### Test: Journey Progress Empty State

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/journey` (new user) | Fresh login, no progress | Progress bar at 0%, first lesson unlocked |

### Test: Audio Unavailable

| Route | Action | Expected Result |
|-------|--------|------------------|
| Surah page | Click play on verse with unavailable audio | Toast: "Failed to load audio" |

**Acceptance Criteria:**
- All empty states have subtle icons
- Calm messaging (not "Error: No data")
- Optional helper text present
- Optional CTA buttons when applicable
- Consistent styling with dark mode

---

## 3. Toast Failures

### Test: Save Failures

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Save reflection | Write reflection, disconnect network, click Save | Toast: "Could not save reflection" |
| Save preferences | Go to Settings, change preference, disconnect network, Save | Toast: "Something went wrong" |

### Test: Audio Failures

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Play Surah audio | Go to any Surah, click Play Surah, simulate network failure | Toast: "Failed to load audio" |
| Play verse audio | Click verse play button, simulate network failure | Toast: "Failed to load audio" |

### Test: Fetch Failures

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Load chapters | Go to `/quran`, disconnect network, refresh | Graceful error message, no crash |
| Load tafsir | Select tafsir/surah, disconnect network | Toast or error state |

### Test: Settings Failures

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Update preferences | Change translation, disconnect, save | Toast: "Something went wrong" |

### Test: Bookmark Failures

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Save bookmark | Click bookmark, disconnect network | Toast notification (if implemented) |

**Acceptance Criteria:**
- All catch blocks have toast notifications
- No silent failures anywhere
- Toast messages are user-friendly (not technical)

---

## 4. Loading Skeletons

### Test: Quran Page Loading

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/quran` | Refresh page | Skeleton cards with placeholder shapes |
| `/quran/1` | Navigate to Surah | Full-page skeleton |

### Test: Tafsir Page Loading

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/tafsir` | Load page | Selector skeletons + content skeleton |

### Test: Hadith Page Loading

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/hadith` | Load page | Collection card skeletons |
| `/hadith?collection=bukhari&number=1` | Load specific hadith | Hadith content skeleton |

### Test: Journey Page Loading

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/journey` | Load page | Lesson card skeletons |

### Test: Search Page Loading

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/search?q=test` | Execute search | Search bar + skeleton for results |

**Acceptance Criteria:**
- Skeletons match final layout spacing
- Dark mode compatible (uses CSS variables)
- No layout jumping when content loads
- Smooth fade-in transitions

---

## 5. Accessibility Navigation

### Test: Keyboard Navigation

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Tab through navigation | Press Tab repeatedly | Focus moves through all interactive elements |
| Navigate links | Tab to link, Enter to activate | Navigation works |
| Navigate buttons | Tab to button, Enter/Space to activate | Button clicks work |
| Close mobile menu | Tab to close button, Enter | Menu closes |

### Test: Focus Indicators

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Check all focus states | Tab through page | Visible focus rings (outline) |
| Surah page controls | Tab to play/pause buttons | Clear focus indication |
| Form inputs | Tab to search bar | Visible focus ring |

### Test: ARIA Labels

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Audio controls | Inspect play/pause buttons | `aria-label="Play"` / `aria-label="Pause"` |
| Navigation buttons | Inspect nav buttons | `aria-label` present where needed |
| Empty states | Inspect empty state containers | `role="status"` present |

### Test: Semantic HTML

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Page structure | Inspect HTML | `<main>`, `<nav>`, `<header>`, `<footer>` present |
| Form elements | Inspect search form | `<form role="search">`, `<input type="search">` |

### Test: Screen Reader Compatibility

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Empty state announcements | Use screen reader on empty state | Content announced |
| Error state announcements | Navigate to error state | Error message announced |
| Toast notifications | Trigger a toast | Toast announced |

### Test: Reduced Motion

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Animation preference | Set `prefers-reduced-motion: reduce` | Animations disabled or minimized |

**Acceptance Criteria:**
- All interactive elements keyboard accessible
- Focus indicators visible
- ARIA labels on icons/buttons
- Semantic landmarks
- Screen reader friendly

---

## 6. Metadata/Favicon

### Test: Page Title

| Route | Action | Expected Result |
|-------|--------|------------------|
| Any page | Check browser tab title | "Sabil — Your Quran Companion" |
| Surah page | Check title | Includes Surah name |

### Test: Meta Tags

| Check | How to Test | Expected Result |
|-------|-------------|------------------|
| Description | View page source | Meta description present |
| Open Graph | Test with social debugger | OG tags present |
| Favicon | Check browser tab | Custom favicon.svg displayed |

### Test: Open Graph

| Check | How to Test | Expected Result |
|-------|-------------|------------------|
| OG title | Test with OG debugger | "Sabil — Your Quran Companion" |
| OG description | Test with OG debugger | Appropriate description |
| OG type | Test with OG debugger | `website` type |

**Acceptance Criteria:**
- Consistent title across pages
- SEO-friendly meta tags
- Social media ready OG tags
- Custom favicon loads correctly

---

## 7. Sanitization Safety

### Test: Tafsir HTML Sanitization

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/tafsir?tafsir=1&surah=1` | Load tafsir content | Dangerous tags removed, content safe |
| Inspect rendered HTML | View source of tafsir content | No `<script>`, `<iframe>`, `<object>` tags |

### Test: Search Highlight Sanitization

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/search?q=Allah` | Search and check results | Highlights work, dangerous content stripped |
| Inspect HTML | View source of search results | Scripts/iframes not present |

### Test: Hadith Text Sanitization

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/hadith?collection=bukhari&number=1` | Load hadith | Text renders safely |

**Acceptance Criteria:**
- XSS prevention in place
- No script execution possible
- No iframe injection
- No object/embed tags

---

## 8. Dark Mode Compatibility

### Test: Error Pages Dark Mode

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/quran/9999` (dark mode) | Enable dark mode, navigate | Error card uses dark mode colors |
| All error pages | Toggle dark mode | Consistent dark theme |

### Test: Empty States Dark Mode

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/search?q=xyz` (dark mode) | Enable dark mode, empty search | Empty state uses dark mode colors |

### Test: Loading Skeletons Dark Mode

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/quran` (dark mode) | Enable dark mode, reload | Skeletons use dark mode CSS variables |

### Test: Toast Dark Mode

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Trigger toast (dark mode) | Enable dark mode, trigger error | Toast uses dark mode colors |

### Test: Global Components Dark Mode

| Check | Action | Expected Result |
|-------|--------|------------------|
| Header | Enable dark mode | Uses CSS variable colors |
| Sidebar | Enable dark mode | Proper dark styling |
| Cards | Enable dark mode | Surface colors adapt |

**Acceptance Criteria:**
- All components use CSS variables
- No hardcoded colors like `#E8E0D5`
- Smooth transitions between modes
- Consistent contrast ratios

---

## 9. Mobile Behavior

### Test: Responsive Error Pages

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/quran/9999` | Open on mobile | Error card responsive, proper padding |
| All error pages | Open on mobile | Mobile-friendly layout |

### Test: Mobile Empty States

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/search?q=xyz` | Open on mobile | Empty state responsive |
| `/hadith` | Open on mobile | Collection grid adapts |

### Test: Mobile Navigation

| Action | How to Test | Expected Result |
|--------|-------------|------------------|
| Open menu | Tap hamburger on mobile | Slide-in menu works |
| Close menu | Tap X or backdrop | Menu closes |
| Navigate | Tap menu items | Navigation works |

### Test: Mobile Skeletons

| Route | Action | Expected Result |
|-------|--------|------------------|
| `/quran` | Open on mobile, refresh | Skeleton cards responsive |
| Surah page | Open on mobile | Proper mobile spacing |

### Test: Touch Targets

| Check | How to Test | Expected Result |
|-------|-------------|------------------|
| Button sizes | Inspect touch targets | Minimum 44x44px where possible |
| Links | Inspect links | Adequate touch padding |

**Acceptance Criteria:**
- All pages work on mobile
- No horizontal scrolling
- Proper touch targets
- Responsive layouts

---

## Quick Test Checklist

Run through this before considering testing complete:

- [ ] No console errors on any page
- [ ] No raw API errors displayed
- [ ] All empty states have icons and messages
- [ ] All loading states use skeletons (not spinners)
- [ ] All toast notifications work
- [ ] Dark mode works on all pages
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible
- [ ] Screen reader can navigate content
- [ ] Mobile responsive on all pages
- [ ] Favicon displays correctly
- [ ] Page titles correct
- [ ] Sanitization working (no XSS possible)

---

## Tools for Testing

1. **Browser DevTools** - Console, Network tab, Elements inspection
2. **React Developer Tools** - Component inspection
3. **Accessibility Inspector** - Browser accessibility panel
4. **Screen Reader** - NVDA (Windows), VoiceOver (Mac)
5. **Network Throttling** - DevTools Network tab → Offline
6. **Color Contrast Checker** - browser DevTools or WebAIM
7. **Mobile Emulation** - DevTools device toolbar
8. **OG Debugger** - https://developers.facebook.com/tools/debug/
9. **Twitter Card Validator** - https://cards-dev.twitter.com/validator

---

## Test Data for Specific Tests

### Search Tests
- Use Arabic: `الله` (Allah)
- Use English: `mercy`, `guidance`
- Use impossible: `xyznonexistent123`

### Hadith Tests
- Valid: Bukhari 1, Muslim 93
- Invalid: 9999999

### Surah Tests
- Valid: 1-114
- Invalid: 9999

### Journey Tests
- Valid: Day 1-40 (depending on content)
- Invalid: Day 9999