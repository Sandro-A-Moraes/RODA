# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Test the allowed case of a lint exemption in every import form (alias and relative), not only the forbidden case.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `lint` · harmful: 0
- features: foundation
- evidence: mutant 7 eslint.config.js:10 (lint)
- last seen: 2026-10-07T17:14:54Z

### L-002 - When a spec states a position (such as below the input), assert render order in the tree, not only presence.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: foundation
- evidence: mutant 9 src/shared/ui/text-field.tsx:46 (ui)
- last seen: 2026-10-07T17:14:54Z

### L-003 - Test ESLint rules with the Linter class and the flat config array, because the ESLint class loads config by dynamic import and fails under Jest.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `tooling` · harmful: 0
- features: foundation
- evidence: tooling/__tests__/lint-rules.test.ts:12 (tooling)
- last seen: 2026-10-07T17:14:55Z

### L-004 - Never place test files under the Expo Router app directory, since every file there becomes a route; keep them under tooling/__tests__.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: foundation
- evidence: tasks.md T22 home-route.test.tsx (routes)
- last seen: 2026-10-07T17:14:55Z

### L-005 - Name the accessibility mechanism (label, hint, role) in an AC that says to expose something to accessibility.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: foundation
- evidence: spec.md Shared UI AC5 line 100 (spec)
- last seen: 2026-10-07T17:14:55Z

### L-006 - Test a shared behavior such as network retry on every screen that offers it, not only on the first screen built.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: auth
- evidence: validation.md mutant 11 (src/modules/auth/presentation/register-screen.tsx:100) (ui)
- last seen: 2026-10-07T19:17:49Z

### L-007 - When async restore and an event subscription both set state, test an event that arrives before the restore resolves.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `session` · harmful: 0
- features: auth
- evidence: validation.md mutant 12 (src/modules/auth/presentation/session-provider.tsx:39) (session)
- last seen: 2026-10-07T19:17:49Z

### L-008 - Specify protected-route outcomes separately for URL entry and in-app navigation, because declarative route guards block in-app navigation instead of redirecting.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: auth
- evidence: AUTH-08 AC4 (tooling/__tests__/root-navigator.test.tsx:93-107) (routes)
- last seen: 2026-10-07T19:17:49Z

### L-009 - Name which layer clears an invalid stored session in the AC, so the clearing is either testable or explicitly manual.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: auth
- evidence: AUTH-07 AC6 (src/modules/auth/data/supabase-auth-repository.ts:59-66) (spec)
- last seen: 2026-10-07T19:17:50Z

### L-010 - Use router.dismissTo, not router.push, for a back link to a screen that is usually already in the stack.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: auth
- evidence: SPEC_DEVIATION app/(auth)/register.tsx:5 (routes)
- last seen: 2026-10-07T19:17:50Z

### L-011 - When an action is shown only for some error codes, test that it is absent for another code on every screen that renders it.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: auth
- evidence: validation.md iteration 2 mutant 19 (src/modules/auth/presentation/register-screen.tsx:100) (ui)
- last seen: 2026-10-07T19:34:44Z

### L-012 - Name the exact display format of any date or label an AC requires the UI to show.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: stories
- evidence: STORY-03 AC7 (validation.md spec-precision gap 1) (spec)
- last seen: 2026-10-07T23:51:42Z

### L-013 - Name the error code and the user-facing message for every rejection an AC requires.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: stories
- evidence: STORY-06 AC4 (validation.md spec-precision gap 2) (spec)
- last seen: 2026-10-07T23:51:42Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
