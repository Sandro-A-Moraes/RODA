# Auth Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/auth/spec.md`
**Diff range**: `3a62017..HEAD` (HEAD = `4e6db17`). Iteration 1 covered `3a62017..ff65baf`; iteration 2 covered `ff65baf..af5b2de`; this run re-checks the whole range with focus on the fix commit `af5b2de..4e6db17` (`4e6db17` adds one assertion to `register-screen.test.tsx:112`)
**Iteration**: 3 of 3 (final before escalation)
**Verifier**: independent sub-agent (author ≠ verifier, fresh context; earlier reports used only to avoid reusing mutations)

## Validation: auth - PASS ✅

The single iteration-2 blocker is closed: mutant 19 (register retry for every error) is now killed by `RegisterScreen › shows the banner "Este e-mail já está cadastrado" for a duplicate e-mail`. Eight fresh mutations across the hook, error mapping, schemas, screens and provider were all killed. Gate is green (219 tests, typecheck and lint exit 0). What remains is manual-pending only (real Supabase behavior, Confirm email, migration apply, AUTH-07 AC6 "clear it" delegated to supabase-js) plus the combined-evidence navigation ACs, all accepted as non-blocking.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T24 | ✅ Done | Production code unchanged since iteration 1 (`git diff --stat af5b2de HEAD` touches only one test file and `.specs/`) |
| Iteration-1 fixes 1-3 | ✅ Done | Verified in iteration 2; files unchanged since |
| Iteration-2 Fix 1 (mutant 19) | ✅ Done | `4e6db17`: `register-screen.test.tsx:112` `expect(screen.queryByText('Tentar novamente')).toBeNull()`; mutant 19 killed this run |
| Manual Verification (T25) | ⏳ Pending user | AD-002; not counted as a failure |

---

## Spec-Anchored Acceptance Criteria

Re-derived from spec.md. Citations re-read against the current files; `register-screen.test.tsx` lines after 111 shifted by +1 from iteration 2.

### P1: Register (AUTH-01, AUTH-02, AUTH-03)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 valid submit: create account, start session, navigate to main area | account; `signedIn`; `/` | `src/modules/auth/__tests__/register-screen.test.tsx:59` `findByText('signedIn')`, `:60` `toHaveBeenCalledTimes(1)`, `:61-65` `toHaveBeenCalledWith({displayName:'Ana Lima',email:'ana@mail.com',password:'12345678'})`; navigation: `tooling/__tests__/root-navigator.test.tsx:110-122` signed-in on `/register` gives `getPathname()` `toBe('/')` | ✅ PASS (navigation by composition, residual gap 2) |
| AC2 invalid e-mail: "E-mail inválido" on e-mail field, repo not called | exact text, field, 0 calls | `register-screen.test.tsx:69` case, `:82` `findByText(message)`, `:83-85` `accessibilityHint` `toBe(message)`, `:88-91` other fields clean, `:92` `toHaveBeenCalledTimes(0)`; `auth-schemas.test.ts:28-31` | ✅ PASS |
| AC3 password < 8: exact message on password field, not called | exact text; 7 rejected, 8 accepted | `register-screen.test.tsx:70,82-92`; `auth-schemas.test.ts:34-37`, `:41` `toEqual([])` | ✅ PASS |
| AC4 name < 2 or > 40 after trim: exact message on name field | 1/41 rejected, 2/40 accepted | `register-screen.test.tsx:71,82-91`; `auth-schemas.test.ts:44-50`, `:53-57`, `:66-69` `' A '` rejected | ✅ PASS |
| AC5 duplicate e-mail: banner "Este e-mail já está cadastrado" | exact banner text, no retry action | `register-screen.test.tsx:109-111` `findByText('Este e-mail já está cadastrado')`, `:112` `queryByText('Tentar novamente')` `toBeNull()`, `:113` status `signedOut`; `map-auth-error.test.ts:24-32` `toEqual({code:'conflict',message:'Este e-mail já está cadastrado'})` | ✅ PASS (real Supabase codes manual-pending) |
| AC6 pending: button loading, ignores presses | busy/disabled; 1 call | `register-screen.test.tsx:126-129` `toMatchObject({busy:true,disabled:true})`, `:133` `toHaveBeenCalledTimes(1)`, `:134-136` `busy:false` after | ✅ PASS (mutant 25 killed) |

### P1: Sign in and out (AUTH-04, AUTH-05, AUTH-06)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 correct credentials: session, main area | `signedIn`; `/` | `src/modules/auth/__tests__/sign-in-screen.test.tsx:89` `findByText('signedIn')`, `:90-94` one call with `{email:'ana@mail.com',password:'12345678'}`; `root-navigator.test.tsx:110-122` for `/sign-in` | ✅ PASS (by composition, residual gap 2) |
| AC2 wrong credentials: banner "E-mail ou senha incorretos" | exact text in banner | `sign-in-screen.test.tsx:103-105` `findByText` + banner `toContain('E-mail ou senha incorretos')`; `map-auth-error.test.ts:17-21` | ✅ PASS |
| AC3 empty field: "Campo obrigatório" per field, not called | text per field; 0 calls | `sign-in-screen.test.tsx:115-122` `findAllByText('Campo obrigatório')` `toHaveLength(2)`, hints per field, `toHaveBeenCalledTimes(0)`; `auth-schemas.test.ts:87-96` | ✅ PASS (mutant 24 killed) |
| AC4 no connectivity: Foundation `network` message + "Tentar novamente" | `createAppError('network').message` + retry | `sign-in-screen.test.tsx:134-145` message and retry inside banner, retry re-calls (`toHaveBeenCalledTimes(2)`, `toHaveBeenNthCalledWith(2, ...)`); `:148-156` no retry for non-network; register parity `register-screen.test.tsx:139-165` positive, `:112` negative; `map-auth-error.test.ts:46-47` offline `TypeError` to `network` | ✅ PASS (mutants 19, 21, 26, 28 killed) |
| AC5 "Sair": end session, navigate to sign-in | `signedOut`; `/sign-in` | `home-screen.test.tsx:49-50` `findByText('signedOut')`, `signOut` `toHaveBeenCalledTimes(1)`; `root-navigator.test.tsx:144-146` `getPathname()` `toBe('/sign-in')`, protected `toBeNull()` | ✅ PASS |
| AC6 no raw backend text | never rendered | `map-auth-error.test.ts:65-80` `not.toContain(RAW)` per branch; `sign-in-screen.test.tsx:182-185` whole tree `not.toContain(RAW)` | ✅ PASS |

### P1: Session restore and route protection (AUTH-07, AUTH-08)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 valid stored session: main area, sign-in never shown | `/`; sign-in not rendered | `root-navigator.test.tsx:129-131` `getPathname()` `toBe('/')`, `signInRendered` `not.toHaveBeenCalled()` | ✅ PASS |
| AC2 no stored session: sign-in | `/sign-in` | `root-navigator.test.tsx:75-78` | ✅ PASS |
| AC3 restoring: indicator, no protected content | "Carregando"; nothing protected | `root-navigator.test.tsx:61-65` `getByLabelText('Carregando')`, protected and sign-in `toBeNull()`, render spies not called | ✅ PASS |
| AC4a signed-out, protected route by URL: redirect to sign-in | `/sign-in` | `root-navigator.test.tsx:88-90` `getPathname()` `toBe('/sign-in')`, `mainRendered` not called | ✅ PASS |
| AC4b signed-out, in-app navigation: stay, no protected content | stays `/register` | `root-navigator.test.tsx:105-107` `queryByText('protected content')` `toBeNull()`, `getPathname()` `toBe('/register')`, `mainRendered` `not.toHaveBeenCalled()` | ✅ PASS |
| AC5 signed-in on sign-in/register: redirect to main area | `/` | `root-navigator.test.tsx:110-122` | ✅ PASS |
| AC6 expired/invalid session: clear it and show sign-in | cleared; sign-in | "show sign-in": `session-use-cases.test.ts:47,56` `restoreSession` `toBeNull()`; signedOut renders sign-in (`root-navigator.test.tsx:75-76`). "clear it": delegated to supabase-js | ✅ PASS for "show sign-in"; "clear it" manual-pending (residual gap 1) |

### Edge Cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| Sign-in submitted twice quickly: one call | `sign-in-screen.test.tsx:168-172` `toHaveBeenCalledTimes(1)`; `use-auth-action.test.tsx` lock test | ✅ PASS |
| Whitespace-only name treated as shorter than 2 | `auth-schemas.test.ts:60-63` | ✅ PASS |
| E-mail trimmed and lowercased | `register-screen.test.tsx:61-65,160-164`; `sign-in-screen.test.tsx:91-94`; `auth-schemas.test.ts:77-82,105-110` | ✅ PASS |

**Payload/conjunction rule**: repository calls assert normalized payloads (`toHaveBeenCalledWith` / `toHaveBeenNthCalledWith`); conjunctive ACs split, each half evidenced except AUTH-07 AC6 "clear it".

**Status**: ✅ 21/21 AC rows and 3/3 edge cases matched the spec outcome; ⚠️ 2 residual spec-precision gaps, non-blocking (unchanged from iteration 2).

### Spec-precision gaps (residual, non-blocking)

1. **AUTH-07 AC6 "clear it"**: restore failure maps to signed out; clearing storage is left to supabase-js `getSession`. Not testable without the real backend; manual-pending (AD-002).
2. **Register AC1 / Sign-in AC1 "navigate to the main area"**: proven by composition (screen tests reach `signedIn`; navigator tests send a signed-in user on auth routes to `/`). Accepted as combined evidence.

---

## Discrimination Sensor

Isolated scratch: `git worktree add --detach <session scratchpad>/wt3 HEAD` (outside the repo), `node_modules` as an NTFS junction to the real one. Each mutant applied by exact-substring `perl` replace, applied line confirmed in `git diff -U0`, full suite run (`npx jest src tooling`, 219 tests), reverted with `git checkout -- <file>`, scratch `git status --porcelain` empty after each. Scratch baseline: first cold run showed 2 transient failures (cold transform cache); two subsequent baseline runs were 219/219 green, and every kill below names a test that targets the mutated behavior. Junction removed with `rmdir` (real `node_modules` intact, 663 entries), worktree removed with `--force` and pruned.

| # | File:line | Description | Killed? |
| - | --------- | ----------- | ------- |
| 19 (re-test) | `src/modules/auth/presentation/register-screen.tsx:100` | `onRetry={retry}`: retry offered for every error | ✅ Killed by `RegisterScreen › shows the banner "Este e-mail já está cadastrado" for a duplicate e-mail` |
| 21 | `src/modules/auth/presentation/use-auth-action.ts:33` | Removed `locked.current = false` in `finally` (lock never released, retry/resubmit dead) | ✅ Killed (4: register/sign-in network retry, hook retry, hook error clear) |
| 22 | `src/modules/auth/presentation/use-auth-action.ts:29` | Error no longer cleared on success (`if (!result.ok) setError(...)`) | ✅ Killed (`useAuthAction › sets error on an error result and clears it on a later success`) |
| 23 | `src/modules/auth/data/map-auth-error.ts:11` | Removed `user_already_exists` mapping (AUTH-03) | ✅ Killed (`maps user_already_exists to conflict with the fixed message`) |
| 24 | `src/modules/auth/domain/auth-schemas.ts:21` | Sign-in password `min(1)` to `min(0)` (empty accepted) | ✅ Killed (3: sign-in screen, schema, use case) |
| 25 | `src/modules/auth/presentation/register-screen.tsx:104` | `loading={pending}` to `loading={false}` (AUTH-01 AC6) | ✅ Killed (`keeps the submit button loading and ignores a second press while pending`) |
| 26 | `src/modules/auth/data/map-auth-error.ts:17` | Offline `TypeError` branch disabled (`if (false)`) | ✅ Killed (`maps a "network request failed" TypeError to network`) |
| 27 | `src/modules/auth/presentation/session-provider.tsx:43` | Cleanup no longer calls `unsubscribe()` | ✅ Killed (`unsubscribes from the repository on unmount`) |
| 28 | `src/modules/auth/presentation/sign-in-screen.tsx:84` | Retry gated on `unauthorized` instead of `network` | ✅ Killed (2: no-retry for non-network, network retry) |

Mutants 1-18 and 20 (iterations 1-2) target behavior unchanged since and were not re-run.

**Sensor depth**: P0 / critical path (auth): 9 manual behavior-level mutations this iteration (1 re-test + 8 new), 29 distinct mutations across all iterations.
**Result**: 9/9 killed, 0 survived - PASS ✅

**Isolation check**: real-tree `git status --porcelain` before = after = `?? docs/FIGMA_SCREENS.md` (user's file, untouched); `git diff` empty; `git worktree list` shows only the main tree.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Fix is a single assertion |
| Surgical changes | ✅ `af5b2de..4e6db17` touches one test file plus `.specs/` |
| No scope creep | ✅ |
| Matches patterns | ✅ Mirrors `sign-in-screen.test.tsx:155` |
| Spec-anchored outcome check | ✅ |
| Per-layer Coverage Expectation | ✅ Register now has positive and negative retry cases, matching sign-in |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines: `docs/PROJECT_CONTEXT.md`, `docs/DESIGN_SYSTEM.md` | ✅ |

**Untested adapter note**: `src/modules/auth/data/supabase-auth-repository.ts` has no unit tests by design (thin adapter, AD-002 manual check; its error paths all route through the tested `mapAuthError`). Not counted as a gap.

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint` (Build gate from tasks.md)
- **Outcome**: `npm test` 34 suites, 219 passed, 0 failed, 0 skipped; `npm run typecheck` exit 0; `npm run lint` exit 0
- **Test count before feature**: 103 (Foundation)
- **Test count after feature**: 219 (iteration 2: 219; one assertion added to an existing test)
- **Delta**: +116; no deletions, no weakened assertions
- **Skipped tests**: none
- **Failures**: none

---

## Interactive UAT

Not performed by the Verifier. Pending the user (tasks.md Manual Verification, AD-002): "Confirm email" off; apply `supabase/migrations/0001_profiles.sql` + `get_advisors`; web walk of the Independent Tests; real Supabase error codes vs `mapAuthError`. All ⏳ manual-pending, not failures.

---

## Fix Plans

None. No blocking gaps.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AUTH-01 | Verified in code; manual pending | ✅ Verified in code; manual check pending |
| AUTH-02 | ✅ Verified | ✅ Verified |
| AUTH-03 | Verified in code; manual pending | ✅ Verified in code; manual check pending |
| AUTH-04 | Verified in code; manual pending | ✅ Verified in code; manual check pending |
| AUTH-05 | Verified in code; manual pending | ✅ Verified in code; manual check pending |
| AUTH-06 | Register negative retry open | ✅ Verified in code; manual check pending |
| AUTH-07 | Verified; "clear it" manual | ✅ Verified in code; "clear it" manual-pending |
| AUTH-08 | ✅ Verified | ✅ Verified |

(spec.md not edited by the Verifier.)

---

## Summary

**Overall**: ✅ Ready (manual Supabase verification still pending with the user)

**Spec-anchored check**: 21/21 AC rows and 3/3 edge cases matched spec outcome; 2 residual non-blocking spec-precision gaps (AUTH-07 AC6 "clear it", AC1 navigation by composition)
**Sensor**: 9/9 mutations killed (mutant 19 re-test + 8 new)
**Gate**: 219 passed, 0 failed, 0 skipped; typecheck and lint exit 0

**What works**: iteration-2 blocker closed; retry lock release, error clearing, `user_already_exists` and offline `TypeError` mapping, empty sign-in password, register loading state, provider unsubscribe and sign-in retry gating are all discriminated by tests.

**Issues found**: none blocking.

**Next steps**: user runs the Manual Verification steps (Confirm email off, migration + advisors, web walk, real error codes).
