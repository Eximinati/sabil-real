Phase 1: Ship Blockers (Must fix before launch)
- F1: Replace sendBeacon with fetch({ keepalive: true }) including CSRF header, or disable CSRF on reflection POST
- F2: Change login redirect to use window.location.href instead of router.push + router.refresh(); add session check to auth layout
Phase 2: Auth Flow Rewrite
- F3: Add redirect param to middleware and login page
- F4: Check session in auth layout, redirect to /journey if authenticated
- F6: Add "Forgot password" link; add Supabase password reset flow
- F8: Expand OAuth redirect paths or make them dynamic
- F16: Add "Resend confirmation email" to login page
Phase 3: CSRF Hardening
- F5: Require token validation even when origin matches
- F7: Check fetch response in signout
- F15: Rotate CSRF token on signout and periodically
Phase 4: Data Integrity & Cache Consolidation
- F9: Handle .single() errors gracefully
- F11: Fix null-check for shared_metadata
- F12: Consolidate into a single cache service
- F18: Add localStorage fallback for reflection unsaved text
Phase 5: Polish & Monitoring
- F13: Add offline indicator
- F17: Singleton ReadingProgress
- Add structured logging (e.g., Pino)
- Add error tracking integration (Sentry)
- Add performance monitoring for API calls