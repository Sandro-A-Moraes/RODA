# Onboarding Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline in this file (see "Design note"); no separate `design.md`.
**Status**: Done (T1-T10); Verifier fixes T11-T15 in progress

---

## Design note

New module `src/modules/onboarding/` (AD-001, AD-002). No Supabase: the flag is local to the device.

```ts
// domain/onboarding-store.ts
interface OnboardingStore {
  hasSeen(): Promise<boolean>;
  markSeen(): Promise<void>;
}
const onboardingStoreToken: Token<OnboardingStore>;

// data/async-storage-onboarding-store.ts
interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
class AsyncStorageOnboardingStore implements OnboardingStore {
  constructor(storage: KeyValueStorage); // app/_layout.tsx passes AsyncStorage
}
// key `roda.onboarding.seen`, value "true"

// presentation/onboarding-provider.tsx
type OnboardingStatus = 'loading' | 'unseen' | 'seen';
function OnboardingProvider(props: { children: ReactNode }): JSX.Element;
function useOnboarding(): { status: OnboardingStatus; markSeen(): void };

// presentation/launch-navigator.tsx
function LaunchNavigator(props: { minSplashMs?: number }): JSX.Element; // default 1200
```

The store takes the storage as a constructor argument because `@react-native-async-storage/async-storage` throws at import under Jest; only `app/_layout.tsx` imports it.

**Composition (AD-008).** `RootNavigator` stays in auth and gains props: `splash` (shown instead of the old `ActivityIndicator` while the session restores), `holdSplash` (keep the splash for reasons auth does not know) and `showOnboarding` (adds the `(auth)/onboarding` screen, first in the signed-out group so it is the initial route, guarded by `status === 'signedOut' && showOnboarding`). The onboarding module's `LaunchNavigator` reads `useSession()` from `@/modules/auth` and `useOnboarding()`, runs the minimum-duration timer, stores the flag when the session becomes signed in, and renders `RootNavigator` with those props. Dependency direction: onboarding -> auth public API only; auth never imports onboarding, so the module-boundary lint needs no change.

| Concern | Where |
| ------- | ----- |
| Read failure -> seen; write failure ignored | `OnboardingProvider` |
| Exit navigates and stores the flag in one press | `OnboardingScreen` calls `onExit(destination)` and `markSeen()` in one handler; React commits both together, so their order is not observable |
| Destination routes | `app/(auth)/onboarding.tsx`: `router.replace('/register' or '/sign-in')` |
| Illustrations hidden from screen readers | `importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden` |
| Splash colors | existing roles `inverse`, `onInverse`, `onInverseSecondary`, `inverseTrack`, `accent`; no new theme role |

---

## Test Coverage Matrix

> Guidelines found: `CLAUDE.md` (tests first, gate commands), `jest.config.js` (jest-expo, no coverage threshold); style and locations from `src/modules/stories/__tests__` and `tooling/__tests__`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain: store contract and token | none | - (build gate) | - | build gate |
| Data: in-memory and AsyncStorage stores | unit | unseen by default, `markSeen` then `hasSeen` true; AsyncStorage key and value exactly `roda.onboarding.seen` / `"true"` (ONB-05 AC1) | `src/modules/onboarding/__tests__/*.test.ts` | `npm test` |
| Presentation: provider, splash, onboarding screen | unit (React Native Testing Library) | one test per AC of ONB-01 AC1/4/5, ONB-03, ONB-04 AC1-4, ONB-05 AC2-3 | `src/modules/onboarding/__tests__/*.test.tsx` | `npm test` |
| Navigation: `RootNavigator`, `LaunchNavigator` | unit with `expo-router/testing-library` `renderRouter` | every ONB-01 AC1-3 and ONB-02 AC; existing RootNavigator cases kept | `tooling/__tests__/root-navigator.test.tsx`, `src/modules/onboarding/__tests__/launch-navigator.test.tsx` | `npm test` |
| Route files (`app/`) and root layout wiring | unit with `renderRouter` | each exit lands on its route and stores the flag (ONB-04 AC1-3, AC5); root layout builds the AsyncStorage store and opens onboarding on a fresh device | `tooling/__tests__/*.test.tsx` | `npm test` |
| Docs | none | - (build gate) | - | build gate |

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks that add or change code with types | `npm test && npm run typecheck` |
| Build | Every task in this feature (run `npx prettier --write` on touched files first) | `npm test && npm run typecheck && npm run lint` |

---

## Execution Plan

### Phase 1: Domain and data

```
T1 → T2 → T3
```

### Phase 2: Presentation

```
T3 → T4 → T5 → T6
```

### Phase 3: Navigation and wiring

```
T6 → T7 → T8 → T9
```

### Phase 4: Documentation

```
T9 → T10
```

### Phase 5: Verifier fixes

From `validation.md` iteration 1 (gaps 1-5).

```
T10 → T11 → T12 → T13 → T14 → T15
```

---

## Task Breakdown

### T1: Onboarding store contract and module registration

**What**: `OnboardingStore` and `onboardingStoreToken` as in the Design note; add `onboarding` to `MODULES` in `tooling/modules.js` so the boundary lint and the unlisted-module guard cover it.
**Where**: `src/modules/onboarding/domain/onboarding-store.ts`
**Depends on**: None
**Reuses**: `createToken` from `@/core/di`, `src/modules/stories/domain/story-repository.ts`
**Requirement**: ONB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Interface exposes `hasSeen` and `markSeen`
- [x] `onboarding` listed in `MODULES`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): add the onboarding store contract

---

### T2: In-memory onboarding store

**What**: Tests first: a new store reports unseen; after `markSeen` it reports seen; an optional constructor argument starts it seen. Implement `InMemoryOnboardingStore`.
**Where**: `src/modules/onboarding/data/in-memory-onboarding-store.ts`
**Depends on**: T1
**Requirement**: ONB-04, ONB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `in-memory-onboarding-store.test.ts`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): add the in-memory onboarding store

---

### T3: AsyncStorage onboarding store

**What**: Tests first against a fake `KeyValueStorage`: absent key is unseen; `markSeen` writes `"true"` under `roda.onboarding.seen`; a stored `"true"` is seen. Implement `AsyncStorageOnboardingStore` (storage injected through the constructor).
**Where**: `src/modules/onboarding/data/async-storage-onboarding-store.ts`
**Depends on**: T2
**Requirement**: ONB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `async-storage-onboarding-store.test.ts`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): persist the onboarding flag in AsyncStorage

---

### T4: Onboarding provider and `useOnboarding`

**What**: Tests first: status starts `loading`, then `unseen` or `seen` from the store; a rejected read gives `seen` (ONB-05 AC2); `markSeen` sets `seen` and persists it; a rejected write is ignored and the status stays `seen` (ONB-05 AC3); `useOnboarding` outside the provider throws. Implement `OnboardingProvider` and `useOnboarding`.
**Where**: `src/modules/onboarding/presentation/onboarding-provider.tsx`
**Depends on**: T3
**Reuses**: `src/modules/auth/presentation/session-provider.tsx` pattern
**Requirement**: ONB-04, ONB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `onboarding-provider.test.tsx`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): add the onboarding provider with safe flag reads

---

### T5: Splash screen

**What**: Tests first: shows "Roda" and "Menos tela. Mais roda.", exposes "Roda. Carregando", renders the 12-dot ring (12 circles), hides the status bar. Implement `SplashScreen` from Figma 21 (`29:748`): `inverse` background, ring 200 (dot r 9, first dot `accent`, every third `onInverseSecondary`, others `inverseTrack`), wordmark 64/68 Fraunces in `onInverse`, tagline body-lg in `onInverseSecondary`, gap 24.
**Where**: `src/modules/onboarding/presentation/splash-screen.tsx`
**Depends on**: T4
**Reuses**: `Text` from `@/shared/ui`, `react-native-svg`, `expo-status-bar`
**Requirement**: ONB-01

**Tools**:

- MCP: Figma (`get_design_context` on `29:748`)
- Skill: NONE

**Done when**:

- [x] Tests first in `splash-screen.test.tsx`
- [x] No hex literal; colors from roles
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): add the splash screen

---

### T6: Onboarding screen (three pages)

**What**: Tests first, one per ONB-03 AC and ONB-04 AC1-4: page texts, "Continuar" moves 1 -> 2 -> 3, no "Pular" on page 3, indicator label "Página N de 3", button labels, illustrations hidden from screen readers; "Pular", "Começar", "Já tenho conta" call `onExit('register' | 'register' | 'sign-in')` and leave the store seen; no exit leaves it unseen. Implement `OnboardingScreen` (one component with a page index) from Figma 22-24 (`29:765`, `29:807`, `29:840`).
**Where**: `src/modules/onboarding/presentation/onboarding-screen.tsx`
**Depends on**: T5
**Reuses**: `Screen`, `Text`, `Button`, `Card`, `Avatar`, `Chip` from `@/shared/ui`
**Requirement**: ONB-03, ONB-04

**Tools**:

- MCP: Figma (`get_design_context` on `29:765`, `29:807`, `29:840`)
- Skill: NONE

**Done when**:

- [x] Tests first in `onboarding-screen.test.tsx`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): add the three onboarding pages

---

### T7: RootNavigator takes the splash and the onboarding guard

**What**: Tests first in the existing navigator test: the given splash replaces the old "Carregando" indicator while the session restores; `holdSplash` keeps it after the session resolves; with `showOnboarding` a signed-out user at `/` lands on `/onboarding`; without it on `/sign-in`; a signed-in user opening `/onboarding` is redirected to the main area. Existing cases keep their assertions. Implement the props in `RootNavigator`.
**Where**: `src/modules/auth/presentation/root-navigator.tsx`
**Depends on**: T6
**Requirement**: ONB-01, ONB-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tooling/__tests__/root-navigator.test.tsx` updated test-first
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(auth): let RootNavigator show a splash and an onboarding route

---

### T8: LaunchNavigator and the module public API

**What**: Tests first (`renderRouter`, in-memory stores, `minSplashMs` 0 unless the test is about the minimum): splash while the session restores and while the flag is read; minimum duration keeps the splash; signed in -> main area, never onboarding; signed out unseen -> `/onboarding`; signed out seen -> `/sign-in`; signed-out user opening `/onboarding` with the flag set -> `/sign-in`; a sign-in with the flag unset stores it; sign-out after the flag is set -> `/sign-in`; failed read -> `/sign-in`. Implement `LaunchNavigator`, the module `index.ts` and a public-API test; record AD-008 in `.specs/STATE.md`.
**Where**: `src/modules/onboarding/presentation/launch-navigator.tsx`
**Depends on**: T7
**Reuses**: `RootNavigator`, `useSession` from `@/modules/auth`
**Requirement**: ONB-01, ONB-02, ONB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `launch-navigator.test.tsx` and `tooling/__tests__/onboarding-public-api.test.ts`
- [x] AD-008 recorded with Decision, Reason, Trade-off, Scope, Date, Status
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): compose the launch flow over RootNavigator

---

### T9: Onboarding route and root layout wiring

**What**: Tests first: the onboarding route's "Pular" and "Começar" land on `/register`, "Já tenho conta" on `/sign-in`, each with the flag stored, and a relaunch with that store lands on `/sign-in`; the root layout test (AsyncStorage replaced by its official Jest mock) opens onboarding on a fresh device. Add `app/(auth)/onboarding.tsx`, register `AsyncStorageOnboardingStore(AsyncStorage)` in `app/_layout.tsx` and render `OnboardingProvider` + `LaunchNavigator`.
**Where**: `app/(auth)/onboarding.tsx`
**Depends on**: T8
**Reuses**: `app/(auth)/sign-in.tsx`, `tooling/__tests__/root-layout.test.tsx`
**Requirement**: ONB-02, ONB-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `tooling/__tests__/onboarding-route.test.tsx`; `root-layout.test.tsx` updated
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(onboarding): wire the onboarding route and the launch flow

---

### T10: README and Handoff

**What**: README launch-flow note (splash, onboarding on first launch, the AsyncStorage flag, `npx expo start --web --clear`); Handoff in `.specs/STATE.md`; spec traceability.
**Where**: `README.md`
**Depends on**: T9
**Requirement**: ONB-01, ONB-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `python .claude/skills/tlc-spec-driven/scripts/validate_spec.py onboarding` passes
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: docs(onboarding): document the launch flow and update the handoff

---

### T11: Assert the splash colors (gap 1)

**What**: Tests first in `splash-screen.test.tsx`: the view labelled "Roda. Carregando" has background `lightColors.inverse`, the "Roda" wordmark color `lightColors.onInverse`, the tagline color `lightColors.onInverseSecondary` (ONB-01 AC1). Kill M24 (background -> `background`) and M25 (wordmark -> `textPrimary`) by hand; mutants are not committed. No product change.
**Where**: `src/modules/onboarding/__tests__/splash-screen.test.tsx`
**Depends on**: T10
**Requirement**: ONB-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Color test added and green
- [x] M24 and M25 make it fail, then reverted
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: test(onboarding): assert the splash background and text colors

---

### T12: Correct the exit-order comment (gap 2)

**What**: The order of `onExit` and `markSeen` in one press handler is not observable (React batches the status update with the navigation), so no test can enforce it. Replace the "navigate first" comment in `onboarding-screen.tsx` with the real reason; no behavior change. Update the Design note row that repeats the claim.
**Where**: `src/modules/onboarding/presentation/onboarding-screen.tsx`
**Depends on**: T11
**Requirement**: ONB-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Comment no longer claims an ordering guarantee
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: docs(onboarding): correct the exit order comment

---

### T13: Make the illustrations inert (gap 3)

**What**: Tests first in `onboarding-screen.test.tsx`: counting hidden elements too, page 1 and 2 offer only "Pular" and "Continuar" as buttons and page 3 only "Começar" and "Já tenho conta"; the illustration container has `pointerEvents` `none` (ONB-03 AC8). Implement `pointerEvents="none"` on the illustration container and draw the sample reaction chips as static views in the illustration; `src/shared/ui/chip.tsx` is unchanged.
**Where**: `src/modules/onboarding/presentation/onboarding-screen.tsx`
**Depends on**: T12
**Requirement**: ONB-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `onboarding-screen.test.tsx`
- [x] `Chip` unchanged for other screens
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: fix(onboarding): make the onboarding illustrations inert

---

### T14: Failed write still navigates (gap 4)

**What**: Route test in `tooling/__tests__/onboarding-route.test.tsx`: with `markSeen` rejecting, "Pular" still lands on `/register` and the onboarding title is gone (ONB-05 AC3, edge case "writing the flag fails").
**Where**: `tooling/__tests__/onboarding-route.test.tsx`
**Depends on**: T13
**Requirement**: ONB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Route test added and green
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Pending
**Commit**: test(onboarding): cover navigation when storing the flag fails

---

### T15: System back between pages (gap 5)

**What**: Spec: add ONB-03 AC9 (system back on page 2 or 3 shows the previous page; on page 1 it is not handled, so the system leaves the app) and the web assumption. Tests first in `onboarding-screen.test.tsx` with `BackHandler.addEventListener` spied: back on page 3 shows page 2, on page 2 shows page 1, on page 1 is not consumed. Implement with `BackHandler` from `react-native` in `onboarding-screen.tsx`. Update the onboarding Handoff line in `.specs/STATE.md`.
**Where**: `src/modules/onboarding/presentation/onboarding-screen.tsx`
**Depends on**: T14
**Requirement**: ONB-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `python .claude/skills/tlc-spec-driven/scripts/validate_spec.py onboarding` passes
- [ ] Tests first in `onboarding-screen.test.tsx`
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Pending
**Commit**: feat(onboarding): go back a page on the system back
