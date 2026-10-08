# Onboarding Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/onboarding/spec.md`
**Diff range**: `9a8fcda^..7b9b5eb` (HEAD = `7b9b5eb`, commits `9a8fcda`..`7b9b5eb`) for `src/modules/onboarding/`, `src/modules/auth/presentation/root-navigator.tsx`, `app/_layout.tsx`, `app/(auth)/onboarding.tsx`, `src/core/theme/tokens.ts`, `tooling/modules.js`, `tooling/__tests__/` (root-navigator, onboarding-route, root-layout, onboarding-public-api), AD-008 in `.specs/STATE.md`
**Iteration**: 1 of 3
**Verifier**: independent sub-agent (author != verifier, fresh context)

## Validation: onboarding - FAIL

**Verdict**: FAIL

The behavior is right. Every routing, exit, flag and text AC is anchored to a test that asserts the spec-defined outcome. Gate is green (67 suites, 576 tests; typecheck and lint exit 0). All Portuguese texts match Figma frames 21-24 exactly. The sensor killed 21 of 25 behavior-level mutants. Two of the four survivors are equivalent or test behavior the spec does not define (M15, M20). The other two (M24, M25) show that ONB-01 AC1's spec-defined visual outcome, the forest (`inverse`) background with `onInverse` text, has no assertion: the splash can be repainted on the cream background and every test still passes. Fix 1 below is one small test-only task. After it, the feature should pass. The review found no defect reachable through the app. It did find three minor items: illustration chips are keyboard-focusable on web, the edge case "failed write still navigates" has no end-to-end test, and the back-stack behavior is not specified.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T10 | Done | Commits `e52cf3b`, `e24879c`, `5168509`, `0fe8c5f`, `f51ea38`, `4b80df3`, `b17299b`, `76a1713`, `198f4d7`, `7b9b5eb` (spec `9a8fcda`) |
| Manual check in the browser | Pending user | Handoff lists it; not counted as a failure |

`validate_tasks.py onboarding`: 0 errors, 2 warnings (`Tests: none` on T1 and T10, matching the Coverage Matrix).

---

## Spec-Anchored Acceptance Criteria

Paths: `LN` = `src/modules/onboarding/__tests__/launch-navigator.test.tsx`, `OS` = `src/modules/onboarding/__tests__/onboarding-screen.test.tsx`, `OP` = `src/modules/onboarding/__tests__/onboarding-provider.test.tsx`, `SS` = `src/modules/onboarding/__tests__/splash-screen.test.tsx`, `AS` = `src/modules/onboarding/__tests__/async-storage-onboarding-store.test.ts`, `RN` = `tooling/__tests__/root-navigator.test.tsx`, `OR` = `tooling/__tests__/onboarding-route.test.tsx`, `RL` = `tooling/__tests__/root-layout.test.tsx`.

### P1: Splash on every launch (ONB-01)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 restoring session: splash with 12-dot ring, "Roda", "Menos tela. Mais roda." on forest (`inverse`), no route content | splash shown, no route rendered, background `inverse` | `src/modules/auth/presentation/root-navigator.tsx:25`; `src/modules/onboarding/presentation/splash-screen.tsx:20-46` | `LN:92-109` (`getByLabelText('Roda. Carregando')`, `getByText(TAGLINE)`, four route texts `toBeNull`, `main` not called); `RN:70-84`; `SS:14-19` ("Roda", tagline), `SS:27-33` (12 `splash-ring-dot`) | GAP: no test asserts the `inverse` background or `onInverse`/`onInverseSecondary` text colors (M24, M25 survived) |
| AC2 flag being read: splash, no route content | splash shown, no route rendered | `src/modules/onboarding/presentation/launch-navigator.tsx:38` | `LN:111-127` (`hasSeen` never resolves: tagline shown, `expectNoRouteContent`, `signIn` not called); `RN:167-178` (`holdSplash`) | PASS |
| AC3 minimum 1200 ms even when everything is known | splash at 1199 ms, route at 1200 ms; prop overrides | `launch-navigator.tsx:8,22-28,38` | `LN:129-149` (fake timers: 1199 tagline shown and no route, +1 `sign-in content`, tagline `toBeNull`); `LN:151-169` (300 ms prop) | PASS |
| AC4 accessible label "Roda. Carregando" | exact label | `splash-screen.tsx:21-22` | `SS:21-25`; `LN:105` | PASS |
| AC5 status bar hidden | `StatusBar hidden` | `splash-screen.tsx:28` | `SS:35-41` (`toHaveBeenCalledWith(objectContaining({hidden:true}))`) | PASS |

### P1: Launch routing (ONB-02)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 signed in: main area, never onboarding | pathname `/`, onboarding never rendered | `root-navigator.tsx:29-34` | `LN:173-183` (`protected content`, `getPathname()` `'/'`, `onboarding` not called) | PASS |
| AC2 signed out + unset: onboarding page 1 | `/onboarding` | `root-navigator.tsx:32-34`; `launch-navigator.tsx:39` | `LN:185-195` (`'/onboarding'`, `signIn` not called); `RN:180-192`; `RL:74-82` (real layout, first title, `'/onboarding'`) | PASS |
| AC3 signed out + set: Entrar | `/sign-in` | `root-navigator.tsx:35-38` | `LN:197-207`; `RL:93-104` (real layout, "Entrar" button, `'/sign-in'`) | PASS |
| AC4 signed in opens /onboarding: main area | redirect to `/` | `root-navigator.tsx:32` (guard `status === 'signedOut' && showOnboarding`) | `LN:222-233`; `RN:206-216` (even with `showOnboarding`) | PASS |
| AC5 signed out + set opens /onboarding: Entrar | redirect to `/sign-in` | `launch-navigator.tsx:39` | `LN:209-220`; `RN:194-204` | PASS |
| AC6 session becomes signed in while unset: flag stored | `hasSeen()` true | `launch-navigator.tsx:31-33` | `LN:252-277` (sign in from `/sign-in`: `await store.hasSeen()` `toBe(true)`) | PASS |
| AC7 sign-out after flag set: Entrar, no onboarding | `/sign-in`, onboarding never rendered | `root-navigator.tsx:32-38` | `LN:279-295`; `LN:271-276` (flag stored by sign-in, then sign-out) | PASS |

### P1: Onboarding pages (ONB-03)

Texts compared with Figma `get_design_context` on `29:765`, `29:807`, `29:840` (file `x3ZwVucRW34c4LfJ5rQLff`): every title, body, illustration text, button label, the empty skip slot on frame 24 and the active pill position (1st, 2nd, 3rd dot) match.

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 page 1 texts, ring "12"/"pessoas, no máximo", "Pular" + "Continuar" | exact strings; 12 dots; buttons exactly `['Pular','Continuar']` | `src/modules/onboarding/presentation/onboarding-screen.tsx:26-30,139-160` | `OS:41-63` (`getByText` exact title/body, "12", "pessoas, no máximo", 12 `onboarding-ring-dot`); `OS:65-69` (`toEqual(['Pular','Continuar'])`) | PASS |
| AC2 page 2 texts, "5 de 7", "fizeram o check-in hoje", "Pular" + "Continuar" | exact strings | `onboarding-screen.tsx:31-35,162-216` | `OS:79-104` | PASS |
| AC3 page 3 texts, sample story, "você chegou ao fim", "Começar" + "Já tenho conta", no "Pular" | exact strings; buttons exactly `['Começar','Já tenho conta']`; "Pular" absent | `onboarding-screen.tsx:36-40,68-82,97-105,218-245` | `OS:108-133`; `OS:135-141` (`toEqual([...])`, `queryByText('Pular')` `toBeNull`) | PASS |
| AC4 "Continuar" on 1 shows 2 | page 2 title, page 1 title gone | `onboarding-screen.tsx:107` | `OS:79-101` (`queryByText(page 1 title)` `toBeNull`) | PASS |
| AC5 "Continuar" on 2 shows 3 | page 3 title | `onboarding-screen.tsx:107` | `OS:108-114` | PASS |
| AC6 three dots, only current is the accent pill; label "Página N de 3" | current `width 28, height 8, accent`; others `8x8 decorative`; label per page | `onboarding-screen.tsx:115-137` | `OS:145-171` (`it.each([1,2,3])`, `toHaveStyle` per dot); `OS:71-75`, `OS:103`, `OS:132` | PASS |
| AC7 accessible button label equal to visible text | `accessibilityLabel` equals text | `onboarding-screen.tsx:70-80,99-107` | `OS:33-37,65-69,102,135-141` (labels read from `props.accessibilityLabel`, `getByRole('button', {name})` on every press) | PASS |
| AC8 illustrations hidden from screen readers, no interaction | hidden texts not found by default queries; chips not reachable as buttons | `onboarding-screen.tsx:83-89` (`accessibilityElementsHidden`, `no-hide-descendants`) | `OS:175-189` (`queryByText('12')`, `'5 de 7'`, `'Beto Lima'` `toBeNull`; chip buttons `toBeNull`) | PASS (see gap 3: web keyboard focus) |

### P1: Exits and the seen flag (ONB-04)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 "Pular" on 1 or 2: Criar conta + flag | `/register`; `hasSeen()` true | `onboarding-screen.tsx:53-56,73`; `app/(auth)/onboarding.tsx:9-11` | `OS:192-211` (`onExit` `toHaveBeenCalledWith('register')`, `hasSeen` true); `OR:61-86` (`'/register'`, `register content`, flag true); `RL:84-90` (real routes, "Criar conta" button, AsyncStorage `'true'`) | PASS |
| AC2 "Começar": Criar conta + flag | `/register`; flag true | `onboarding-screen.tsx:99` | `OS:213-222`; `OR:88-101` | PASS |
| AC3 "Já tenho conta": Entrar + flag | `/sign-in`; flag true | `onboarding-screen.tsx:100-104` | `OS:224-233` (`'sign-in'`); `OR:103-116` (`'/sign-in'`) | PASS |
| AC4 closed without an exit: flag unset, next launch onboarding 1 | `hasSeen()` false; relaunch `/onboarding` page 1 | no write outside `exit` | `OS:235-241` (`false`); `OR:136-150` (unmount after "Continuar", relaunch shows page 1 title and `'/onboarding'`) | PASS |
| AC5 flag stored: next signed-out launch Entrar | relaunch `/sign-in` | `launch-navigator.tsx:39` | `OR:118-134` (`'/sign-in'`, first title `toBeNull`) | PASS |

### P1: Flag persistence (ONB-05)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 AsyncStorage key `roda.onboarding.seen` = `"true"`, absent = unseen | exact key and value | `src/modules/onboarding/data/async-storage-onboarding-store.ts:3,16-22`; `app/_layout.tsx:35` | `AS:19-43` (`toBe('roda.onboarding.seen')`, `items.get(...)` `toBe('true')`, absent `false`); `RL:82,90` (real AsyncStorage mock: `null` then `'true'`) | PASS |
| AC2 failed read: seen | status `seen`; signed-out lands on `/sign-in` | `src/modules/onboarding/presentation/onboarding-provider.tsx:31-38` | `OP:57-64` (`findByText('seen')`); `LN:235-248` (`'/sign-in'`) | PASS |
| AC3 failed write: ignored, navigation completes, seen for the session | status `seen`; destination opened | `onboarding-provider.tsx:44-48`; `onboarding-screen.tsx:53-56` (navigate first) | `OP:77-87` (`markSeen` rejects: status `toBe('seen')`) | PASS for status; navigation-with-failed-write has no end-to-end test (gap 4) |

**Status**: one AC gap (ONB-01 AC1 background and text colors). No spec-precision gaps: the spec defines every outcome tested here.

---

## Edge Cases

- [x] Failed read: Entrar for a signed-out user (`LN:235-248`)
- [x] Failed write: status stays seen (`OP:77-87`); the chosen destination is opened by `onExit` before `markSeen` (`onboarding-screen.tsx:53-56`), but no test combines a rejected write with route navigation (gap 4)
- [x] Session and flag resolve before the minimum: splash kept (`LN:129-149`)
- [x] Deep link to `/sign-in` on a fresh device, then sign-in: flag stored (`LN:252-277`)

---

## Discrimination Sensor

Run in a temporary git worktree at HEAD under the scratchpad (with `node_modules` linked as a directory junction). Each mutant was applied, the feature suites were run (`npx jest src/modules/onboarding tooling/__tests__/root-navigator.test.tsx tooling/__tests__/onboarding-route.test.tsx tooling/__tests__/root-layout.test.tsx tooling/__tests__/onboarding-public-api.test.ts`, 66 tests, all green unmutated), and then the file was restored. Afterwards the junction was unlinked, the worktree removed and pruned, and the real tree's `git status --porcelain` matched the empty baseline.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M1 | `onboarding-screen.tsx:73` | "Pular" calls `onExit` only (flag not stored) | Killed (6 tests) |
| M2 | `onboarding-screen.tsx:49` | `markSeen()` on mount (stored on first page view) | Killed (8) |
| M3 | `onboarding-provider.tsx:36` | failed read sets `unseen` | Killed (2) |
| M4 | `root-navigator.tsx:32` | onboarding guard `showOnboarding` only (signed-in can open it) | Killed (2) |
| M5 | `onboarding-screen.tsx:73` | "Pular" goes to `sign-in` | Killed (6) |
| M6 | `onboarding-screen.tsx:103` | "Já tenho conta" goes to `register` | Killed (2) |
| M7 | `launch-navigator.tsx:38` | minimum removed from `holdSplash` | Killed (2) |
| M8 | `launch-navigator.tsx:8` | default minimum 1200 -> 1000 | Killed (2) |
| M9 | `async-storage-onboarding-store.ts:3` | key `roda.onboarding.done` | Killed (5) |
| M10 | `launch-navigator.tsx:39` | `showOnboarding` inverted | Killed (16) |
| M11 | `onboarding-screen.tsx:128` | pill always on dot 1 | Killed (2) |
| M12 | `onboarding-screen.tsx:48` | pages 1 and 2 swapped | Killed (9) |
| M13 | `launch-navigator.tsx:32` | sign-in does not store the flag | Killed (1) |
| M14 | `onboarding-provider.tsx:44-47` | status `seen` only after a successful write | Killed (1) |
| M15 | `onboarding-screen.tsx:54-55` | `markSeen()` before `onExit()` | Survived - equivalent: both run in one press handler and React batches the status update, so the guard change and the `replace` land in the same commit; no spec outcome differs |
| M16 | `splash-screen.tsx:28` | status bar not hidden | Killed (1) |
| M17 | `splash-screen.tsx:22` | label "Roda" | Killed (2) |
| M18 | `root-navigator.tsx:25` | splash ignores session `loading` | Killed (2) |
| M19 | `onboarding-screen.tsx:84-85` | illustrations exposed to screen readers | Killed (2) |
| M20 | `app/(auth)/onboarding.tsx:10` | `router.push` instead of `router.replace` | Survived - not a spec-defined outcome (back-stack behavior unspecified, gap 5); the guard drops `(auth)/onboarding` as soon as the flag is set, so native back cannot return to it either way |
| M21 | `app/(auth)/onboarding.tsx:10` | route destinations swapped | Killed (6) |
| M22 | `onboarding-screen.tsx:69` | page 3 shows "Pular" | Killed (1) |
| M23 | `async-storage-onboarding-store.ts:17,21` | stored value `'1'` | Killed (4) |
| M24 | `splash-screen.tsx:25` | background `inverse` -> `background` (cream) | **Survived** -> Fix 1 |
| M25 | `splash-screen.tsx:33` | wordmark `onInverse` -> `textPrimary` | **Survived** -> Fix 1 |

**Sensor depth**: lightweight+ (25 manual behavior-level mutants; launch routing is not a P0 money/data path)
**Result**: 21/25 killed; 2 equivalent or unspecified (M15, M20); 2 real survivors (M24, M25) - FAIL

---

## Review (defects tests may miss)

- **Redirect loop / wrong-screen flash**: none found. `RootNavigator` returns only the splash while the session is `loading` or `holdSplash` is set (`root-navigator.tsx:25`). `holdSplash` covers the flag read and the minimum (`launch-navigator.tsx:38`), so the `Stack` mounts once, after both are known. Neither status returns to `loading`, so the splash cannot come back mid-session. On exit, `onExit` (replace) and `markSeen` run in one handler. The real guards in `OR:61-116` show no bounce through `/sign-in`.
- **Session restore vs flag read race**: they are independent and both gate the splash. Either order gives the same landing (`LN:92-127`).
- **Deep link to /sign-in on first launch**: allowed (both signed-out groups are open). A later sign-in stores the flag (`launch-navigator.tsx:31-33`, `LN:252-277`). A sign-up from `/register` reaches the same effect through `signedIn`.
- **AsyncStorage on web**: version 2.2.0 matches Expo's `bundledNativeModules.json`. Its web build wraps `window.localStorage` in promises, so a blocked storage (private mode) rejects, which is read as seen (fail-safe). `app.json` web output is the default SPA, so no server render touches `window`.
- **Back button**: page changes are local state, so Android back on page 2 or 3 leaves the app instead of going to page 1. That matches the out-of-scope "Voltar", but the spec does not say so (gap 5). After an exit, `replace` leaves no onboarding entry, and the guard removes the route anyway.
- **After sign-out**: Entrar, never onboarding (`LN:279-295`).
- **Module boundaries**: onboarding imports only `@/modules/auth` (index: `RootNavigator`, `useSession`), `@/core/*` and `@/shared/ui`. Auth never imports onboarding (AD-008). `onboarding` is listed in `tooling/modules.js`. Lint is clean.
- **Colors and tokens**: no hex literal in the diff outside `src/core/theme`. The splash uses existing roles (`inverse`, `onInverse`, `onInverseSecondary`, `inverseTrack`, `accent`). The new `typography.sizes.wordmark: 64` (`src/core/theme/tokens.ts:18`) matches Figma 21 (64/68, tracking -0.64). Line height 68 and letter spacing -0.64 are inline numbers (`splash-screen.tsx:35-36`), and so are the indicator sizes 28/8/4 (`onboarding-screen.tsx:128-130`). This is consistent with other screens and is not a rule violation.
- **Illustration chips on web** (gap 3, unverified on a device): `Chip` renders a `Pressable` with `accessibilityRole="button"` (`src/shared/ui/chip.tsx:17-21`). Inside `importantForAccessibility="no-hide-descendants"` (`aria-hidden` on web), react-native-web may still make it keyboard-focusable and show press opacity. `aria-hidden` content that can take focus is an a11y smell. It is harmless on native.
- **Blank before the splash**: `RootLayout` returns `null` while fonts load (`app/_layout.tsx:46`), before `LaunchNavigator` mounts. This existed before the feature and the spec measures the minimum from the navigator mount. Informational.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | PASS - one screen with a page index, one provider, one composer |
| Surgical changes | PASS - auth gains three optional props, existing navigator cases kept (`RN:70-84` updated from the old "Carregando" indicator by design) |
| No scope creep | PASS |
| Matches patterns | PASS - DI token + in-memory/real store, provider mirrors `SessionProvider` |
| Spec-anchored outcome check | FAIL - ONB-01 AC1 colors unasserted |
| Per-layer coverage | PASS except the splash colors |
| Every test maps to a requirement | PASS - `OP:89-94` (outside provider) and `onboarding-public-api.test.ts` map to T4/T8 Done-when |
| Documented guidelines followed | `CLAUDE.md` (no hex, PT-BR text, English code) - PASS |

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint`
- **Result**: 576 passed, 0 failed, 0 skipped (67 suites); typecheck exit 0; lint exit 0
- **Test count before feature**: 519 (59 suites, Handoff polish entry)
- **Test count after feature**: 576 (67 suites)
- **Delta**: +57 tests, +8 suites; no test removed. The one rewritten assertion (`RN:79-80`) replaces the old "Carregando" indicator with the injected splash, as T7 specifies
- **Skipped tests**: none
- **Failures**: none

---

## Ranked Gaps

| # | Severity | Where | Gap | Suggested fix |
| - | -------- | ----- | --- | ------------- |
| 1 | Major (blocks PASS; survived M24, M25) | `src/modules/onboarding/__tests__/splash-screen.test.tsx:14-41`; impl `splash-screen.tsx:25,33,43` | ONB-01 AC1 "on the forest (`inverse`) background" has no assertion; neither do the wordmark and tagline colors | Add a test: the element labelled "Roda. Carregando" `toHaveStyle({ backgroundColor: lightColors.inverse })`, "Roda" `toHaveStyle({ color: lightColors.onInverse })`, tagline `toHaveStyle({ color: lightColors.onInverseSecondary })`. Test-only change |
| 2 | Minor | `src/modules/onboarding/__tests__/onboarding-screen.test.tsx:235-241` | M15 (flag before navigation) is equivalent under batching; the "navigate first" ordering comment (`onboarding-screen.tsx:51-52`) is not enforced by any test | Optional: assert call order (`onExit` before the store write) with `jest.fn` invocation order, or drop the claim from the comment |
| 3 | Minor (a11y, web) | `src/modules/onboarding/presentation/onboarding-screen.tsx:83-89`, `src/shared/ui/chip.tsx:17` | Decorative chips are `Pressable` buttons inside an `aria-hidden` subtree; on web they may still take keyboard focus (ONB-03 AC8 "SHALL NOT offer any interaction") | Add `pointerEvents="none"` on the illustration container and render the sample chips non-interactively (e.g. a `View`-based static chip or a `disabled`/`focusable={false}` path in `Chip`); check with Tab in the browser |
| 4 | Minor | `tooling/__tests__/onboarding-route.test.tsx` | Edge case "IF writing the flag fails THEN the system SHALL still open the chosen destination" (ONB-05 AC3) is covered only for the status, not with routing | Add a route test with `jest.spyOn(store, 'markSeen').mockRejectedValue(...)`: "Pular" still lands on `/register` and the onboarding title is gone |
| 5 | Minor (spec) | `.specs/features/onboarding/spec.md` ONB-03/ONB-04 | Back behavior is unspecified (M20 survived): Android back on page 2/3 leaves the app; `replace` vs `push` after an exit is not an observable spec outcome | Add one AC: "WHEN the user presses the system back on any onboarding page THEN ..." or record that back leaves the app as an assumption |

---

## Fix Plans

### Fix 1: Assert the splash colors (ONB-01 AC1)

- **Root cause**: `splash-screen.test.tsx` checks texts, label, dot count and status bar but no color, so the background and text roles can change unnoticed.
- **Fix task**: in `src/modules/onboarding/__tests__/splash-screen.test.tsx`, add "paints the forest background with on-inverse text" with the three `toHaveStyle` assertions from gap 1 (import `lightColors` from `@/core/theme`, as `onboarding-screen.test.tsx:4` does). No product change expected.
- **Verify**: re-run M24 and M25 (background `inverse` -> `background`; wordmark `onInverse` -> `textPrimary`); both must be killed.
- **Priority**: Major (only blocker)

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ONB-01 | Implemented | Needs Fix (AC1 colors unasserted) |
| ONB-02 | Implemented | Verified |
| ONB-03 | Implemented | Verified |
| ONB-04 | Implemented | Verified |
| ONB-05 | Implemented | Verified |

---

## Summary

**Overall**: Not ready. One test-only fix is needed, then re-verify (iteration 2 of 3).

**Spec-anchored check**: 26/27 ACs matched the spec outcome; 1 AC gap (ONB-01 AC1 colors); 0 spec-precision gaps
**Sensor**: 21/25 killed; M15 equivalent; M20 unspecified; M24 and M25 survived
**Gate**: 576 passed, typecheck and lint clean

**What works**: splash on every launch with the 1200 ms minimum; landing for all three session/flag combinations; guards for signed-in and seen users; all four exits with the right destination and the flag stored; flag stored on sign-in; fail-safe read and write; Figma texts exact; AD-008 boundaries respected.

**Next steps**: Fix 1, then re-run the sensor for M24 and M25. Gaps 2-5 are optional. Then do the manual browser check from the Handoff.
