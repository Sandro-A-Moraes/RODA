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

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
