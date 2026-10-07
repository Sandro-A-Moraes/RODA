# Foundation Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/foundation/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from project guidelines and spec - confirm before Execute. Guidelines found: `docs/PROJECT_CONTEXT.md` (sections 7-8: TDD, test layers), `docs/DESIGN_SYSTEM.md`. No existing tests or test config; strong defaults applied on top of those guidelines. Test tooling does not exist until T3, so T1-T2 are config-only.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Core logic (errors, DI, theme tokens and hook) | unit | All branches; 1:1 to spec ACs; every listed edge case | `src/core/**/__tests__/*.test.ts(x)` | `npm test` |
| Shared UI components | unit (React Native Testing Library) | Render + press + state per AC (enabled, loading, disabled, error, retry) | `src/shared/ui/__tests__/*.test.tsx` | `npm test` |
| Lint guard-rails | unit (ESLint Node API) | Violation and non-violation case for every AC and for both alias and relative forms | `tooling/__tests__/*.test.ts` | `npm test` |
| App routes (`app/`) | unit (render) for screens; none for pure layout wiring | Screen renders with the specified background; layout verified by the web export build | `app/__tests__/*.test.tsx` | `npm test` |
| Tooling config (package.json, tsconfig, eslint/prettier config) | none (config consistency tests where an AC exists) | Build gate only | - | build gate |

## Gate Check Commands

> Generated from spec and design - confirm before Execute. A gate runs the scripts that already exist at that task (`test` appears in T3, `lint` in T4).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks that add or change code with types | `npm test && npm run typecheck` |
| Build | After config tasks, lint-rule tasks and the last task of each phase | `npm test && npm run typecheck && npm run lint` (plus `npx expo export --platform web` in T1 and T22) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order. The leading task in a phase diagram is the last task of the previous phase it depends on.

### Phase 1: Project and tooling

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Guard-rail lint rules

```
T5 → T6 → T7 → T8
```

### Phase 3: Core (errors, theme, DI)

```
T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15
```

### Phase 4: Shared UI

```
T15 → T16 → T17 → T18 → T19 → T20
```

### Phase 5: App shell

```
T20 → T21 → T22
T15 → T21
T17 → T22
```

---

## Task Breakdown

### T1: Scaffold the Expo project

**What**: Create the Expo blank-TypeScript project with Expo Router at the repo root (scaffold in a scratch folder and copy in, since `create-expo-app` refuses a non-empty directory), strip demo content so only `app/_layout.tsx` and `app/index.tsx` remain, and add a `typecheck` script (`tsc --noEmit`).
**Where**: `package.json`
**Depends on**: None
**Reuses**: `create-expo-app` template; `.gitignore` already in the repo
**Requirement**: FND-01, FND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm run typecheck` exits 0
- [x] `npx expo export --platform web` succeeds
- [x] Installed versions are recorded in the commit body (expo, react-native, typescript, eslint) because they are newer than assumed in design
- [x] No template demo screens or assets remain

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `chore(setup): scaffold expo project with router`

---

### T2: Strict TypeScript and import aliases

**What**: Set `strict: true` explicitly and add the `paths` aliases `@/core/*`, `@/shared/*`, `@/modules/*`.
**Where**: `tsconfig.json`
**Depends on**: T1
**Reuses**: Template `tsconfig.json`
**Requirement**: FND-02, FND-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm run typecheck` exits 0
- [x] `strict` is `true` in the file, not only inherited
- [x] The three alias entries exist and map to `./src/core/*`, `./src/shared/*`, `./src/modules/*`; runtime resolution is asserted by the config-parity test in T3

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `chore(setup): enable strict mode and add import aliases`

---

### T3: Jest, Testing Library and alias parity

**What**: Install Jest with the `jest-expo` preset and React Native Testing Library, add the `test` script, map the three aliases for Jest, and write a smoke test plus a config-parity test.
**Where**: `jest.config.js`
**Depends on**: T2
**Reuses**: `tsconfig.json` paths (single source for aliases)
**Requirement**: FND-02, FND-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tooling/__tests__/smoke.test.ts` passes
- [x] `tooling/__tests__/aliases.test.ts` asserts that every `paths` alias in `tsconfig.json` has an equivalent `moduleNameMapper` entry in Jest and the three alias names are exactly `@/core/*`, `@/shared/*`, `@/modules/*`
- [x] Gate passes: `npm test && npm run typecheck`
- [x] Test count: ≥ 2 tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Status**: Done
**Commit**: `test(setup): add jest and testing library with alias parity check`

---

### T4: ESLint base configuration

**What**: Add ESLint flat config extending `eslint-config-expo` and the `lint` script (`eslint .`), ignoring build output.
**Where**: `eslint.config.js`
**Depends on**: T3
**Reuses**: `eslint-config-expo`
**Requirement**: FND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm run lint` exits 0 on the clean tree
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 2 tests still pass

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `chore(lint): add eslint base config and lint script`

---

### T5: Prettier configuration

**What**: Add Prettier with project style (single quotes, trailing commas, `endOfLine: 'auto'`), a `format` script, and the ESLint-Prettier conflict guard (`eslint-config-prettier`).
**Where**: `.prettierrc`
**Depends on**: T4
**Reuses**: `eslint.config.js`
**Requirement**: FND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npx prettier --check .` exits 0 after one `npm run format`
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 2 tests still pass

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `chore(format): add prettier config and format script`

---

### T6: Module boundary lint rule

**What**: Add the generated per-module `no-restricted-imports` overrides driven by a `MODULES` array, plus a guard that the array matches `src/modules/*`.
**Where**: `eslint.config.js` (modify)
**Depends on**: T5
**Reuses**: ESLint base config from T4
**Requirement**: FND-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tooling/__tests__/lint-rules.test.ts` fails first for the right reason (no rule yet), then passes
- [x] A file in `src/modules/circles/` importing `@/modules/auth/domain/user` is reported
- [x] A file in `src/modules/circles/` importing `../../auth/domain/user` is reported
- [x] A file in `src/modules/circles/` importing `@/modules/auth` is NOT reported
- [x] A file in `src/modules/auth/` importing its own `../domain/user` is NOT reported
- [x] Guard test fails when a directory exists in `src/modules/` that is absent from `MODULES` (tested with a temp directory) and passes otherwise
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 6 tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(lint): enforce module boundaries`

---

### T7: Domain purity lint rule

**What**: Add the override restricting React, React Native, Expo and Supabase imports under `src/modules/*/domain/**`.
**Where**: `eslint.config.js` (modify)
**Depends on**: T6
**Reuses**: Lint-rule test harness from T6
**Requirement**: FND-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Importing each of `react`, `react-native`, `expo`, `expo-router`, `@supabase/supabase-js` from `src/modules/auth/domain/x.ts` is reported (one assertion per package)
- [x] The same imports from `src/modules/auth/presentation/x.tsx` are NOT reported
- [x] Importing `zod` from a domain file is NOT reported
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 6 new tests pass, earlier tests intact

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(lint): keep domain layer free of framework imports`

---

### T8: Hex color ban lint rule

**What**: Add the `no-restricted-syntax` rule rejecting hex color string literals in `src/**`, switched off for `src/core/theme/**`.
**Where**: `eslint.config.js` (modify)
**Depends on**: T7
**Reuses**: Lint-rule test harness from T6
**Requirement**: FND-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] `'#F5EEDF'`, `'#fff'`, `'#ffff'` and `'#F5EEDF80'` in `src/shared/ui/x.tsx` are reported
- [x] `'#hashtag'` and `'#12'` (not valid hex colors) in `src/shared/ui/x.tsx` are NOT reported
- [x] `'#F5EEDF'` in `src/core/theme/colors.ts` is NOT reported
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 5 new tests pass, earlier tests intact

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(lint): ban hex color literals outside the theme`

---

### T9: AppError type and factory

**What**: Define `ErrorCode`, `AppError` and `createAppError` with a default pt-BR message per code.
**Where**: `src/core/errors/app-error.ts`
**Depends on**: T8
**Reuses**: Error codes from the spec Assumptions table
**Requirement**: FND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Each of the six codes yields a non-empty default message; `unknown` is exactly "Algo deu errado. Tente novamente." and `network` is exactly "Sem conexão. Verifique sua internet e tente novamente."
- [x] A custom message overrides the default
- [x] `src/core/errors/index.ts` re-exports the symbols
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 3 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(core): add AppError and error codes`

---

### T10: Result type and helpers

**What**: Add `Result<T>`, `ok` and `err`, with type narrowing.
**Where**: `src/core/errors/result.ts`
**Depends on**: T9
**Reuses**: `AppError` from T9
**Requirement**: FND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] `ok(5)` has `ok: true` and `value: 5`; `err(error)` has `ok: false` and the same error
- [x] `ok(undefined)` still has `ok: true` (edge case)
- [x] A test narrows with `if (result.ok)` and reads `value` and `error` without type assertions (verified by `npm run typecheck`)
- [x] Barrel re-exports updated
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 3 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(core): add Result type`

---

### T11: Error mapper

**What**: Implement `mapError(thrown)` returning an `AppError` for network failures, existing `AppError`s and unknown values.
**Where**: `src/core/errors/map-error.ts`
**Depends on**: T10
**Reuses**: `createAppError` from T9
**Requirement**: FND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] `new TypeError('Network request failed')`, `new TypeError('Failed to fetch')` map to `network`
- [x] `new Error('boom')`, a string, `null`, `undefined` and a plain object map to `unknown`
- [x] An existing `AppError` object passes through unchanged (same code and message)
- [x] A `TypeError` with an unrelated message maps to `unknown`
- [x] Barrel re-exports updated
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 7 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(core): map unknown errors to AppError`

---

### T12: Color tokens

**What**: Add `palette`, `lightColors`, `darkColors` and `ColorRole` exactly as in the design system document.
**Where**: `src/core/theme/colors.ts`
**Depends on**: T11
**Reuses**: Reference tokens in `docs/DESIGN_SYSTEM.md`
**Requirement**: FND-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Each of the 9 palette entries equals the hex in `docs/DESIGN_SYSTEM.md` (one assertion per color)
- [x] `lightColors` has exactly the 8 roles with the mapping from the document (e.g. `accent` is `palette.terra`, `onAccent` is `palette.cream`)
- [x] `darkColors` has the same 8 role keys with the dark mapping (e.g. `accent` is `palette.glow`)
- [x] The hex lint rule does not flag this file
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 4 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(theme): add palette and light/dark color roles`

---

### T13: Typography and spacing tokens

**What**: Add `typography` (sizes, weights, replaceable `fontFamily`), `spacing` (4-based scale) and `minTouchTarget = 44`.
**Where**: `src/core/theme/tokens.ts`
**Depends on**: T12
**Reuses**: Nothing
**Requirement**: FND-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] `minTouchTarget` equals 44
- [x] `spacing` values are strictly increasing and multiples of 4
- [x] `typography.sizes` includes a body size at least 16 and a heading size larger than body
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 3 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(theme): add typography and spacing tokens`

---

### T14: useTheme hook

**What**: Add `useTheme()` returning light colors, spacing and typography, and the theme barrel `index.ts`.
**Where**: `src/core/theme/use-theme.ts`
**Depends on**: T13
**Reuses**: `colors.ts`, `tokens.ts`
**Requirement**: FND-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] `renderHook(useTheme)` returns `colors` deeply equal to `lightColors`
- [x] Returned `spacing` and `typography` are the token objects
- [x] `import { useTheme, lightColors, palette } from '@/core/theme'` works (alias resolution proven by the test import)
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 2 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(theme): add useTheme hook`

---

### T15: Dependency provider

**What**: Implement `createToken`, `provide`, `DependencyProvider` and `useDependency`.
**Where**: `src/core/di/dependency-provider.tsx`
**Depends on**: T14
**Reuses**: React Context
**Requirement**: FND-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] A registered instance is returned by identity (`toBe`) to a consumer inside the provider
- [x] Two tokens with the same name but created separately do not collide
- [x] Using an unregistered token throws an error whose message contains the token name
- [x] Using `useDependency` outside any provider throws the same named error
- [x] `src/core/di/index.ts` re-exports the API
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 4 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(core): add dependency injection provider`

---

### T16: Text component

**What**: Create `Text` with `primary` (default) and `secondary` variants using theme roles.
**Where**: `src/shared/ui/text.tsx`
**Depends on**: T15
**Reuses**: `useTheme`
**Requirement**: FND-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Default render has color `lightColors.textPrimary`
- [x] `variant="secondary"` has color `lightColors.textSecondary`
- [x] Extra `TextProps` (e.g. `accessibilityLabel`) pass through
- [x] `src/shared/ui/index.ts` created and exports `Text`
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 3 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(ui): add Text component`

---

### T17: Screen component

**What**: Create `Screen` with safe area, keyboard avoidance and the `background` color.
**Where**: `src/shared/ui/screen.tsx`
**Depends on**: T16
**Reuses**: `useTheme`
**Requirement**: FND-01, FND-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Renders its children
- [x] Background style equals `lightColors.background`
- [x] Barrel updated
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 2 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(ui): add Screen component`

---

### T18: Button component

**What**: Create `Button` with `label`, `onPress`, `loading` and `disabled`, accent colors and a 44 minimum height.
**Where**: `src/shared/ui/button.tsx`
**Depends on**: T17
**Reuses**: `Text`, `useTheme`, `minTouchTarget`
**Requirement**: FND-08, FND-09, FND-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Pressing an enabled button calls `onPress` exactly once
- [x] Pressing while `loading` does not call `onPress`; pressing while `disabled` does not call `onPress`
- [x] Background is `lightColors.accent` and label color is `lightColors.onAccent`
- [x] Minimum height is at least 44
- [x] Exposes `accessibilityRole="button"` and `accessibilityState` reflecting disabled/busy
- [x] Barrel updated
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 6 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(ui): add Button component`

---

### T19: TextField component

**What**: Create `TextField` with label, value, change handler and optional error shown below the input.
**Where**: `src/shared/ui/text-field.tsx`
**Depends on**: T18
**Reuses**: `Text`, `useTheme`, `minTouchTarget`
**Requirement**: FND-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Typing calls `onChangeText` with the typed text
- [x] With `error="E-mail inválido"` the message is on screen and exposed through the input's accessibility hint
- [x] Without `error` no error text renders
- [x] Input minimum height is at least 44 and the input is labelled (`accessibilityLabel` equals `label`)
- [x] Barrel updated
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 5 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(ui): add TextField component`

---

### T20: ErrorBanner component

**What**: Create `ErrorBanner` that shows an `AppError` message with an optional retry button.
**Where**: `src/shared/ui/error-banner.tsx`
**Depends on**: T19
**Reuses**: `Text`, `Button`, `AppError`
**Requirement**: FND-09, FND-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: fail, then pass
- [x] Given `createAppError('network')` it shows that error's message
- [x] Given `null` or `undefined` it renders nothing (edge case)
- [x] With `onRetry` it shows "Tentar novamente" and pressing it calls `onRetry` once
- [x] Without `onRetry` no retry button renders
- [x] Background is `lightColors.accent` and text is `lightColors.onAccent`
- [x] Barrel updated
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 6 new tests pass

**Tests**: unit
**Gate**: build

**Status**: Done
**Commit**: `feat(ui): add ErrorBanner component`

---

### T21: Root layout with dependency provider

**What**: Make `app/_layout.tsx` render the router `Stack` inside `DependencyProvider` (no provisions yet) and hide headers.
**Where**: `app/_layout.tsx`
**Depends on**: T20, T15
**Reuses**: `DependencyProvider` from T15
**Requirement**: FND-01, FND-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npx expo export --platform web` succeeds (layout is wiring only; matrix: no unit test for pure layout)
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: all earlier tests intact

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `feat(app): add root layout with dependency provider`

---

### T22: Blank home route

**What**: Make `app/index.tsx` render a single empty `Screen`, imported through the `@/shared/ui` alias.
**Where**: `app/index.tsx`
**Depends on**: T21, T17
**Reuses**: `Screen` from T17
**Requirement**: FND-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: the home route test fails, then passes (file is `tooling/__tests__/home-route.test.tsx`, not `app/__tests__/`: Expo Router treats every file under `app/` as a route, so a test there would be bundled as a screen)
- [x] The route renders a screen whose background equals `lightColors.background` (`#F5EEDF`)
- [x] `npx expo export --platform web` succeeds
- [ ] User check: `npx expo start --web` opens a blank cream screen with no console errors (manual web check pending user)
- [x] Gate passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: ≥ 1 new test passes

**Tests**: unit
**Gate**: build

**Status**: Done (code); manual web check pending user
**Commit**: `feat(app): add blank home route`

---

## Phase Execution Map

Phases run in sequence, tasks within a phase run in order:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 → T2 → T3 → T4 → T5
Phase 2:  T6 → T7 → T8
Phase 3:  T9 → T10 → T11 → T12 → T13 → T14 → T15
Phase 4:  T16 → T17 → T18 → T19 → T20
Phase 5:  T21 → T22
```

Total 22 tasks. Packed into three batches of whole phases: Batch 1 = Phases 1-2 (8 tasks), Batch 2 = Phase 3 (7 tasks), Batch 3 = Phases 4-5 (7 tasks).

---

## Requirement Coverage

| Requirement | Tasks |
| ----------- | ----- |
| FND-01 | T1, T17, T21, T22 |
| FND-02 | T1, T2, T3, T4, T5 |
| FND-03 | T6, T7 |
| FND-04 | T2, T3, T14 |
| FND-05 | T9, T10, T11 |
| FND-06 | T12, T13, T14 |
| FND-07 | T15, T21 |
| FND-08 | T17, T18, T19 |
| FND-09 | T18, T20 |
| FND-10 | T8, T16, T18, T20 |
