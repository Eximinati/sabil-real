# SABIL PROJECT MASTER ROADMAP

Version: 1.0
Status: LOCKED
Date: 2026-06-02

---

# PURPOSE

This document is the official execution roadmap for the Sabil codebase.

The objective is to:

* Prevent random bug-fixing
* Prevent phase mixing
* Prevent architectural drift
* Prevent duplicate audits
* Ensure every change is verified
* Ensure every phase is independently shippable

No implementation should begin outside this roadmap.

---

# EXECUTION RULES

## Rule 1 — No New Audits During Active Phase

While a phase is being executed:

* No new product-wide audits
* No new feature audits
* No searching for additional bugs

Only phase-specific verification is allowed.

---

## Rule 2 — Verify Before Implementing

Every phase follows:

1. Verification Audit
2. Root Cause Confirmation
3. Implementation Plan
4. Implementation
5. Verification
6. Re-Audit
7. Phase Lock

Never implement directly from assumptions.

---

## Rule 3 — One Active Phase Only

Allowed:

P1 → Complete → P2

Not allowed:

P1 + P2 + P3 simultaneously

Exception:

P5 Accessibility may be executed in parallel by a separate engineer because it has minimal overlap.

---

## Rule 4 — Root Cause Driven

Work is organized by root causes.

Never work issue-by-issue.

Example:

Wrong:

* Fix bug A
* Fix bug B
* Fix bug C

Correct:

* Fix RC3
* Verify RC3 resolved
* Close RC3

---

## Rule 5 — Every Phase Must End With

A final report containing:

* Files changed
* Risks removed
* Regressions checked
* Build verification
* Remaining issues

Then phase is marked LOCKED.

---

# PHASE OVERVIEW

P0 → Immediate Hotfix

P1 → Admin Security Lockdown

P2 → Session Infrastructure

P3 → Auth Security Hardening

P4A → Data Integrity Core

P4B → Reflection Integrity

P5 → Accessibility Foundation

P6 → Infrastructure Resilience

P7 → UX Quality

---

# P0 — IMMEDIATE HOTFIX

Status: READY

Root Cause:

* RC8

Objective:
Restore correct mobile rendering.

Includes:

* Missing viewport metadata

Expected Result:

* Proper mobile scaling
* Proper responsive rendering

Risk:
Very Low

Ship Blocker:
YES

Completion Criteria:

* Viewport metadata added
* Mobile rendering verified
* Build passes

Phase Lock Condition:
Mobile rendering confirmed correct.

---

# P1 — ADMIN SECURITY LOCKDOWN

Status: READY

Root Causes:

* RC1

Findings:

* F01
* F02
* F03
* F17
* F18

Objective:
Restore authorization boundaries.

Users must not gain admin access without authorization.

Includes:

* Server-side admin checks
* Admin API protection
* Admin page protection
* RLS correction
* Remove public admin exposure
* Remove client-side-only trust model

Expected Result:

* Non-admin users blocked
* Admin APIs protected
* Admin pages protected
* RLS restored

Ship Blocker:
YES

Risk Reduction:
Maximum

Verification Required Before Coding:
YES

Phase Lock Criteria:

* Non-admin cannot access admin pages
* Non-admin cannot call admin APIs
* RLS verified
* Build passes

---

# P2 — SESSION INFRASTRUCTURE

Status: PENDING

Root Causes:

* RC4

Findings:

* F12
* F13

Objective:
Make authentication and sessions reliable.

Includes:

* Cookie propagation verification
* Middleware session handling
* Session expiry handling
* Reflection save recovery
* 401 recovery flows

Expected Result:

* Sessions remain stable
* Session expiry handled gracefully
* No silent session loss

Ship Blocker:
YES

Verification Required:
YES

Phase Lock Criteria:

* Session persistence verified
* Expiry recovery verified
* No random logout behavior

---

# P3 — AUTH SECURITY HARDENING

Status: PENDING

Root Causes:

* RC5

Findings:

* F09
* F10
* F11

Objective:
Protect authentication flows.

Includes:

* CSRF protection
* OAuth state validation
* Redirect validation

Expected Result:

* Login CSRF eliminated
* Redirect abuse prevented
* Mutation endpoints protected

Ship Blocker:
YES

Verification Required:
YES

Phase Lock Criteria:

* CSRF verified
* OAuth state verified
* Redirect validation verified

---

# P4A — DATA INTEGRITY CORE

Status: PENDING

Root Causes:

* RC2
* RC3

Findings:

* F05
* F06
* F07
* F19
* F20
* F23
* F27

Objective:
Eliminate silent data loss.

Includes:

Journey:

* Save reliability
* Progress reliability

Reading:

* Progress corruption
* Navigation loss
* State consistency

Expected Result:

* Writes verified
* Progress preserved
* No silent corruption

Ship Blocker:
YES

Verification Required:
YES

Phase Lock Criteria:

* Progress preserved
* Writes validated
* Error handling verified

---

# P4B — REFLECTION INTEGRITY

Status: PENDING

Root Causes:

* RC10

Findings:

* F21
* F22

Objective:
Make reflection data trustworthy.

Includes:

* Reflection deletion behavior
* Reflection conflict handling
* Reflection consistency

Expected Result:

* Reflections removable
* Multi-tab behavior predictable

Ship Blocker:
HIGH PRIORITY

Verification Required:
YES

Phase Lock Criteria:

* Reflection deletion works
* Reflection consistency verified

---

# P5 — ACCESSIBILITY FOUNDATION

Status: PENDING

Root Causes:

* RC7
* RC9

Findings:

* F15
* F16
* F29
* F30
* F31
* F32
* F33

Objective:
Make the application usable for keyboard and screen-reader users.

Includes:

* Focus trapping
* Dialog semantics
* Focus restoration
* Skip-to-content
* Aria-live
* Localized accessibility labels
* Contrast improvements

Expected Result:

* Accessible overlays
* Accessible navigation
* Accessible search

Ship Blocker:
YES

Verification Required:
YES

Phase Lock Criteria:

* Keyboard navigation verified
* Screen reader audit passes
* Overlay accessibility verified

---

# P6 — INFRASTRUCTURE RESILIENCE

Status: PENDING

Root Causes:

* RC6
* RC14

Findings:

* F04
* F08
* F26
* F36

Objective:
Increase reliability and fault tolerance.

Includes:

* Cache deadlock prevention
* Cache policy correction
* Transaction safety
* Offline fallback

Expected Result:

* No poisoned cache entries
* Correct cache behavior
* Safer admin sync operations

Ship Blocker:
NO

Verification Required:
YES

Phase Lock Criteria:

* Cache verified
* Transactions verified
* Resilience tests pass

---

# P7 — UX QUALITY

Status: PENDING

Root Causes:

* RC11
* RC12
* RC13
* RC15

Findings:

* F24
* F25
* F28
* F35
* F37

Objective:
Polish user experience and remove remaining quality issues.

Includes:

* Registration feedback
* Settings stability
* Progress tracking cleanup
* Cross-tab synchronization

Expected Result:

* Better onboarding
* Stable settings
* Consistent multi-tab experience

Ship Blocker:
NO

Verification Required:
YES

Phase Lock Criteria:

* UX regressions checked
* Settings verified
* Cross-tab behavior verified

---

# OFFICIAL EXECUTION ORDER

1. P0 — Immediate Hotfix
2. P1 — Admin Security Lockdown
3. P2 — Session Infrastructure
4. P3 — Auth Security Hardening
5. P4A — Data Integrity Core
6. P4B — Reflection Integrity
7. P5 — Accessibility Foundation
8. P6 — Infrastructure Resilience
9. P7 — UX Quality

---

# NEXT ACTION

DO NOT IMPLEMENT YET.

Next task:

"P1 Verification Audit"

Scope:

* RC1
* F01
* F02
* F03
* F17
* F18

Goal:

Prove every finding with execution traces, file references, authorization flow diagrams, and impact validation before touching code.
