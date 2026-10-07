# Auth Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/auth/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from project guidelines, existing tests and spec - confirm before Execute. Guidelines found: `docs/PROJECT_CONTEXT.md` (sections 7-8: TDD, test layers, "real Supabase backend is not covered by automated tests"), `docs/DESIGN_SYSTEM.md`, `.specs/features/foundation/tasks.md` (matrix and gates), `jest.config.js`, `.specs/LESSONS.md` (candidates only, applied as hints). Existing tests sampled: `src/core/**/__tests__`, `src/shared/ui/__tests__`, `tooling/__tests__`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain: schemas and use cases | unit (against `InMemoryAuthRepository`) | All branches; 1:1 to spec ACs; every listed edge case (trim/lowercase, whitespace-only name, repository not called on invalid input) | `src/modules/auth/__tests__/*.test.ts` | `npm test` |
| Data: mappers, error translation, in-memory repository | unit | Every documented error code and the fallback; metadata and e-mail fallback for the user mapper; the in-memory repository's conflict, bad credentials, session and listener behavior | `src/modules/auth/__tests__/*.test.ts` | `npm test` |
| Data: `SupabaseAuthRepository` | none (AD-002: real backend validated manually) | - (build gate; manual check in T25) | - | build gate |
| Core: Supabase config reader | unit | Present, missing and blank variable; message names the variable and omits values | `src/core/supabase/__tests__/*.test.ts` | `npm test` |
| Core: Supabase client singleton | none | - (build gate; exercised manually in T25) | - | build gate |
| Presentation: provider, hook, screens | unit (React Native Testing Library) | Render + type + press + state per AC: loading, field errors, banner, retry, double press, sign out | `src/modules/auth/__tests__/*.test.tsx` | `npm test` |
| Presentation: `RootNavigator` and route files | unit (`expo-router/testing-library` `renderRouter`) | Every AUTH-07/08 AC: loading shows no protected content, redirect both ways, restored session lands in `(app)` | `tooling/__tests__/*.test.tsx` (never under `app/`: Expo Router bundles every file there as a route) | `npm test` |
| Entities, interfaces, module barrel (`index.ts`), SQL migration, package config | none | - (build gate; migration verified in T25) | - | build gate |

## Gate Check Commands

> Generated from `package.json` scripts - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks that add or change code with types | `npm test && npm run typecheck` |
| Build | After config tasks, the last task of each phase, and wiring tasks | `npm test && npm run typecheck && npm run lint` (plus `npx expo export --platform web` in T24 and T25) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order. The leading task in a phase diagram is the last task of the previous phase it depends on.

### Phase 1: Dependencies and Supabase client

```
T1 → T2 → T3 → T4
```

### Phase 2: Domain

```
T4 → T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Data

```
T10 → T11 → T12 → T13
```

### Phase 4: Presentation

```
T13 → T14 → T15 → T16 → T17 → T18
```

### Phase 5: Routes and verification

```
T18 → T19 → T20 → T21 → T22 → T23 → T24
```

---

## Task Breakdown

### T1: Install auth dependencies

**What**: Install `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`, `zod`, `react-hook-form` and `@hookform/resolvers` with `npx expo install` (Expo-pinned versions) and record installed versions.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Foundation `package.json`
**Requirement**: AUTH-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] All six packages appear in `dependencies`
- [ ] Installed versions of `zod`, `@supabase/supabase-js` and `react-hook-form` are recorded in the commit body, with the Zod e-mail API (`z.email()` or `z.string().email()`) and the `processLock` export confirmed from installed typings
- [ ] `npm run typecheck` and `npm run lint` pass

**Tests**: none
**Gate**: build

**Commit**: `chore(auth): add supabase, zod and form dependencies`

---

### T2: Profiles migration

**What**: Write the `profiles` table, RLS policies (select and update own row) and the `handle_new_user` security-definer trigger that copies `display_name` from signup metadata. Do NOT apply it.
**Where**: `supabase/migrations/0001_profiles.sql`
**Depends on**: T1
**Reuses**: Design "Data Models"
**Requirement**: AUTH-01

**Tools**:

- MCP: `supabase` (read-only: `list_tables`, `get_advisors`)
- Skill: NONE

**Done when**:

- [ ] File matches the Design data model: RLS enabled, display-name length check 2-40, trigger function with `set search_path = ''`, `(select auth.uid())` in policies
- [ ] No insert or delete policy exists (trigger inserts as definer)
- [ ] Nothing was executed against the Supabase project
- [ ] `npm run lint` passes

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add profiles migration with rls and signup trigger`

---

### T3: Supabase config reader

**What**: Add `readSupabaseConfig(env)` that returns URL and publishable key or throws an error naming the missing variable.
**Where**: `src/core/supabase/supabase-config.ts`
**Depends on**: T2
**Reuses**: `.env.example` variable names
**Requirement**: AUTH-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: returns both values when set; throws naming `EXPO_PUBLIC_SUPABASE_URL` when absent; throws naming `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when blank or whitespace; error text never contains a value
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 4 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(core): add supabase config reader`

---

### T4: Supabase client

**What**: Create the singleton client with AsyncStorage on native, `persistSession`, `autoRefreshToken`, `detectSessionInUrl: false`, and the native-only `AppState` auto-refresh listener; export `supabase` from `@/core/supabase`.
**Where**: `src/core/supabase/client.ts`
**Depends on**: T3
**Reuses**: `readSupabaseConfig`, Supabase Expo quickstart pattern
**Requirement**: AUTH-07

**Tools**:

- MCP: `supabase` (docs search only)
- Skill: NONE

**Done when**:

- [ ] `src/core/supabase/index.ts` exports `supabase` and `readSupabaseConfig`
- [ ] No hex literals, no secret key usage; only the two `EXPO_PUBLIC_` variables are read
- [ ] `npm test && npm run typecheck && npm run lint` pass; existing test count unchanged

**Tests**: none
**Gate**: build

**Commit**: `feat(core): add supabase client with persisted session`

---

### T5: Auth domain entity and repository contract

**What**: Define `AuthUser`, `RegisterInput`, `SignInInput`, the `AuthRepository` interface and `authRepositoryToken`.
**Where**: `src/modules/auth/domain/auth-repository.ts`
**Depends on**: T4
**Reuses**: `Result` from `@/core/errors`, `createToken` from `@/core/di`
**Requirement**: AUTH-01, AUTH-04, AUTH-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Interface has `signUp`, `signIn`, `signOut`, `getCurrentUser`, `subscribe` exactly as in Design
- [ ] File imports nothing from React, Expo or Supabase (lint domain purity passes)
- [ ] `npm test && npm run typecheck && npm run lint` pass

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): define auth repository contract`

---

### T6: Auth validation schemas

**What**: Add `registerSchema` and `signInSchema` with trimming, e-mail lowercasing and the spec's pt-BR messages.
**Where**: `src/modules/auth/domain/auth-schemas.ts`
**Depends on**: T5
**Reuses**: Zod (installed in T1)
**Requirement**: AUTH-02, AUTH-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first, one per case: invalid e-mail gives "E-mail inválido"; 7-char password gives "A senha deve ter pelo menos 8 caracteres" and 8-char passes; name of 1 and 41 chars gives "Nome deve ter entre 2 e 40 caracteres" and 2 and 40 pass; whitespace-only name fails; empty sign-in e-mail or password gives "Campo obrigatório"; sign-in accepts a 3-char password; `"  Ana@Mail.COM "` parses to `ana@mail.com`
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 9 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add register and sign-in schemas`

---

### T7: In-memory auth repository

**What**: Implement `InMemoryAuthRepository` with the same `Result` and error-code contract as production (conflict on duplicate e-mail, unauthorized on bad credentials, listeners on sign-in and sign-out).
**Where**: `src/modules/auth/data/in-memory-auth-repository.ts`
**Depends on**: T6
**Reuses**: `createAppError`, `ok`, `err`
**Requirement**: AUTH-01, AUTH-03, AUTH-04, AUTH-05, AUTH-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: `signUp` returns the user and starts a session; duplicate e-mail returns `conflict` with "Este e-mail já está cadastrado"; `signIn` with wrong password returns `unauthorized` with "E-mail ou senha incorretos"; unknown e-mail gives the same error; `signOut` clears the session and notifies listeners with `null`; `getCurrentUser` returns the user after sign-in and `null` after sign-out; `subscribe` returns a working unsubscribe
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 7 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add in-memory auth repository`

---

### T8: Register use case

**What**: Add `registerUser(repo, input)` that parses with `registerSchema`, returns a `validation` error without calling the repository when invalid, and otherwise calls `signUp` with normalized values.
**Where**: `src/modules/auth/domain/register-user.ts`
**Depends on**: T7
**Reuses**: `registerSchema`, `AuthRepository`
**Requirement**: AUTH-01, AUTH-02, AUTH-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: valid input returns the user; repository receives trimmed name and lowercased, trimmed e-mail; each invalid field returns `validation` and the repository spy records zero calls; duplicate e-mail returns the `conflict` error unchanged
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 5 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add register user use case`

---

### T9: Sign-in use case

**What**: Add `signInUser(repo, input)` with schema parsing, zero repository calls on invalid input and normalized e-mail.
**Where**: `src/modules/auth/domain/sign-in-user.ts`
**Depends on**: T8
**Reuses**: `signInSchema`, `AuthRepository`
**Requirement**: AUTH-04, AUTH-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: registered credentials return the user; wrong password returns `unauthorized` with "E-mail ou senha incorretos"; empty e-mail or empty password returns `validation` with zero repository calls; `"  ANA@mail.com "` signs in an account registered as `ana@mail.com`
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 4 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add sign-in use case`

---

### T10: Sign-out and restore-session use cases

**What**: Add `signOutUser(repo)` and `restoreSession(repo)`, where any error or missing session resolves to `null`.
**Where**: `src/modules/auth/domain/session-use-cases.ts`
**Depends on**: T9
**Reuses**: `AuthRepository`
**Requirement**: AUTH-04, AUTH-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: `signOutUser` ends the session; `restoreSession` returns the user when a session exists, `null` when none, and `null` when the repository returns an error (expired or invalid session)
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint` (phase end)
- [ ] Test count: at least 4 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `feat(auth): add sign-out and restore-session use cases`

---

### T11: Auth error translator

**What**: Add `mapAuthError` that maps Supabase auth error codes and the network error class to `AppError` with fixed pt-BR messages, never copying `error.message`.
**Where**: `src/modules/auth/data/map-auth-error.ts`
**Depends on**: T10
**Reuses**: `mapError`, `createAppError`
**Requirement**: AUTH-03, AUTH-05, AUTH-06

**Tools**:

- MCP: `supabase` (docs: auth error codes)
- Skill: NONE

**Done when**:

- [ ] Tests first: `invalid_credentials` gives `unauthorized` "E-mail ou senha incorretos"; `user_already_exists` and `email_exists` give `conflict` "Este e-mail já está cadastrado"; `weak_password` gives `validation`; `AuthRetryableFetchError` and a `network request failed` `TypeError` give `network`; unknown code and non-error values give `unknown`
- [ ] A test feeds an error whose `message` is a distinctive raw string and asserts the result's message does not contain it, for every branch
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 8 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): translate supabase auth errors`

---

### T12: Auth user mapper

**What**: Add `mapAuthUser` that converts a Supabase user to `AuthUser`, reading `display_name` from metadata with an e-mail local-part fallback.
**Where**: `src/modules/auth/data/map-auth-user.ts`
**Depends on**: T11
**Reuses**: `AuthUser`
**Requirement**: AUTH-01, AUTH-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: metadata name wins; missing metadata falls back to the part before `@`; missing e-mail gives an empty string rather than throwing
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 3 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): map supabase users to auth users`

---

### T13: Supabase auth repository

**What**: Implement `SupabaseAuthRepository(client)` using `signUp` (sending `options.data.display_name`), `signInWithPassword`, `signOut`, `getSession`, `onAuthStateChange`, routing every failure through `mapAuthError` and returning `unknown` when `signUp` yields no session.
**Where**: `src/modules/auth/data/supabase-auth-repository.ts`
**Depends on**: T12
**Reuses**: `mapAuthError`, `mapAuthUser`, injected client
**Requirement**: AUTH-01, AUTH-04, AUTH-06, AUTH-07

**Tools**:

- MCP: `supabase` (docs search only)
- Skill: NONE

**Done when**:

- [ ] Implements every `AuthRepository` method; no `error.message` is returned to callers
- [ ] Client is constructor-injected (no import of the singleton in this file)
- [ ] `npm test && npm run typecheck && npm run lint` pass; existing test count unchanged
- [ ] Manual coverage deferred to T24 by design (AD-002)

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add supabase auth repository`

---

### T14: Session provider

**What**: Add `SessionProvider` and `useSession` with states `loading`, `signedIn`, `signedOut`, driven by `restoreSession` and `repo.subscribe`.
**Where**: `src/modules/auth/presentation/session-provider.tsx`
**Depends on**: T13
**Reuses**: `useDependency`, `authRepositoryToken`, `restoreSession`
**Requirement**: AUTH-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first with `InMemoryAuthRepository`: status is `loading` before restore resolves; becomes `signedIn` with the user when a session exists; `signedOut` when none; `signedOut` when restore errors; switches to `signedOut` when the repository signs out and to `signedIn` on sign-in; unsubscribes on unmount
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 6 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add session provider`

---

### T15: Auth action hook

**What**: Add `useAuthAction(action)` returning `{ run, pending, error, retry }` with a ref lock that turns a second `run` while pending into a no-op.
**Where**: `src/modules/auth/presentation/use-auth-action.ts`
**Depends on**: T14
**Reuses**: `Result`, `AppError`
**Requirement**: AUTH-01, AUTH-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: `pending` is true while the action runs and false after; two immediate `run` calls invoke the action once; an error result sets `error` and a success clears it; `retry` re-runs with the last arguments; a thrown action resolves to a mapped `AppError` rather than rejecting
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 5 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add auth action hook`

---

### T16: Sign-in screen

**What**: Build `SignInScreen` with react-hook-form and `signInSchema`, field errors, an `ErrorBanner` for repository errors with "Tentar novamente" on `network`, a loading submit button and a link to register.
**Where**: `src/modules/auth/presentation/sign-in-screen.tsx`
**Depends on**: T15
**Reuses**: `Screen`, `TextField`, `Button`, `ErrorBanner`, `signInUser`, `useAuthAction`
**Requirement**: AUTH-04, AUTH-05, AUTH-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: valid submit calls the repository once and the provider moves to signed in; wrong password shows the banner "E-mail ou senha incorretos"; empty fields show "Campo obrigatório" under each field and the repository spy has zero calls; a `network` error shows the banner with "Tentar novamente", and pressing it calls the repository again; two quick presses make one call; no rendered text contains a raw backend string; the banner renders after the form fields
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 7 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add sign-in screen`

---

### T17: Register screen

**What**: Build `RegisterScreen` with name, e-mail and password fields, `registerSchema` field errors, error banner, loading state and a link to sign-in.
**Where**: `src/modules/auth/presentation/register-screen.tsx`
**Depends on**: T16
**Reuses**: `Screen`, `TextField`, `Button`, `ErrorBanner`, `registerUser`, `useAuthAction`
**Requirement**: AUTH-01, AUTH-02, AUTH-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: valid submit calls the repository once with normalized values; invalid e-mail, 7-char password and 1-char name show their exact pt-BR messages on the right fields with zero repository calls; duplicate e-mail shows the banner "Este e-mail já está cadastrado"; the submit button is in loading state and ignores a second press while pending
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 6 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add register screen`

---

### T18: Home screen with sign-out

**What**: Add the placeholder main area `HomeScreen` showing the display name and a "Sair" button that signs out.
**Where**: `src/modules/auth/presentation/home-screen.tsx`
**Depends on**: T17
**Reuses**: `useSession`, `signOutUser`, `Screen`, `Text`, `Button`
**Requirement**: AUTH-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first: shows the signed-in display name; pressing "Sair" calls `signOut` once and the session becomes `signedOut`; an error on sign-out shows the banner instead of crashing
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint` (phase end)
- [ ] Test count: at least 3 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `feat(auth): add home screen with sign out`

---

### T19: Root navigator

**What**: Add `RootNavigator` rendering a loading indicator (no stack) while the session restores, then a `Stack` with `Protected` groups `(app)` for signed-in and `(auth)` for signed-out.
**Where**: `src/modules/auth/presentation/root-navigator.tsx`
**Depends on**: T18
**Reuses**: `useSession`, `Stack.Protected` from `expo-router`, `useTheme`
**Requirement**: AUTH-07, AUTH-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Spike first: read installed `expo-router` typings for `Stack.Protected` and `renderRouter`; if the harness cannot model protection, assert guard props instead and record the choice in the commit body
- [ ] Tests first (inline route tree with `(auth)/sign-in`, `(auth)/register`, `(app)/index`): while loading, the indicator shows and neither protected nor sign-in content renders; signed out at `/` lands on sign-in; signed out opening the `(app)` route redirects to sign-in; signed in opening sign-in or register redirects to the main area; restored session lands in `(app)` without rendering sign-in
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 5 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add root navigator with protected routes`

---

### T20: Public API of the auth module

**What**: Export the module's public surface from `index.ts` (provider, hook, navigator, screens, repositories, token, `AuthUser`).
**Where**: `src/modules/auth/index.ts`
**Depends on**: T19
**Reuses**: Design "Public API and routes"
**Requirement**: AUTH-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Only the Design list is exported; `use-auth-action`, mappers and use cases stay internal
- [ ] Lint boundary rules still pass and a new boundary test case imports `@/modules/auth` from another module without violation
- [ ] `npm test && npm run typecheck && npm run lint` pass

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): expose module public api`

---

### T21: Sign-in route

**What**: Add the thin `(auth)/sign-in` route rendering `SignInScreen` and navigating to register.
**Where**: `app/(auth)/sign-in.tsx`
**Depends on**: T20
**Reuses**: `SignInScreen` via `@/modules/auth`
**Requirement**: AUTH-04, AUTH-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Route renders the sign-in screen and its register link navigates to the register route (test in `tooling/__tests__`)
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 1 new test passes (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(app): add sign-in route`

---

### T22: Register route

**What**: Add the thin `(auth)/register` route rendering `RegisterScreen` and navigating back to sign-in.
**Where**: `app/(auth)/register.tsx`
**Depends on**: T21
**Reuses**: `RegisterScreen` via `@/modules/auth`
**Requirement**: AUTH-01, AUTH-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Route renders the register screen and its sign-in link navigates back (test in `tooling/__tests__`)
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: at least 1 new test passes (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(app): add register route`

---

### T23: Main area route replaces the blank home

**What**: Move the root route to `(app)/index` rendering `HomeScreen`, delete `app/index.tsx`, and move `home-route.test.tsx` to target the new route.
**Where**: `app/(app)/index.tsx`
**Depends on**: T22
**Reuses**: `HomeScreen`; the Foundation home-route test
**Requirement**: AUTH-04, AUTH-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `app/index.tsx` no longer exists and no two files resolve to `/`
- [ ] The updated route test keeps its background-role assertion and adds one for the greeting
- [ ] Gate check passes: `npm test && npm run typecheck`
- [ ] Test count: same number or more than before this task (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `feat(app): move main area to protected route group`

---

### T24: Root layout wiring

**What**: Wire `app/_layout.tsx` to provide the Supabase repository, wrap `SessionProvider` and render `RootNavigator`.
**Where**: `app/_layout.tsx`
**Depends on**: T23
**Reuses**: `DependencyProvider`, `supabase`, `SupabaseAuthRepository`, `RootNavigator`
**Requirement**: AUTH-07, AUTH-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Layout test in `tooling/__tests__` renders the real layout with the repository token overridden by `InMemoryAuthRepository` (the layout accepts no props, so the test mocks `@/core/supabase`) and checks sign-in appears when signed out
- [ ] `npx expo export --platform web` succeeds
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint` (phase end)
- [ ] Test count: at least 1 new test passes (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `feat(app): wire auth providers and root navigator`

---

## Manual Verification (not a code task)

After T24, with the user's explicit go-ahead for each external action:

1. Confirm in the Supabase dashboard that "Confirm email" is off (Auth settings).
2. Apply `supabase/migrations/0001_profiles.sql` (the user pastes it in the SQL editor, or approves a `mcp` migration call), then run `get_advisors` for security.
3. `npx expo start --web`; walk the spec's Independent Tests: register, land in main area, reload and stay in, sign out, open the protected URL and get redirected, sign in with a wrong password, register the same e-mail again, go offline and press "Tentar novamente".
4. Fix any wrong error-code mapping found (T11) in a follow-up commit.

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7 ------→ T8 ------→ T9 ------→ T10
Phase 3:  T11 -----→ T12 -----→ T13
Phase 4:  T14 -----→ T15 -----→ T16 -----→ T17 -----→ T18
Phase 5:  T19 -----→ T20 -----→ T21 -----→ T22 -----→ T23 -----→ T24
```

Execution is strictly sequential. 24 tasks pack into about 4 task-budgeted batches of whole phases (P1+P2 = 10 would exceed the budget, so: P1 | P2 | P3+P4 = 8 | P5).
