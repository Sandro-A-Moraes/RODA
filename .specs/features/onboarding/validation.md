# Onboarding Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/onboarding/spec.md`
**Diff range**: fixes `ce5e11f^..56110df` (T11-T15) on top of the feature `9a8fcda^..7b9b5eb` (T1-T10)
**Iteration**: 2 of 3
**Verifier**: independent sub-agent (author != verifier, fresh context)

## Validation: onboarding - FAIL

**Verdict**: FAIL

All five gaps from iteration 1 are closed. The splash colors are now asserted and M24 and M25 are killed. The new system-back ACs (ONB-03 AC9, AC10) have tests, and the implementation is correct: the effect cleanup removes the listener on every page change and on unmount. The gate is green (67 suites, 584 tests; typecheck and lint exit 0). The sensor killed 10 of 11 mutants. One survived: M32 removes the `BackHandler` cleanup, and no test catches it. With M32 applied, a user who goes 1 -> 2 -> 3 -> back -> back is on page 1 with three stale listeners still registered. The next system back is consumed, which breaks AC10 ("on page 1 the system SHALL NOT handle it"), and the listeners outlive the screen, so system back keeps being swallowed after an exit to Entrar or Criar conta. The AC10 test only presses back on a freshly rendered page 1, where no listener ever existed. Fix 1 is one test-only task. A probe of that test in the scratch passed against the real code and killed M32.

---

## Iteration 1 (short)

Iteration 1 (`ddb52f6`) returned FAIL with one blocking gap: ONB-01 AC1 splash colors were not asserted (M24, M25 survived). It also listed four minor gaps: 2, the exit-order comment was not enforced; 3, illustration chips were focusable on web; 4, no route test for a failed write; 5, back behavior was unspecified. T11-T15 address all five (table below).

| Iter-1 gap | Fix | Evidence | Status |
| ---------- | --- | -------- | ------ |
| 1 splash colors | T11 `ce5e11f` | `SS:29-41`; M24, M25 killed | Resolved |
| 2 exit-order comment | T12 `fb7422b`: the comment now says the order is not observable under batching (`onboarding-screen.tsx:72-75`) | equivalent mutant M15 documented, no false claim left | Resolved (documented) |
| 3 chips focusable on web | T13 `c15d904`: `SampleChip` is a plain `View` (`onboarding-screen.tsx:271-303`), illustration style `pointerEvents: 'none'` (`:309-314`) | `OS:197-206`, `OS:208-220`; M29, M29b, M30 killed | Resolved |
| 4 failed write + routing | T14 `3ea3a20` | `OR:118-133`; M31 killed | Resolved |
| 5 back unspecified | T15 `56110df`: spec assumption row and ONB-03 AC9-10 added; `BackHandler` effect (`onboarding-screen.tsx:60-70`) | `OS:260-286`; M26, M27, M28, M33 killed; M32 survived | Resolved in spec; test gap (Fix 1) |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T10 | Done | verified in iteration 1 |
| T11-T15 | Done | `ce5e11f`, `fb7422b`, `c15d904`, `3ea3a20`, `56110df`; `tasks.md` Phase 5 |
| Manual check in the browser / Android | Pending user | Handoff lists it; not counted as a failure |

---

## Spec-Anchored Acceptance Criteria

Paths: `LN` = `src/modules/onboarding/__tests__/launch-navigator.test.tsx`, `OS` = `src/modules/onboarding/__tests__/onboarding-screen.test.tsx`, `OP` = `src/modules/onboarding/__tests__/onboarding-provider.test.tsx`, `SS` = `src/modules/onboarding/__tests__/splash-screen.test.tsx`, `AS` = `src/modules/onboarding/__tests__/async-storage-onboarding-store.test.ts`, `RN` = `tooling/__tests__/root-navigator.test.tsx`, `OR` = `tooling/__tests__/onboarding-route.test.tsx`, `RL` = `tooling/__tests__/root-layout.test.tsx`. Lines are at HEAD `56110df`. `LN`, `OP`, `AS`, `RN` and `RL` did not change since iteration 1. `OS` moved by +7 lines and `OR` by +17 after line 117.

### P1: Splash on every launch (ONB-01)

| Criterion | Spec-defined outcome | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---------------------------- | ------ |
| AC1 restoring: splash with ring, "Roda", tagline on forest, no route | `inverse` background, `onInverse` wordmark, `onInverseSecondary` tagline; no route | `SS:29-41` (`getByLabelText('Roda. Carregando')` `toHaveStyle({backgroundColor: lightColors.inverse})`, "Roda" `color: lightColors.onInverse`, tagline `color: lightColors.onInverseSecondary`); `SS:16-21`; `SS:43-49` (12 dots); `LN:92-109`; `RN:70-84` | PASS (M24, M25 killed) |
| AC2 flag being read: splash, no route | splash, no route | `LN:111-127`; `RN:167-178` | PASS |
| AC3 minimum 1200 ms | splash at 1199 ms, route at 1200 ms | `LN:129-149`; `LN:151-169` | PASS |
| AC4 label "Roda. Carregando" | exact label | `SS:23-27`; `LN:105` | PASS |
| AC5 status bar hidden | `hidden: true` | `SS:51-57` | PASS |

### P1: Launch routing (ONB-02)

No code or tests changed. Iteration-1 evidence holds: AC1 `LN:173-183`; AC2 `LN:185-195`, `RN:180-192`, `RL:74-82`; AC3 `LN:197-207`, `RL:93-104`; AC4 `LN:222-233`, `RN:206-216`; AC5 `LN:209-220`, `RN:194-204`; AC6 `LN:252-277`; AC7 `LN:279-295`. All PASS (gate green).

### P1: Onboarding pages (ONB-03)

| Criterion | Spec-defined outcome | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---------------------------- | ------ |
| AC1 page 1 texts, ring, "Pular" + "Continuar" | exact strings, 12 dots, buttons exactly `['Pular','Continuar']` | `OS:48-70`; `OS:72-76` | PASS |
| AC2 page 2 texts | exact strings | `OS:86-111` | PASS |
| AC3 page 3 texts, "Começar" + "Já tenho conta", no "Pular" | exact strings and buttons | `OS:115-140`; `OS:142-148` | PASS |
| AC4 / AC5 "Continuar" advances | next page title, previous gone | `OS:86-108`; `OS:115-121` | PASS |
| AC6 indicator pill and "Página N de 3" | `28x8 accent` current, `8x8` others | `OS:152-178` | PASS |
| AC7 button label = visible text | `accessibilityLabel` equals text | `OS:72-76`, `OS:142-148`, `getByRole('button', {name})` throughout | PASS |
| AC8 illustrations hidden, no interaction | hidden from default queries; no button inside, even counting hidden elements; `pointerEvents: 'none'` on every page | `OS:182-195`; `OS:197-206` (`allButtonLabels()` with `includeHiddenElements` `toEqual(['Pular','Continuar'])` on pages 1-2 and `['Começar','Já tenho conta']` on page 3); `OS:208-220` (`toHaveStyle({pointerEvents:'none'})` per page) | PASS (M29, M29b, M30 killed) |
| AC9 system back on page 2 or 3 shows the previous page | back consumed; page 2 then page 1 title and "Página N de 3" | `OS:260-275` (`pressSystemBack()` `toBe(true)` twice, page 2 then page 1 title and indicator label) | PASS (M26, M28, M33 killed) |
| AC10 system back on page 1 not handled | back not consumed; page 1 stays; no exit, flag unset | `OS:277-286` (`toBe(false)`, `onExit` not called, `hasSeen()` `false`) | PARTIAL: only a freshly rendered page 1 is covered. Page 1 reached by back from page 2 is not covered, and M32 (cleanup removed) survived -> Fix 1 |

`pressSystemBack` (`OS:247-258`) copies the platform contract: newest listener first, the first `true` consumes the press. That matches React Native's `BackHandler`, which calls subscriptions in reverse registration order.

### P1: Exits and the seen flag (ONB-04)

No code change in the exit paths. AC1 `OS:290-309`, `OR:61-86`, `RL:84-90`; AC2 `OS:311-320`, `OR:88-101`; AC3 `OS:322-331`, `OR:103-116`; AC4 `OS:333-339`, `OR:153-167`; AC5 `OR:135-151`. All PASS.

### P1: Flag persistence (ONB-05)

| Criterion | Spec-defined outcome | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---------------------------- | ------ |
| AC1 key `roda.onboarding.seen` = `"true"` | exact key/value | `AS:19-43`; `RL:82,90` | PASS |
| AC2 failed read: seen | `/sign-in` | `OP:57-64`; `LN:235-248` | PASS |
| AC3 failed write: ignored, destination opened | `/register`, onboarding gone | `OP:77-87`; `OR:118-133` (`markSeen` rejects; `findByText('register content')`, `getPathname()` `'/register'`, first title `toBeNull`) | PASS (M31 killed by `OR:118`) |

**Status**: 28 of 29 ACs fully covered. AC10 is partial (M32). No spec-precision gaps.

---

## Edge Cases

- [x] Failed read: Entrar (`LN:235-248`)
- [x] Failed write: destination still opened (`OR:118-133`), status seen (`OP:77-87`)
- [x] Splash kept until the minimum (`LN:129-149`)
- [x] Deep link to `/sign-in`, then sign-in stores the flag (`LN:252-277`)
- [ ] System back on page 1 after paging back from page 2: correct in code (cleanup `onboarding-screen.tsx:69`), not tested (Fix 1)

---

## Discrimination Sensor

The sensor ran in a temporary git worktree at `56110df` under the session scratchpad, with `node_modules` linked as a directory junction. The checkout uses CRLF, so the patterns were normalized. Each mutant was applied, the feature suites ran (`npx jest src/modules/onboarding tooling/__tests__/root-navigator.test.tsx tooling/__tests__/onboarding-route.test.tsx tooling/__tests__/root-layout.test.tsx tooling/__tests__/onboarding-public-api.test.ts`; 74 tests, all green without mutation), and the files were restored. Afterwards the junction was unlinked and the worktree removed and pruned. `git worktree list` shows only the main tree, and `git status --porcelain` on the real tree is empty, matching the baseline.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M24 | `splash-screen.tsx:25` | background `inverse` -> `background` | Killed (`SS:29`) |
| M25 | `splash-screen.tsx:33` | wordmark `onInverse` -> `textPrimary` | Killed (`SS:29`) |
| M26 | `onboarding-screen.tsx:61` | back handler never registered | Killed (`OS:260`) |
| M27 | `onboarding-screen.tsx:61-65` | back handled on page 1 and calls `onExit('register')` | Killed (`OS:277`) |
| M28 | `onboarding-screen.tsx:65` | back goes forward (`index + 1`, clamped) | Killed (`OS:260`) |
| M29 | `onboarding-screen.tsx:260-261` | sample chips rendered with the pressable shared `Chip` | Killed (`OS:197`) |
| M29b | `onboarding-screen.tsx:281` | `SampleChip` root becomes a `Pressable` with `accessibilityRole="button"` | Killed (`OS:197`) |
| M30 | `onboarding-screen.tsx:313` | `pointerEvents: 'none'` removed | Killed (`OS:208`, 3 tests) |
| M31 | `onboarding-provider.tsx:44-48` + `onboarding-screen.tsx:77-78` | write failure propagates and navigation waits for a successful write | Killed (`OR:118`, `OP:77`) |
| M32 | `onboarding-screen.tsx:69` | effect cleanup removed (listener leak across page changes and unmount) | **Survived** -> Fix 1 |
| M33 | `onboarding-screen.tsx:66` | back handler returns `false` (press not consumed) | Killed (`OS:260`) |

Probe for Fix 1, run in the scratch only and discarded: a test that pages 1 -> 3, presses back twice (both `true`), then back again expecting `false`, and checks that the listener list is empty. It passed on the real code (22/22 in the file) and killed M32. It also failed under M26 and M28.

**Sensor depth**: lightweight+ (11 behavior-level mutants on the fix diff; iteration-1 mutants M1-M23 cover unchanged code)
**Result**: 10/11 killed; M32 survived - FAIL

---

## Review (defects tests may miss)

- **BackHandler listener leak**: none in the code. The effect depends on `[index]`. Each page change runs the cleanup (`subscription.remove()`, `onboarding-screen.tsx:69`) before it registers the next listener, so at most one listener is live, and none on page 1 or after unmount. The handler closes over the current `index`, so there is no stale closure. Not guarded by a test (M32).
- **Interplay with Expo Router**: React Navigation's container registers its own `hardwareBackPress` listener when it mounts, before the onboarding screen. `BackHandler` calls the newest listener first, so the page listener wins on pages 2-3 and returns `true`. On page 1 no listener is registered, so React Navigation's handler runs. `/onboarding` is the initial route with nothing below it in the stack, so the press falls through to the OS and the app is left, as AC10 says. On web, `BackHandler` is a no-op in react-native-web, and the browser back leaves the route (spec assumption row). This is reasoned from library behavior, not observed on a device. The Handoff already asks the user to try Android back on pages 2-3.
- **SampleChip accessibility**: a plain `View` with no role, label or press handler, inside an `accessibilityElementsHidden` / `no-hide-descendants` subtree with `pointerEvents: 'none'`. Nothing in the illustration can take focus or be pressed. The visuals mirror `src/shared/ui/chip.tsx` (height 40, `radius.full`, `brand`/`onBrand` when selected, `border` outline otherwise), without the press opacity. The duplication is small and the comment justifies it (`onboarding-screen.tsx:271-272`). The shared `Chip` is unchanged.
- **`pointerEvents` as a style**: React Native 0.86 and react-native-web 0.21 both support `pointerEvents` in style; react-native-web deprecates it as a prop. Correct choice.
- **Hex colors**: none in the diff; the only literal is `'transparent'`, which the shared `Chip` uses too. Colors come from `useTheme()` roles.
- **Boundaries and lint**: the screen now imports `Icon` instead of `Chip` from `@/shared/ui` (public index). There are no new cross-module imports. `npm run lint` exits 0.
- **Tests**: `jest.restoreAllMocks()` in `afterEach` (`OS:241-243`) restores the `BackHandler` spy, so it does not leak to other describes. The new tests all map to ONB-01 AC1, ONB-03 AC8-10 or ONB-05 AC3.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | PASS - one effect, one small static chip |
| Surgical changes | PASS - only `onboarding-screen.tsx` in product code; shared `Chip` untouched |
| No scope creep | PASS |
| Matches patterns | PASS |
| Spec-anchored outcome check | PARTIAL - AC10 only on a fresh page 1 |
| Per-layer coverage | PASS except M32 |
| Every test maps to a requirement | PASS |
| Documented guidelines followed | `CLAUDE.md` (no hex, PT-BR text, English code) - PASS |

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint`
- **Result**: 584 passed, 0 failed, 0 skipped (67 suites); typecheck exit 0; lint exit 0
- **Test count at iteration 1**: 576 (67 suites)
- **Test count now**: 584 (67 suites)
- **Delta**: +8 tests (1 splash colors, 1 + 3 illustrations, 2 system back, 1 route failed write); no test removed or weakened
- **Skipped tests**: none
- **Failures**: none

---

## Ranked Gaps

| # | Severity | Where | Gap | Suggested fix |
| - | -------- | ----- | --- | ------------- |
| 1 | Major (blocks PASS; M32 survived) | `src/modules/onboarding/__tests__/onboarding-screen.test.tsx:277-286`; impl `onboarding-screen.tsx:69` | ONB-03 AC10 is tested only on a freshly rendered page 1. No test catches a back listener left registered after paging back or after unmount, and such a leak would swallow system back on page 1 and across the app | Test-only: in `describe('system back')`, add "on page 1 reached by back is not handled and leaves no listener": `goToPage(3)`, `pressSystemBack()` `toBe(true)` twice, then `toBe(false)`, then `expect(listeners).toHaveLength(0)`. Optionally also unmount on page 2 and check `listeners` is empty |

No other gaps. Iteration-1 gaps 1-5 are resolved.

---

## Fix Plans

### Fix 1: Guard the back listener cleanup (ONB-03 AC10)

- **Root cause**: the AC10 test starts on page 1, where no listener was ever registered, so it cannot tell a correct cleanup from a missing one.
- **Fix task**: add the test from gap 1 to `OS` `describe('system back')`. No product change: the probe passed against `56110df`.
- **Verify**: re-run M32 (replace `return () => subscription.remove();` with no cleanup); it must be killed. M26 and M28 should also fail this test.
- **Priority**: Major (only blocker)

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ONB-01 | Needs Fix | Verified |
| ONB-02 | Verified | Verified |
| ONB-03 | Verified (AC1-8) | Needs Fix (AC10 cleanup untested) |
| ONB-04 | Verified | Verified |
| ONB-05 | Verified | Verified |

---

## Summary

**Overall**: Not ready. One test-only fix is needed, then iteration 3 of 3.

**Spec-anchored check**: 28/29 ACs fully covered; AC10 partial; 0 spec-precision gaps
**Sensor**: 10/11 killed; M32 survived
**Gate**: 584 passed; typecheck and lint clean

**What works**: the splash colors are asserted; the illustrations are inert on every page; a failed write still routes to the destination; system back moves back a page on pages 2-3 and is left to the platform on page 1; the code has no listener leak. Iteration-1 gaps 1-5 are closed.

**Next steps**: Fix 1, then re-run M32 (iteration 3). Then do the manual check from the Handoff (Android back on pages 2-3, Tab on page 3 in the browser).
