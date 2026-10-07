# Foundation Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/foundation/spec.md`
**Diff range**: `7bd2f4d..HEAD` (HEAD = 5c51b6c: 22 task commits T1-T22 plus fix commit `test(foundation): strengthen boundary and text field assertions`)
**Iteration**: 2 of 3 (re-verification after test-only fixes for mutants 7 and 9)
**Verifier**: independent sub-agent (author ≠ verifier)

## Validation: foundation - PASS ✅

Iteration 2: both surviving mutants from iteration 1 (7 and 9) are now killed by the new tests in commit 5c51b6c. All 26 ACs and both edge cases are met, the gate is green and 16/16 mutants are killed. Iteration 1 verdict was FAIL (2 survivors, test-only gaps).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T21 | ✅ Done | Every Done-when box checked; one commit per task (22 commits in range) |
| T22 | ⚠️ Done (code) | Manual `npx expo start --web` check is PENDING the user (recorded as pending, not a failure). Test moved to `tooling/__tests__/home-route.test.tsx` (justified, see Code Quality) |

---

## Spec-Anchored Acceptance Criteria

### P1: Runnable, verifiable project

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 `npx expo start` renders blank screen with `background` role (cream `#F5EEDF`), no runtime errors | background = `lightColors.background` = `#F5EEDF` | `tooling/__tests__/home-route.test.tsx:15` - `expect(style.backgroundColor).toBe(lightColors.background)`; `src/core/theme/__tests__/colors.test.ts:18` pins cream to `'#F5EEDF'`; `app/index.tsx:4` renders `<Screen />`; `npx expo export --platform web` exit 0 (run by Verifier) | ✅ PASS (render + web bundle); manual `expo start` check pending user |
| AC2 `npm test` runs at least one passing smoke test, exit 0 | exit 0, ≥1 passing smoke test | `tooling/__tests__/smoke.test.ts:4` - `expect(sum).toBe(2)`; `npm test` exit 0, 103 passed | ✅ PASS |
| AC3 `npm run typecheck` zero errors under `strict: true` | exit 0, strict on | `tsconfig.json:3` `"strict": true`; `npm run typecheck` exit 0 | ✅ PASS |
| AC4 `npm run lint` exits 0 on clean tree | exit 0 | `eslint.config.js:76`; `npm run lint` exit 0 | ✅ PASS |
| AC5 cross-module non-index import fails lint with boundary-violation error | rule `no-restricted-imports` reports; message "Module boundary violation: ..." | `tooling/__tests__/lint-rules.test.ts:35` `expect(found).toHaveLength(1)` (alias form), `:44` (relative form); allowed cases `:53`, `:62`, `:71` (own module via alias, added in 5c51b6c) `toHaveLength(0)`; message text at `eslint.config.js:13-14` (message string itself not asserted) | ✅ PASS (mutant 7 now killed) |
| AC6 `domain/` importing react, react-native, expo, `@supabase/supabase-js` fails lint | each reported | `tooling/__tests__/lint-rules.test.ts:99` `expect(found).toHaveLength(1)` for react, react-native, expo, expo-router, @supabase/supabase-js; non-domain `:110` `toHaveLength(0)`; zod `:120` `toHaveLength(0)` | ✅ PASS |
| AC7 aliases `@/core`, `@/shared`, `@/modules` resolved by TS, Jest and Expo bundler | three exact aliases; Jest parity; bundler | `tooling/__tests__/aliases.test.ts:18` `toEqual(['@/core/*','@/modules/*','@/shared/*'])`, `:32` `expect(mapper[key]).toBe(target)`; TS via typecheck exit 0; bundler via `app/index.tsx:1` `@/shared/ui` and `app/_layout.tsx:3` `@/core/di` in a successful web export | ✅ PASS |

### P1: Core error model and theme

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 `AppError` with fixed `code` set and pt-BR `message` | six codes; message string | `src/core/errors/__tests__/app-error.test.ts:16-17` `expect(error.code).toBe(code)` and message length > 0 over all six codes; `:33` custom message `toEqual({code:'validation',message:'E-mail inválido'})`; type at `src/core/errors/app-error.ts:1-7` | ✅ PASS |
| AC2 `Result<T>` with `ok`/`err` that narrow in TS | discriminated union | `src/core/errors/__tests__/result.test.ts:8` `toEqual({ ok: true, value: 5 })`, `:15` `toEqual({ ok: false, error })`, `:31` `const value: number = success.value` (typecheck-verified narrowing) | ✅ PASS |
| AC3 unknown thrown value maps to `unknown` / "Algo deu errado. Tente novamente." | exact code and message | `src/core/errors/__tests__/app-error.test.ts:21-23` `toBe('Algo deu errado. Tente novamente.')`; `src/core/errors/__tests__/map-error.test.ts:24,28,32,36,41` `toEqual(unknownError)` for Error, string, null, undefined, plain object | ✅ PASS |
| AC4 network failure maps to `network` / "Sem conexão. Verifique sua internet e tente novamente." | exact code and message | `src/core/errors/__tests__/app-error.test.ts:24-26` `toBe('Sem conexão. Verifique sua internet e tente novamente.')`; `map-error.test.ts:8` and `:14` `toEqual(networkError)` for "Network request failed" and "Failed to fetch" | ✅ PASS (the spec does not define what counts as a "network failure"; the design regex is the de facto definition, see gaps) |
| AC5 9-color `palette` exact hex; `lightColors` 8 roles mapped per doc | 9 hex values; 8 role mapping | `src/core/theme/__tests__/colors.test.ts:26` `expect(palette[name]).toBe(hex)` for all 9 (`:16-24`); `:30` `toHaveLength(9)`; `:36` role keys; `:40-49` `lightColors` `toEqual` full mapping (accent `palette.terra`, onAccent `palette.cream`); compared against `docs/DESIGN_SYSTEM.md` hex table by Verifier | ✅ PASS |
| AC6 `darkColors` same 8 roles; typography sizes and spacing tokens | dark mapping; tokens | `colors.test.ts:55` same keys, `:61-70` `darkColors` `toEqual` full mapping; `src/core/theme/__tests__/tokens.test.ts:5` `minTouchTarget` `toBe(44)`, `:12` `expect(value % 4).toBe(0)`, `:18-19` body ≥ 16 and heading > body | ✅ PASS |
| AC7 non-theme `src/` file with hex literal fails lint | rule reports | `tooling/__tests__/lint-rules.test.ts:141` `toHaveLength(1)` for `#F5EEDF`, `#fff`, `#ffff`, `#F5EEDF80`; `:148` `toHaveLength(0)` for `#hashtag`, `#12`; `:153` theme folder `toHaveLength(0)`; `eslint.config.js:57-72` | ✅ PASS (rule matches string Literals only, not template literals; spec does not say) |
| AC8 `useTheme` returns light theme colors | `lightColors` | `src/core/theme/__tests__/use-theme.test.ts:14` `expect(result.current.colors).toEqual(lightColors)`, `:15` `.background` `toBe(palette.cream)` | ✅ PASS |
| AC9 registered dependency returned by provider | same instance | `src/core/di/__tests__/dependency-provider.test.tsx:42` `expect(result.current).toBe(instance)`; `:61-62` two same-name tokens `toBe` each instance | ✅ PASS |
| AC10 unregistered dependency throws error naming it | error contains name | `dependency-provider.test.tsx:73` `.rejects.toThrow('Dependency "Missing" is not registered')`; `:79-81` same outside any provider (`"Orphan"`) | ✅ PASS |

### P1: Shared UI primitives

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 five primitives in `src/shared/ui`, styled only via semantic roles, never palette or hex | 5 exports; no palette/hex in components | `src/shared/ui/index.ts:1-5` exports all five; grep over `src/shared` and `app` (non-test) finds zero `palette` and zero hex literals; hex lint covers `src/**` (`eslint.config.js:57`); no lint rule bans `palette` imports (convention only) | ✅ PASS (palette-name ban is not enforced by tooling, spec does not require a gate for it) |
| AC2 enabled `Button` press calls `onPress` once | 1 call | `src/shared/ui/__tests__/button.test.tsx:14` `expect(onPress).toHaveBeenCalledTimes(1)` | ✅ PASS |
| AC3 `loading` or `disabled` never calls `onPress` | 0 calls | `button.test.tsx:23` `expect(onPress).not.toHaveBeenCalled()` (loading), `:32` (disabled) | ✅ PASS |
| AC4 `Button` and `TextField` min touch height 44 | `minHeight` ≥ 44 | `button.test.tsx:48-49` `toBeGreaterThanOrEqual(44)` and `toBe(minTouchTarget)`; `src/shared/ui/__tests__/text-field.test.tsx:55-56` same on the input style | ✅ PASS |
| AC5 `TextField` `error` string displayed below input and exposed to accessibility | message on screen; below input; accessibility exposure | `text-field.test.tsx:30` `getByText('E-mail inválido')` truthy; `:31-33` `accessibilityHint` `toBe('E-mail inválido')`; `src/shared/ui/text-field.tsx:46-52` renders after `TextInput`; order: `text-field.test.tsx:52-53` `expect(types.indexOf('TextInput')).toBeLessThan(root.children.length - 1)` and `expect(last.children).toEqual(['E-mail inválido'])` | ✅ PASS (order now asserted, mutant 9 killed) |
| AC6 `ErrorBanner` shows `AppError` message | message text | `src/shared/ui/__tests__/error-banner.test.tsx:13` `expect(screen.getByText(error.message)).toBeTruthy()` | ✅ PASS |
| AC7 `onRetry` shows "Tentar novamente" button that calls it | label exact; handler called | `error-banner.test.tsx:34-36` `fireEvent.press(getByText('Tentar novamente'))` then `expect(onRetry).toHaveBeenCalledTimes(1)`; absence `:42-43` `queryByText` `toBeNull()` | ✅ PASS |
| AC8 primary `Button` accent bg + onAccent text; `ErrorBanner` accent bg + onAccent text | `lightColors.accent` / `lightColors.onAccent` | `button.test.tsx:40-41` `toBe(lightColors.accent)` / `toBe(lightColors.onAccent)`; `error-banner.test.tsx:50` `toBe(lightColors.accent)`, `:60` `toBe(lightColors.onAccent)` | ✅ PASS |
| AC9 `Text` defaults `textPrimary`; `secondary` variant `textSecondary` | role colors | `src/shared/ui/__tests__/text.test.tsx:12` `toBe(lightColors.textPrimary)`, `:19` `toBe(lightColors.textSecondary)` | ✅ PASS |

### Edge Cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| `Result` helpers with `undefined` still `ok: true`, `value` undefined | `result.test.ts:21` `expect(result.ok).toBe(true)`, `:22` `expect(result.ok && result.value).toBeUndefined()` | ✅ PASS |
| `ErrorBanner` with no error renders nothing | `error-banner.test.tsx:19` (null) and `:25` (undefined) `expect(screen.toJSON()).toBeNull()` | ✅ PASS |

**Status**: ✅ All 26 ACs covered and matching spec outcomes. Spec-precision gaps flagged below (non-blocking).

**Spec-precision gaps flagged**

1. Story 1 AC1: "without runtime errors" on `expo start` is not testable in Jest; evidence is render test + web export. Manual check pending the user.
2. Story 2 AC4: "network failure" is undefined in the spec; the design regex `/network request failed|failed to fetch|network error/i` on `TypeError` is the real definition. `network error` has no test case.
3. Story 3 AC5: "expose it to accessibility" does not name the mechanism (hint vs label vs live region). The implementation uses `accessibilityHint`.
4. Story 1 AC5: "boundary-violation error" message text is not pinned by the spec or asserted by a test (tests assert rule id and count).
5. Story 3 AC1: "never through raw palette names" has no automated gate; enforcement is by review only.
6. (Resolved in 5c51b6c) the stale spec.md "Coverage" line was refreshed.

---

## Discrimination Sensor

Run in an isolated `git worktree` at HEAD (scratch outside the repo, `node_modules` junction), each mutant reverted with `git checkout -- <file>`, worktree removed with `--force`. Jest scoped to the covering test files.

| # | File:line | Description | Killed? |
| - | --------- | ----------- | ------- |
| 1 | `src/core/errors/map-error.ts:13` | Removed `network request failed` from the network regex | ✅ Killed (`maps TypeError "Network request failed" to network`) |
| 2 | `src/shared/ui/button.tsx:21` | `loading \|\| disabled` to `loading` (disabled no longer guards) | ✅ Killed (`does not call onPress while disabled`) |
| 3 | `src/shared/ui/button.tsx:21` | `loading \|\| disabled` to `disabled` (loading no longer guards) | ✅ Killed (`does not call onPress while loading`) |
| 4 | `src/shared/ui/error-banner.tsx:16` | `ErrorBanner` renders empty `<View />` instead of null | ✅ Killed (`renders nothing for null/undefined`) |
| 5 | `src/core/di/dependency-provider.tsx:44` | Missing-token check replaced by `if (false)` | ✅ Killed (both throw tests) |
| 6 | `eslint.config.js:63` | Hex regex 8-digit alternative made unmatchable | ✅ Killed (`reports #F5EEDF80`) |
| 7 | `eslint.config.js:10` | Boundary rule: `MODULES.filter(other !== name)` to `filter(() => true)` (a module's own alias deep import becomes a violation) | ✅ Killed in iteration 2 (`does not report a module importing its own internals through the alias`); survived in iteration 1 |
| 8 | `src/core/theme/colors.ts:21` | `lightColors.accent` `terra` to `glow` | ✅ Killed (`maps roles to the palette`) |
| 9 | `src/shared/ui/text-field.tsx:46` | Error text rendered above the input instead of below | ✅ Killed in iteration 2 (`renders the error below the input`); survived in iteration 1 |
| 10 | `src/shared/ui/button.tsx:46` | `minHeight: minTouchTarget` to `40` | ✅ Killed (`minimum height of at least 44`) |
| 11 | `eslint.config.js:26` | Removed `'expo-*'` from domain purity group | ✅ Killed (`reports expo-router imported from a domain file`) |
| 12 | `src/shared/ui/text.tsx:12` | Swapped primary/secondary role colors | ✅ Killed (`Text` role tests) |
| 13 | `src/core/theme/use-theme.ts:5` | `useTheme` returns `darkColors` | ✅ Killed (`useTheme` tests) |
| 14 | `eslint.config.js:72` | Removed hex-ban exemption for `src/core/theme/**` | ✅ Killed (`does not report a hex color in the theme folder`) |
| 15 | `src/core/errors/map-error.ts:26` | Removed `AppError` pass-through | ✅ Killed (`passes an existing AppError through unchanged`) |
| 16 | `src/shared/ui/error-banner.tsx:30` | Retry button never rendered | ✅ Killed (`calls onRetry once when pressed`) |

An earlier first-pass attempt of mutant 9 was invalid (CRLF line endings broke the splice) and was redone with a CRLF-aware splice; mutants 4 and 11 were re-run for the same reason. The figures above are from the valid runs.

**Sensor depth**: expanded (16 manual mutations; infrastructure with guard-rail lint rules, so above the lightweight tier)
**Result**: 16/16 killed on HEAD 5c51b6c (iteration 2, fresh scratch worktree, all 16 mutants re-run) - PASS ✅

Iteration 1 survivors (7 and 9) were real test gaps, not equivalent mutants; both are closed by 5c51b6c.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Components are small (20-63 lines); no unrequested features |
| Surgical changes | ✅ Diff touches only feature files plus `spec.md`/`tasks.md` status updates |
| No scope creep | ✅ Five primitives only; no Supabase, fonts, 12-dots, theme toggle. No anti-feature (counters, infinite scroll, followers) present |
| Matches patterns | ✅ Barrel `index.ts` per package, `@/` aliases, Prettier clean |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation (domain 1:1 ACs; routes happy+edge+error) | ✅ Core logic 1:1 with ACs and edge cases; UI covers render, press, loading, disabled, error, retry; lint tests have violation and non-violation for alias and relative forms (own-module alias case added in 5c51b6c); home route has the single render test the matrix allows; `_layout.tsx` is pure wiring covered by the web export |
| Every test maps to a spec requirement - no unclaimed tests | ✅ Extra tests (`passes extra TextInputProps through`, `passes extra TextProps through`, `exposes the button role and the label`, `reflects busy`, `still reports a cross-module deep import from a domain file`) map to Done-when criteria in T16, T18, T19, T7 |
| Documented guidelines followed: `docs/PROJECT_CONTEXT.md` (TDD, test layers, AD-005 anti-features, AD-006 colors), `docs/DESIGN_SYSTEM.md` (tokens verbatim) | ✅ |

**SPEC_DEVIATION review**

1. `tooling/__tests__/lint-rules.test.ts:12-15` (Linter class instead of ESLint class): justified. design.md itself names the Linter fallback; the root cause is ESLint 9.39 flat-config dynamic import under Jest. It still exercises the repo's real flat config array (`eslint.config.js`), so it is not a weaker test. It cannot catch ignore-pattern or file-matching problems that `ESLint.lintFiles` would, but `npm run lint` covers the clean tree.
2. T22 test moved from `app/__tests__/` to `tooling/__tests__/home-route.test.tsx`: justified. Expo Router turns every file under `app/` into a route; the Test Coverage Matrix path `app/__tests__/*.test.tsx` would break the bundle. The test still imports the real `app/index`. The tasks.md matrix row should be updated by the orchestrator to the new location (not edited here).

Minor observations (non-blocking): Button uses literal `opacity: 0.6`, `borderRadius: 8`, `gap: 8` (non-color magic numbers, not forbidden by spec). `ErrorBanner` nests a full-accent `Button` inside an accent banner (cream-on-terra on terra, design choice not covered by spec).

---

## Edge Cases

- [x] `Result` helpers with `undefined` value return `ok: true` (`result.test.ts:21-22`)
- [x] `ErrorBanner` with no error renders nothing (`error-banner.test.tsx:19,25`)

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint`, plus `npx expo export --platform web` (never `expo start`)
- **Result**: `npm test` exit 0 (16 suites, 103 tests passed, 0 failed, 0 skipped); `npm run typecheck` exit 0; `npm run lint` exit 0; `npx expo export --platform web` exit 0 (`dist/` is gitignored)
- **Test count before feature**: 0 (no tests or test config existed at `7bd2f4d`)
- **Test count after feature**: 103 (101 at iteration 1, +2 from the fix commit)
- **Delta**: +103 new tests
- **Skipped tests**: none (grep for skip/xit/xdescribe/todo in `src` and `tooling` finds none)
- **Failures**: none

---

## Interactive UAT

Not performed by the Verifier. Pending user: `npx expo start --web` shows a blank cream screen with no console errors (T22 manual check, FND-01).

---

## Fix Plans

Iteration 1 fixes (applied in 5c51b6c, verified in iteration 2):

- Fix 1 (own-module alias import, mutant 7): new test at `tooling/__tests__/lint-rules.test.ts:65-72`, killed mutant 7.
- Fix 2 (error below input, mutant 9): new test at `src/shared/ui/__tests__/text-field.test.tsx:36-54`, killed mutant 9.
- Non-blocking items also resolved: tasks.md matrix route-test location and stale spec.md Coverage line. Optional remaining: pin the boundary-violation message text in a lint test.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| FND-01 | Done (manual web check pending user) | Verified in code and web export; manual check pending user |
| FND-02 | Done | ✅ Verified |
| FND-03 | Done | ✅ Verified |
| FND-04 | Done | ✅ Verified |
| FND-05 | Done | ✅ Verified |
| FND-06 | Done | ✅ Verified |
| FND-07 | Done | ✅ Verified |
| FND-08 | Done | ✅ Verified |
| FND-09 | Done | ✅ Verified |
| FND-10 | Done | ✅ Verified |

(spec.md not edited by the Verifier.)

---

## Summary

**Overall**: ✅ Ready (pending only the user's manual T22 web check)

**Spec-anchored check**: 26/26 ACs matched the spec outcome, 5 spec-precision gaps flagged (non-blocking)
**Sensor**: 16/16 mutations killed
**Gate**: 103 passed, 0 failed, 0 skipped; typecheck, lint and web export exit 0

**What works**: Strict TS and aliases, Jest with alias parity, ESLint guard-rails (boundary, domain purity, hex ban), error model, theme tokens verbatim from the design system, DI provider, five primitives with role-based colors and 44 touch targets, blank themed home route, 103 tests with discriminating assertions on nearly every branch.

**Issues found**: none blocking.

**Next steps**: The user runs the T22 manual check (`npx expo start --web` shows a blank cream screen, no console errors).
