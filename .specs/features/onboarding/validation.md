# Onboarding Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/onboarding/spec.md`
**Diff range**: `9a8fcda^..HEAD` (HEAD `f7c171b`): feature T1-T10, fixes T11-T15 (`ce5e11f`..`56110df`), fix T16 (`f7c171b`)
**Iteration**: 3 of 3 (final)
**Verifier**: independent sub-agent (author != verifier, fresh context)

## Validation: onboarding - PASS

**Verdict**: PASS

The only gap from iteration 2 is closed. T16 adds a test that walks back from page 3 to page 1 and checks that back is then not handled and that no `BackHandler` listener is left. M32 (cleanup removed) is now killed, and only by that test. The other nine iteration-2 mutants are still killed. The gate is green: 67 suites, 585 tests, typecheck and lint exit 0. All 29 ACs have spec-anchored evidence. Three manual checks are still pending for the user (see below). They do not block the verdict.

---

## Earlier iterations (short)

- **Iteration 1** (`ddb52f6`): FAIL. Blocking gap: the ONB-01 AC1 splash colors were not asserted (M24, M25 survived). Four minor gaps: the exit-order comment was not enforced, the illustration chips were focusable on web, no route test for a failed write, and back behavior was unspecified. T11-T15 fixed all five.
- **Iteration 2** (`9995dee`): FAIL. All iteration-1 gaps were closed. The new ONB-03 AC10 was tested only on a freshly rendered page 1, so M32 (`BackHandler` cleanup removed) survived. T16 (`f7c171b`) adds the missing test. The commit changes no product code.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T10 | Done | verified in iteration 1 |
| T11-T15 | Done | verified in iteration 2 |
| T16 | Done | `f7c171b`; test-only; `tasks.md` marks it done |
| Manual checks on browser / Android | Pending user | see "Manual checks pending"; not counted as a failure |

---

## Spec-Anchored Acceptance Criteria

Paths: `OS` = `src/modules/onboarding/__tests__/onboarding-screen.test.tsx`, `SS` = `src/modules/onboarding/__tests__/splash-screen.test.tsx`, `LN` = `src/modules/onboarding/__tests__/launch-navigator.test.tsx`, `OP` = `src/modules/onboarding/__tests__/onboarding-provider.test.tsx`, `AS` = `src/modules/onboarding/__tests__/async-storage-onboarding-store.test.ts`, `RN` = `tooling/__tests__/root-navigator.test.tsx`, `OR` = `tooling/__tests__/onboarding-route.test.tsx`, `RL` = `tooling/__tests__/root-layout.test.tsx`. Lines are at HEAD `f7c171b`. Only `OS` changed since iteration 2: 11 lines were inserted at line 287, so the `OS` exit tests now start at `OS:300`.

### ONB-03 system back (re-verified in full)

| Criterion | Spec-defined outcome | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---------------------------- | ------ |
| AC9 system back on page 2 or 3 shows the previous page | back is consumed; page 2, then page 1 | `OS:260-275`: `pressSystemBack()` `toBe(true)`, page 2 title and `getByLabelText('Página 2 de 3')`; again `toBe(true)`, page 1 title and `'Página 1 de 3'`. `OS:288-294`: `toBe(true)` twice from page 3 | PASS (M26, M28, M33 killed) |
| AC10 system back on page 1 not handled | not consumed, so the platform default applies; no exit; flag unset | `OS:277-286` (fresh page 1: `toBe(false)`, page 1 title, `onExit` not called, `hasSeen()` `false`); `OS:288-297` (page 1 reached by back: third `pressSystemBack()` `toBe(false)`, `onExit` not called, `expect(listeners).toHaveLength(0)`) | PASS (M27, M32 killed) |

`pressSystemBack` (`OS:247-258`) mirrors the platform: the newest listener runs first, and the first one that returns `true` consumes the press. The spy at `OS:227-239` records listeners and removes them on `remove()`, so `listeners` at `OS:296` is exactly what is still registered. The new test pins the AC10 outcome on page 1 (`false`), and it also catches leaked listeners. With M32 applied, the third press hits a stale listener and returns `true`, so `OS:294` fails.

### Spot-check of the other ACs (verified in full in iteration 2; tests are unchanged except the `OS` shift)

| Requirement | Evidence at HEAD | Result |
| ----------- | ---------------- | ------ |
| ONB-01 AC1-5 splash | `SS:16`, `SS:23`, `SS:29-41` (`inverse` / `onInverse` / `onInverseSecondary` via `toHaveStyle`), `SS:43`, `SS:51`; `LN:92-169`; `RN:70-84`, `RN:167-178` | PASS (M24, M25 killed) |
| ONB-02 AC1-7 routing | `LN:173-295`, `RN:180-216`, `RL:74-104` | PASS |
| ONB-03 AC1-3 page content | `OS:48`, `OS:72`, `OS:86`, `OS:115`, `OS:142` | PASS |
| ONB-03 AC4-7 advance, indicator, labels | `OS:86-121`, `OS:151-178`, `OS:72`, `OS:142` | PASS |
| ONB-03 AC8 illustrations inert | `OS:182`, `OS:197` (no buttons, including hidden elements), the `pointerEvents: 'none'` tests at `OS:208-220` | PASS (M29b, M30 killed) |
| ONB-04 AC1-5 exits and flag | `OS:301`, `OS:311`, `OS:322`, `OS:333`, `OS:344`; `OR:61`, `OR:74`, `OR:88`, `OR:103`, `OR:135`, `OR:153`; `RL:84-90` | PASS |
| ONB-05 AC1-3 persistence | `AS:19-43`; `OP:57-64`, `LN:235-248`; `OP:77-87`, `OR:118-133` | PASS (M31 killed) |

**Status**: 29 of 29 ACs covered with spec-anchored assertions. No spec-precision gaps.

---

## Edge Cases

- [x] Failed read: user is sent to Entrar (`LN:235-248`)
- [x] Failed write: the destination still opens (`OR:118-133`), and the status is seen (`OP:77-87`)
- [x] Splash stays until the minimum time (`LN:129-149`)
- [x] Deep link to `/sign-in`, then sign-in stores the flag (`LN:252-277`)
- [x] System back on page 1 after paging back from page 2: not handled, and no listener left (`OS:288-297`)

---

## Discrimination Sensor

**Isolation**: a temporary git worktree at `f7c171b` (`git worktree add --detach`) under the session scratchpad. `node_modules` was linked as a directory junction. No `git stash` was used. The baseline `git status --porcelain` on the real tree was empty. A Python runner applied each mutant to the worktree copy, normalized for CRLF, and checked that each pattern matched exactly once. It then ran the feature suites (`npx jest src/modules/onboarding tooling/__tests__/root-navigator.test.tsx tooling/__tests__/onboarding-route.test.tsx tooling/__tests__/root-layout.test.tsx tooling/__tests__/onboarding-public-api.test.ts`; 75 tests, green without a mutant, before and after the run) and restored the file bytes. After the run the junction was removed, then `git worktree remove --force` and `git worktree prune`. `git worktree list` shows only the main tree. `git status --porcelain` on the real tree is empty, which matches the baseline.

| # | File:line | Mutation | Killed? | Killing tests |
| - | --------- | -------- | ------- | ------------- |
| M32 | `src/modules/onboarding/presentation/onboarding-screen.tsx:69` | effect cleanup removed (`subscription.remove()` never called) | Killed | `OS:288` |
| M24 | `src/modules/onboarding/presentation/splash-screen.tsx:25` | background `inverse` -> `background` | Killed | `SS:29` |
| M25 | `src/modules/onboarding/presentation/splash-screen.tsx:33` | wordmark `onInverse` -> `textPrimary` | Killed | `SS:29` |
| M26 | `src/modules/onboarding/presentation/onboarding-screen.tsx:61` | back handler never registered | Killed | `OS:260`, `OS:288` |
| M27 | `src/modules/onboarding/presentation/onboarding-screen.tsx:61-66` | handler on page 1 too, calling `onExit('register')` | Killed | `OS:277`, `OS:288` |
| M28 | `src/modules/onboarding/presentation/onboarding-screen.tsx:65` | back goes forward (`index + 1`, clamped) | Killed | `OS:260`, `OS:288` |
| M29b | `src/modules/onboarding/presentation/onboarding-screen.tsx:282` | `SampleChip` root becomes a `Pressable` with `accessibilityRole="button"` | Killed | `OS:197` |
| M30 | `src/modules/onboarding/presentation/onboarding-screen.tsx:312` | `pointerEvents: 'none'` removed | Killed | 3 `pointerEvents` tests, pages 1-3 |
| M31 | `src/modules/onboarding/presentation/onboarding-provider.tsx:44-48` + `src/modules/onboarding/presentation/onboarding-screen.tsx:76-79` | write failure propagates; navigation waits for a successful write | Killed | `OP:77`, `OR:118` |
| M33 | `src/modules/onboarding/presentation/onboarding-screen.tsx:66` | back handler returns `false` | Killed | `OS:260`, `OS:288` |

**Sensor depth**: lightweight+ (10 targeted mutants on the fix diff; iteration-1 mutants M1-M23 cover code that has not changed since)
**Result**: 10/10 killed - PASS

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | PASS - T16 is one 11-line test |
| Surgical changes | PASS - T16 changes only the test file and `tasks.md` |
| No scope creep | PASS |
| Matches patterns | PASS - reuses `renderOnboarding`, `goToPage`, `pressSystemBack` |
| Spec-anchored outcome check | PASS |
| Per-layer coverage | PASS |
| Every test maps to a requirement | PASS - the new test maps to ONB-03 AC9-10 |
| Documented guidelines followed | `CLAUDE.md` (no hex, PT-BR text, English code) - PASS |

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint`
- **Result**: 585 passed, 0 failed, 0 skipped (67 suites); typecheck exit 0; lint exit 0
- **Test count at iteration 2**: 584 (67 suites)
- **Test count now**: 585 (67 suites)
- **Delta**: +1 (T16). No test was removed or weakened.
- **Failures**: none

---

## Remaining non-blocking gaps

1. Unmount on page 2 or 3 (an exit from page 2 via "Pular") does not check the listener list directly. The same cleanup runs on unmount and on a page change, and M32 is killed, so the risk is low.
2. The test at `OS:288` does not re-assert the page 1 title after the third press. `OS:270-274` and `OS:280-283` already cover it.
3. The `BackHandler` interplay with React Navigation's own listener on a real device is reasoned from library behavior (iteration 2 review), not observed.

## Manual checks pending (user)

1. On a fresh browser profile (no stored flag): the splash appears, then onboarding page 1.
2. Android: system back on pages 2 and 3 goes to the previous page; on page 1 it leaves the app.
3. Browser: Tab on page 3 reaches "Começar" and "Já tenho conta" and nothing in the illustration.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ONB-01 | Verified | Verified |
| ONB-02 | Verified | Verified |
| ONB-03 | Needs Fix (AC10 cleanup untested) | Verified |
| ONB-04 | Verified | Verified |
| ONB-05 | Verified | Verified |

---

## Lessons

No new lesson. This iteration found no new failure. The M32 lesson from iteration 2 already exists as L-016 (scope `ui`: a global listener registered per state must be tested after moving through states and back).

---

## Summary

**Overall**: Ready (pending the user's manual checks).

**Spec-anchored check**: 29/29 ACs matched the spec outcome; 0 spec-precision gaps
**Sensor**: 10/10 mutants killed
**Gate**: 585 passed; typecheck and lint clean

**Next steps**: the user runs the three manual checks above. Then the orchestrator updates the Handoff in `.specs/STATE.md`.
