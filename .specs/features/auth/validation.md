# Auth Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/auth/spec.md`
**Diff range**: `3a62017..HEAD` (HEAD = ff65baf: 24 task commits T1-T24, `6cd2af2` to `ff65baf`)
**Iteration**: 1 of 3
**Verifier**: independent sub-agent (author ≠ verifier)

## Validation: auth - FAIL ❌

All 20 spec ACs and all 3 edge cases have `file:line` evidence, and the gate is green. The verdict is FAIL only because 2 of 15 sensor mutants survived (test-only gaps, no production defect found): the network retry on the **register** screen (design.md:119, :162) and the restore-vs-event ordering guard in `SessionProvider`. One spec-precision gap is material: AUTH-08 AC4 holds for URL entry but in-app navigation is **blocked, not redirected** (see below). Supabase repository behavior, "Confirm email" and migration application are manual-pending by design (AD-002), not failures.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T24 | ✅ Done | One commit per task (24 commits in range); every Done-when box checked in tasks.md |
| Manual Verification (T25, not a code task) | ⏳ Pending user | "Confirm email" off, apply `supabase/migrations/0001_profiles.sql` + `get_advisors`, web walk of the Independent Tests (AD-002). Not counted as a failure |

---

## Spec-Anchored Acceptance Criteria

### P1: Register (AUTH-01, AUTH-02, AUTH-03)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 valid name, e-mail, password: create account, start session, navigate to main area | account created; session signedIn; main area | `src/modules/auth/__tests__/register-screen.test.tsx:59` `findByText('signedIn')`, `:60` `expect(signUp).toHaveBeenCalledTimes(1)`, `:61-65` `toHaveBeenCalledWith({displayName:'Ana Lima',email:'ana@mail.com',password:'12345678'})`; `register-user.test.ts:12-19` result and `getCurrentUser` `toEqual`; navigation: `tooling/__tests__/root-navigator.test.tsx:116-117` signed-in user on `/register` lands on `/` (`getPathname()` `toBe('/')`) | ✅ PASS (navigation proven by composition: signedIn session + guard; no single test drives submit through the router). Real Supabase sign-up manual-pending |
| AC2 invalid e-mail: "E-mail inválido" on e-mail field, repository not called | exact message, field, 0 calls | `register-screen.test.tsx:82` `findByText('E-mail inválido')`, `:83-85` `getByLabelText('E-mail').props.accessibilityHint` `toBe(message)`, `:87-91` other fields `toBe(undefined)`, `:92` `toHaveBeenCalledTimes(0)`; `auth-schemas.test.ts:29-31` `toEqual([{path:'email',message:'E-mail inválido'}])`; `register-user.test.ts:52-56` | ✅ PASS |
| AC3 password < 8: "A senha deve ter pelo menos 8 caracteres" on password field, not called | exact message, field, 0 calls; 8 accepted | `register-screen.test.tsx:70,82-92` (same assertions, field `Senha`); `auth-schemas.test.ts:35-37` 7 chars rejected, `:41` 8 chars `toEqual([])` | ✅ PASS (mutant 1 killed) |
| AC4 name < 2 or > 40 after trim: "Nome deve ter entre 2 e 40 caracteres" on name field | exact message, field; bounds 2/40 | `register-screen.test.tsx:71,82-91` field `Nome`; `auth-schemas.test.ts:48-50` 1 and 41 chars rejected, `:57` 2 and 40 accepted, `:67-69` `' A '` rejected (length after trim), `:74` trimmed value `toBe('Ana Lima')` | ✅ PASS (spec omits "not call the repository" here; the test asserts 0 calls anyway at `:92`) |
| AC5 e-mail already registered: banner "Este e-mail já está cadastrado" | exact banner text | `register-screen.test.tsx:109-112` `findByText('Este e-mail já está cadastrado')` and status stays `signedOut`; `map-auth-error.test.ts:24-32` `user_already_exists`/`email_exists` `toEqual({code:'conflict',message:'Este e-mail já está cadastrado'})`; `in-memory-auth-repository.test.ts:47-50` | ✅ PASS (Supabase error-code mapping against the real project manual-pending) |
| AC6 pending: submit button loading and ignores further presses | loading state; 1 call | `register-screen.test.tsx:125-128` `accessibilityState` `toMatchObject({busy:true,disabled:true})`, `:132` `toHaveBeenCalledTimes(1)` after a second press, `:133-135` `busy:false` after | ✅ PASS |

### P1: Sign in and out (AUTH-04, AUTH-05, AUTH-06)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 registered e-mail + correct password: start session, navigate to main area | signedIn; main area | `src/modules/auth/__tests__/sign-in-screen.test.tsx:89` `findByText('signedIn')`, `:90-94` one call with `{email:'ana@mail.com',password:'12345678'}` (input `'  ANA@mail.com '`); `sign-in-user.test.ts:25-26`; navigation: `tooling/__tests__/root-navigator.test.tsx:116-117` signed-in on `/sign-in` lands on `/` | ✅ PASS (by composition, as Register AC1). Real Supabase manual-pending |
| AC2 credentials do not match: banner "E-mail ou senha incorretos" | exact text in banner | `sign-in-screen.test.tsx:103` `findByText('E-mail ou senha incorretos')`, `:104` banner (`accessibilityRole==='alert'`) contains it, `:105` status `signedOut`; `map-auth-error.test.ts:18-21` `invalid_credentials` `toEqual({code:'unauthorized',message:'E-mail ou senha incorretos'})` | ✅ PASS (mutant 8 killed) |
| AC3 empty e-mail or password: field-level "Campo obrigatório", repository not called | exact text per field; 0 calls | `sign-in-screen.test.tsx:115` `findAllByText('Campo obrigatório')` `toHaveLength(2)`, `:116-121` `accessibilityHint` on both fields `toBe('Campo obrigatório')`, `:122` `toHaveBeenCalledTimes(0)`; `sign-in-user.test.ts:54-58`; `auth-schemas.test.ts:88-96` | ✅ PASS |
| AC4 no connectivity: Foundation `network` message with "Tentar novamente" | `'Sem conexão. Verifique sua internet e tente novamente.'` + retry action | `sign-in-screen.test.tsx:135-137` message and "Tentar novamente" inside the banner, `:138-145` press re-calls the repository (`toHaveBeenCalledTimes(2)`, same payload); `:155` no retry for non-network; `map-auth-error.test.ts:40-50` `AuthRetryableFetchError` and `TypeError` `toEqual(createAppError('network'))` | ✅ PASS (mutants 9, 10 killed). Real offline check manual-pending |
| AC5 "Sair": end session, navigate to sign-in | signedOut; sign-in screen | `src/modules/auth/__tests__/home-screen.test.tsx:49-50` `findByText('signedOut')` and `signOut` `toHaveBeenCalledTimes(1)`; `tooling/__tests__/root-navigator.test.tsx:143-145` after sign-out `getPathname()` `toBe('/sign-in')` and no protected content | ✅ PASS (mutant 13 killed) |
| AC6 never display raw backend text | no backend string rendered | `map-auth-error.test.ts:65-81` `not.toContain(RAW)` across every branch incl. backend code named like an AppError code; `sign-in-screen.test.tsx:182-185` rejected repo with raw message renders only `createAppError('unknown').message`, `not.toContain(RAW)` on the whole tree | ✅ PASS (see "Raw backend strings" below) |

### P1: Session restore and route protection (AUTH-07, AUTH-08)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 valid stored session: straight to main area without showing sign-in | `/`; sign-in never rendered | `tooling/__tests__/root-navigator.test.tsx:128-130` `findByText('protected content')`, `getPathname()` `toBe('/')`, `signInRendered` `not.toHaveBeenCalled()`; `session-provider.test.tsx:63` | ✅ PASS (real persisted-session reload manual-pending) |
| AC2 no stored session: sign-in screen | `/sign-in` | `root-navigator.test.tsx:75-78` `getPathname()` `toBe('/sign-in')`, `mainRendered` not called; `tooling/__tests__/root-layout.test.tsx:45-47` real layout shows "Entrar" at `/sign-in` | ✅ PASS (mutant 6 killed) |
| AC3 restoring: loading indicator, no protected content | indicator; nothing protected | `root-navigator.test.tsx:61-65` `getByLabelText('Carregando')`, protected and sign-in content `toBeNull()`, both render spies `not.toHaveBeenCalled()`; `session-provider.test.tsx:52` `toBe('loading:none')` | ✅ PASS |
| AC4 signed-out user navigates to protected route: redirect to sign-in | sign-in screen | URL entry: `root-navigator.test.tsx:88-90` `/(app)` lands on `getPathname()` `toBe('/sign-in')`, `mainRendered` not called. In-app: `:105-106` only `queryByText('protected content')` `toBeNull()` | ⚠️ PASS for URL entry; spec-precision gap for in-app navigation (see below) (mutant 5 killed) |
| AC5 signed-in user navigates to sign-in or register: redirect to main area | `/` | `root-navigator.test.tsx:109-120` for `/sign-in` and `/register`: `getPathname()` `toBe('/')`, auth content `toBeNull()` | ✅ PASS (mutant 6 killed) |
| AC6 expired or invalid stored session: clear it and show sign-in | session cleared; sign-in | Shows sign-in: `session-use-cases.test.ts:47` error result `toBeNull()`, `:56` rejection `toBeNull()`; `session-provider.test.tsx:80` `signedOut:none`; signedOut renders sign-in (`root-navigator.test.tsx:75-76`). "Clear it": no app code clears storage; delegated to supabase-js `getSession` (`supabase-auth-repository.ts:59-66`) | ✅ PASS for "show sign-in" (mutant 7 killed); "clear it" manual-pending (AD-002) and flagged as spec-precision gap |

### Edge Cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| Sign-in submitted twice quickly: one repository call | `sign-in-screen.test.tsx:168-172` two presses, `toHaveBeenCalledTimes(1)`; `use-auth-action.test.tsx:39-46` two immediate `run` calls, `action` `toHaveBeenCalledTimes(1)` | ✅ PASS (mutant 4 killed by the hook test only; the screen test also passes on the `Button` loading guard, so the two layers are redundant, which is fine) |
| Whitespace-only display name treated as shorter than 2 | `auth-schemas.test.ts:61-63` `'     '` `toEqual([{path:'displayName',message:'Nome deve ter entre 2 e 40 caracteres'}])` | ✅ PASS |
| E-mail trimmed and lowercased before submitting | Payload asserted: `register-screen.test.tsx:61-65` and `sign-in-screen.test.tsx:91-94` (`toHaveBeenCalledWith` normalized e-mail); `register-user.test.ts:33-37`; `sign-in-user.test.ts:72-75`; `auth-schemas.test.ts:82,110` | ✅ PASS (mutants 2, 3 killed) |

**Payload/conjunction rule**: every repository-call AC asserts the payload value (`toHaveBeenCalledWith` normalized values), not only the call. Conjunctive ACs (Register AC1, Sign-in AC1 "start session AND navigate", Sign-in AC5 "end session AND navigate", AUTH-07 AC6 "clear AND show") were split: each half has its own evidence above, except "clear it" (manual-pending).

**Status**: ✅ All 20 ACs and 3 edge cases have evidence matching the spec outcome; ⚠️ 3 spec-precision gaps flagged.

### Spec-precision gaps

1. **AUTH-08 AC4 (material).** For URL entry the redirect is real (`/(app)` ends on `/sign-in`). For in-app navigation, `Stack.Protected` **ignores** the navigation instead of redirecting: a Verifier probe in the scratch worktree started at `/register` and called `router.navigate('/')`, `router.push('/')` and `router.replace('/')`; each time `getPathname()` stayed `/register` with register content visible and sign-in not rendered. The test at `tooling/__tests__/root-navigator.test.tsx:93-107` asserts only that protected content is absent, which is weaker than the spec outcome "redirect to the sign-in screen". Practical impact is low: a signed-out user is always on sign-in or register, no shipped control navigates to `/`, and from `/sign-in` "stay" equals the spec outcome. Resolution needed (orchestrator/user decision): either amend the AC to "the protected route is not shown; URL entry lands on sign-in, in-app navigation keeps the user on the current auth screen", or add an explicit redirect. Until then the test name describes the real behavior honestly but the assertion does not match the AC text.
2. **AUTH-07 AC6 "clear it".** The spec does not say which layer clears an invalid stored session. The app maps any restore failure to signed out but never clears storage itself; it relies on supabase-js. Not testable without the real backend; manual-pending.
3. **Register AC1 / Sign-in AC1 "navigate to the main area".** Proven by composition (session becomes `signedIn` in screen tests; signed-in users on auth routes land on `/` in navigator tests). No test drives a submit through the router and observes the transition `/sign-in` to `/`; the reverse transition (sign-out to `/sign-in`) is tested at `root-navigator.test.tsx:133-146`. Low risk, same guard mechanism.

### Raw backend strings (AUTH-06 AC6, Goal 3)

Every user-visible text path was traced:

- Banner text = `useAuthAction.error.message` (`use-auth-action.ts:29,31`). Sources: (a) use-case validation errors carry the schema's own pt-BR messages (`register-user.ts:13`, `sign-in-user.ts:13`); (b) `SupabaseAuthRepository` routes every `error` and every thrown value through `mapAuthError` (`supabase-auth-repository.ts:27,32,42,45,52,55,62,65`), which builds messages only from fixed strings or Foundation defaults and never reads `error.message` (`map-auth-error.ts:9-28`); (c) a thrown action goes through Foundation `mapError`, which only passes through objects that are already a valid `AppError` shape, otherwise fixed `network`/`unknown` text (`src/core/errors/map-error.ts:25-31`).
- Field errors = zod messages from `auth-schemas.ts`, all custom pt-BR for string inputs; form `defaultValues` are strings, so zod's English type-error defaults are unreachable from the UI.
- Greeting = `displayName` from user metadata (user content, not an error string).
- Residual, not user-reachable: `registerUser`/`signInUser` called programmatically with a non-object or non-string field would return zod's default English message. No screen can do this.
- Supabase-side codes not in the map (e.g. `email_address_invalid`, `over_request_rate_limit`) fall to the generic `unknown` text: safe, but generic. The real code list is checked in the manual step (tasks.md Manual Verification item 4).

Conclusion: no path renders a raw backend string.

---

## Discrimination Sensor

Run in an isolated `git worktree --detach` at HEAD under the session scratchpad (outside the repo), `node_modules` as a junction to the real one, each mutant applied with an exact-substring `sed` (CRLF preserved, the changed line confirmed in `git diff` per mutant), reverted with `git checkout -- <file>`, worktree removed with `--force` and pruned. Jest scoped to the covering test files.

| # | File:line | Description | Killed? |
| - | --------- | ----------- | ------- |
| 1 | `src/modules/auth/domain/auth-schemas.ts:16` | Password `min(8)` to `min(7)` | ✅ Killed (4 tests: schema 7-char, use case, register screen) |
| 2 | `src/modules/auth/domain/auth-schemas.ts:7` | Dropped `.toLowerCase()` from e-mail normalization | ✅ Killed (7 tests) |
| 3 | `src/modules/auth/domain/auth-schemas.ts:7` | Dropped `.trim()` from e-mail normalization | ✅ Killed (7 tests) |
| 4 | `src/modules/auth/presentation/use-auth-action.ts:23` | Removed the double-submit ref lock (`if (locked.current) return` to `if (false)`) | ✅ Killed (`invokes the action once for two immediate run calls`) |
| 5 | `src/modules/auth/presentation/root-navigator.tsx:35` | Protected `(app)` guard forced to `true` | ✅ Killed (5 navigator tests) |
| 6 | `src/modules/auth/presentation/root-navigator.tsx:38` | Auth-group guard forced to `true` | ✅ Killed (`redirects a signed-in user opening /sign-in` and `/register`) |
| 7 | `src/modules/auth/domain/session-use-cases.ts:15` | `restoreSession` returns a stale user instead of `null` on an error result | ✅ Killed (use case and provider error tests) |
| 8 | `src/modules/auth/data/map-auth-error.ts:10` | `invalid_credentials` mapped to `unknown` instead of `unauthorized` | ✅ Killed |
| 9 | `src/modules/auth/data/map-auth-error.ts:25` | `AuthRetryableFetchError` mapped to `unknown` instead of `network` | ✅ Killed |
| 10 | `src/modules/auth/presentation/sign-in-screen.tsx:84` | Retry offered for every error, not only `network` | ✅ Killed (`shows no retry action for a non-network error`) |
| 11 | `src/modules/auth/presentation/register-screen.tsx:100` | Register retry removed (`onRetry={undefined}`) | ❌ Survived (no register test exercises a network error with "Tentar novamente"; design.md:119, :162 require it) |
| 12 | `src/modules/auth/presentation/session-provider.tsx:39` | Dropped the `!eventSeen` guard: a late restore result overwrites a newer auth event | ❌ Survived (141 tests pass; no test fires an auth event before the restore resolves) |
| 13 | `src/modules/auth/presentation/home-screen.tsx:31` | "Sair" press no longer runs sign-out | ✅ Killed |
| 14 | `src/modules/auth/data/map-auth-error.ts:12` | Removed the `email_exists` mapping | ✅ Killed |
| 15 | `src/modules/auth/domain/register-user.ts:15` | Repository receives raw input instead of parsed (normalized) data | ✅ Killed |

**Sensor depth**: P0 / critical path (auth): 15 manual behavior-level mutations covering validation, normalization, double-submit lock, both route guards, restore, error mapping, retry and sign-out.
**Result**: 13/15 killed, 2 survived - FAIL ❌ (test-only gaps)

**Isolation check**: tracked files in the real tree are unchanged (`git diff` empty, `git worktree list` shows only the main tree). The real-tree `git status --porcelain` baseline was empty. After the sensor it showed one new untracked file, `docs/FIGMA_SCREENS.md` (created 16:13 with Figma screen notes). The sensor never writes to the real tree and never creates docs, so this file came from a concurrent process outside this Verifier. It was left untouched.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Domain files 16-31 lines, screens about 100-120 lines, thin route files (5-12 lines) |
| Surgical changes | ✅ The diff touches auth, core/supabase, the app routes, tests, package files and spec/tasks status only; `app/index.tsx` was moved into `app/(app)/index.tsx` as planned (T23) |
| No scope creep | ✅ No password reset, social login or profile editing. No anti-features. `mapAuthUser` e-mail-prefix fallback and the `eventSeen` guard are small defensive additions |
| Matches patterns | ✅ Barrel `index.ts`, `@/` aliases, DI token, `Result`/`AppError`, shared UI primitives, tests outside `app/` |
| Spec-anchored outcome check (asserted values match spec) | ⚠️ All exact pt-BR messages asserted verbatim; AUTH-08 AC4 in-app assertion is weaker than the AC text (gap 1) |
| Per-layer Coverage Expectation (domain 1:1 ACs; routes happy+edge+error) | ⚠️ Domain and data meet the matrix; presentation misses the register network/retry path (mutant 11) and the provider event-before-restore ordering (mutant 12) |
| Every test maps to a spec requirement - no unclaimed tests | ✅ Extra tests map to Done-when criteria (supabase config T3, mapper T12, public API T20, root layout T24, lint allow-case for the auth public API) |
| Documented guidelines followed: `docs/PROJECT_CONTEXT.md` (TDD, test layers, AD-002 manual backend), `docs/DESIGN_SYSTEM.md` | ✅ |

**SPEC_DEVIATION review**

1. `app/(auth)/register.tsx:5-7` (`router.dismissTo('/sign-in')` instead of design.md:128 `router.push`): **justified**. T22 asks the link to "navigate back"; `push` would stack a second sign-in entry each round trip, while `dismissTo` pops to the existing entry and still opens sign-in on a deep link. Both behaviors are tested: `tooling/__tests__/register-route.test.tsx:41-42` (deep link to `/register`, link opens `/sign-in`) and `:55-57` (`router.canGoBack()` `toBe(false)` after returning, so no stacked copy). The sign-in to register direction still uses `push` as designed (`app/(auth)/sign-in.tsx:6`). design.md should be updated to match.
2. `tooling/__tests__/lint-rules.test.ts:12` (Linter class): carried over from Foundation, already judged justified there; not part of this feature's behavior.

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint` (Build gate from tasks.md)
- **Result**: `npm test` 34 suites, 217 passed, 0 failed, 0 skipped; `npm run typecheck` exit 0; `npm run lint` exit 0
- **Test count before feature**: 103 (Foundation validation at `5c51b6c`)
- **Test count after feature**: 217
- **Delta**: +114 new tests (no deletions; `home-route.test.tsx` was rewritten for the moved main route and still asserts the background role)
- **Skipped tests**: none (no `skip`/`only`/`todo`/`xit`/`xdescribe` in `src` or `tooling`)
- **Failures**: none
- `npx expo export --platform web` was not re-run by the Verifier (T24 records it as passing)

---

## Interactive UAT

Not performed by the Verifier. Pending the user (tasks.md "Manual Verification", AD-002):

| # | Check | Status |
| - | ----- | ------ |
| 1 | Supabase "Confirm email" is off | ⏳ Manual-pending |
| 2 | `supabase/migrations/0001_profiles.sql` applied; `get_advisors` security clean | ⏳ Manual-pending |
| 3 | Web walk: register, land in main area, reload and stay in, sign out, open protected URL and get redirected, wrong password, duplicate e-mail, offline + "Tentar novamente" | ⏳ Manual-pending |
| 4 | Real Supabase error codes match `mapAuthError` (fix in a follow-up if not) | ⏳ Manual-pending |

---

## Fix Plans

### Fix 1: Register network retry is untested (mutant 11)

- **Root cause**: `register-screen.test.tsx` has no case where `signUp` returns `network`.
- **Fix task**: In `src/modules/auth/__tests__/register-screen.test.tsx`, mock `signUp` to resolve `err(createAppError('network'))` once, submit valid values, assert the banner contains `createAppError('network').message` and "Tentar novamente", press it, assert `signUp` `toHaveBeenCalledTimes(2)` with the same normalized payload; also assert no "Tentar novamente" for the duplicate e-mail banner. Done when mutant 11 is killed.
- **Priority**: Major (design-required behavior with no discriminating test)

### Fix 2: Restore-vs-event ordering in `SessionProvider` is untested (mutant 12)

- **Root cause**: no test fires an auth event while `getCurrentUser` is still pending.
- **Fix task**: In `src/modules/auth/__tests__/session-provider.test.tsx`, hold `getCurrentUser` on a deferred promise that resolves `ok(null)`, then sign in through the repository (event fires) inside `act`, resolve the restore, and assert the session stays `signedIn:Ana`. Done when mutant 12 is killed.
- **Priority**: Minor (race guard, not an AC, but the code exists and should be pinned)

### Fix 3 (decision, not code): AUTH-08 AC4 in-app navigation

- **Root cause**: `Stack.Protected` blocks navigation to a guarded route instead of redirecting; the spec says "redirect to the sign-in screen".
- **Options**: (a) amend spec AC4 to describe the two cases (URL entry lands on sign-in; in-app navigation is ignored and the user stays on the current auth screen) and tighten `root-navigator.test.tsx:105` to also assert `getPathname()` `toBe('/register')`; or (b) add a redirect and assert `/sign-in`. Recommended: (a), since no shipped control can trigger the in-app case.
- **Priority**: Minor

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AUTH-01 | Done (manual Supabase check pending) | Verified in code; manual check pending; Fix 1 (register retry test) open |
| AUTH-02 | Done | ✅ Verified |
| AUTH-03 | Done (manual Supabase check pending) | Verified in code; manual check pending |
| AUTH-04 | Done (manual Supabase check pending) | Verified in code; manual check pending |
| AUTH-05 | Done (manual Supabase check pending) | Verified in code; manual check pending |
| AUTH-06 | Done (manual Supabase check pending) | Verified in code; manual check pending |
| AUTH-07 | Done (manual Supabase check pending) | Verified in code; "clear it" manual-pending; Fix 2 open |
| AUTH-08 | Done (manual Supabase check pending) | ⚠️ AC4 URL case verified; in-app case needs Fix 3 decision |

(spec.md not edited by the Verifier.)

---

## Summary

**Overall**: ❌ Not Ready (test-only gaps; no production defect found)

**Spec-anchored check**: 20/20 ACs and 3/3 edge cases have evidence matching the spec outcome (exact pt-BR messages asserted verbatim); 3 spec-precision gaps flagged (AUTH-08 AC4 in-app, AUTH-07 AC6 "clear it", navigation by composition)
**Sensor**: 15 mutations, 13 killed, 2 survived
**Gate**: 217 passed, 0 failed, 0 skipped; typecheck and lint exit 0

**What works**: Zod schemas with exact pt-BR messages and normalization, use cases that never call the repository on invalid input, a backend error translator that never leaks `error.message`, a double-submit lock, a session provider with a loading state, declarative route guards that redirect on URL entry both ways, sign-out back to sign-in, and a justified `dismissTo` deviation.

**Issues found**: Fix 1 (register retry test), Fix 2 (provider ordering test), Fix 3 (AUTH-08 AC4 wording or redirect).

**Next steps**: Route Fix 1 and Fix 2 to an implementer (tests only), decide Fix 3, then re-verify (iteration 2 of 3). The user runs the Manual Verification steps.
