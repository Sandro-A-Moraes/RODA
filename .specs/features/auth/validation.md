# Auth Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/auth/spec.md` (AUTH-08 AC4 clarified since iteration 1)
**Diff range**: `3a62017..HEAD` (HEAD = `af5b2de`). Iteration 1 covered `3a62017..ff65baf` (T1-T24); this run re-checks the whole range and focuses on the fix range `ff65baf..af5b2de` (`8bab607`, `1b8c245`, `18667e6`, `af5b2de`)
**Iteration**: 2 of 3
**Verifier**: independent sub-agent (author ≠ verifier, fresh context, not the iteration-1 Verifier's notes as truth)

## Validation: auth - FAIL ❌

Both iteration-1 surviving mutants (11, 12) are now killed, AUTH-08 AC4 matches the clarified spec, and the gate is green (219 tests). The verdict stays FAIL on one new surviving mutant: the register screen offers "Tentar novamente" for every error, not only `network` (mutant 19). Design requires retry only for `network` (design.md:119), the sign-in screen pins this (`sign-in-screen.test.tsx:148-156`), but no register test does. The iteration-1 Fix 1 asked for exactly this negative assertion and it was not added. It is a one-test fix; no production defect was found in the code itself.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T24 | ✅ Done | Unchanged since iteration 1 |
| Fix 1 (register network retry) | ⚠️ Partial | `8bab607` adds the positive case (`register-screen.test.tsx:138-164`); the requested "no Tentar novamente on the duplicate e-mail banner" assertion is missing (mutant 19 survives) |
| Fix 2 (event before restore) | ✅ Done | `1b8c245`, `session-provider.test.tsx:99-116` |
| Fix 3 (AUTH-08 AC4 decision) | ✅ Done | Option (a): spec.md:90 amended; `18667e6` adds `root-navigator.test.tsx:106` |
| `af5b2de` comment-only refactor | ✅ | `app/(auth)/register.tsx:5-6` drops the SPEC_DEVIATION marker; design.md:128 now describes `dismissTo`, so the deviation is resolved, not hidden |
| Manual Verification (T25) | ⏳ Pending user | AD-002; not counted as a failure |

---

## Spec-Anchored Acceptance Criteria

Re-derived from spec.md. Test files outside the fix range are byte-identical to iteration 1, so those citations were re-checked against the current files and still hold.

### P1: Register (AUTH-01, AUTH-02, AUTH-03)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 valid submit: create account, start session, navigate to main area | account; `signedIn`; `/` | `src/modules/auth/__tests__/register-screen.test.tsx:59` `findByText('signedIn')`, `:60` `toHaveBeenCalledTimes(1)`, `:61-65` `toHaveBeenCalledWith({displayName:'Ana Lima',email:'ana@mail.com',password:'12345678'})`; navigation: `tooling/__tests__/root-navigator.test.tsx:117-118` signed-in on `/register` gives `getPathname()` `toBe('/')` | ✅ PASS (navigation by composition, see gap 2) |
| AC2 invalid e-mail: "E-mail inválido" on e-mail field, repo not called | exact text, field, 0 calls | `register-screen.test.tsx:69,82` `findByText('E-mail inválido')`, `:83-85` `accessibilityHint` `toBe(message)`, `:87-91` other fields `undefined`, `:92` `toHaveBeenCalledTimes(0)`; `auth-schemas.test.ts:29-31` | ✅ PASS |
| AC3 password < 8: exact message on password field, not called | exact text; 7 rejected, 8 accepted | `register-screen.test.tsx:70,82-92`; `auth-schemas.test.ts:35-37`, `:41` `toEqual([])` | ✅ PASS |
| AC4 name < 2 or > 40 after trim: exact message on name field | bounds 1/41 rejected, 2/40 accepted | `register-screen.test.tsx:71,82-91`; `auth-schemas.test.ts:48-50` (1 and 41 chars), `:57` (2 and 40), `:67-69` `' A '` rejected | ✅ PASS (mutant 16 killed) |
| AC5 duplicate e-mail: banner "Este e-mail já está cadastrado" | exact banner text | `register-screen.test.tsx:109-112` `findByText('Este e-mail já está cadastrado')`, status `signedOut`; `map-auth-error.test.ts:24-32` `toEqual({code:'conflict',message:'Este e-mail já está cadastrado'})` | ✅ PASS (real Supabase codes manual-pending) |
| AC6 pending: button loading, ignores presses | busy/disabled; 1 call | `register-screen.test.tsx:125-128` `toMatchObject({busy:true,disabled:true})`, `:132` `toHaveBeenCalledTimes(1)`, `:133-135` `busy:false` | ✅ PASS |

### P1: Sign in and out (AUTH-04, AUTH-05, AUTH-06)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 correct credentials: session, main area | `signedIn`; `/` | `src/modules/auth/__tests__/sign-in-screen.test.tsx:89` `findByText('signedIn')`, `:90-94` one call with normalized `{email:'ana@mail.com',password:'12345678'}`; `root-navigator.test.tsx:117-118` for `/sign-in` | ✅ PASS (by composition, gap 2) |
| AC2 wrong credentials: banner "E-mail ou senha incorretos" | exact text in alert banner | `sign-in-screen.test.tsx:103-105`; `map-auth-error.test.ts:17-21` | ✅ PASS |
| AC3 empty field: "Campo obrigatório" per field, not called | text per field; 0 calls | `sign-in-screen.test.tsx:115-122`; `auth-schemas.test.ts:88-96` | ✅ PASS |
| AC4 no connectivity: Foundation `network` message + "Tentar novamente" | `createAppError('network').message` + retry | `sign-in-screen.test.tsx:134-137` message and retry inside the banner, `:138-145` retry re-calls with same payload (`toHaveBeenCalledTimes(2)`); `:148-156` no retry for non-network; register parity: `register-screen.test.tsx:152-163` | ✅ PASS (mutant 11 killed; register negative case missing, mutant 19) |
| AC5 "Sair": end session, navigate to sign-in | `signedOut`; `/sign-in` | `home-screen.test.tsx:49-50` `findByText('signedOut')`, `signOut` `toHaveBeenCalledTimes(1)`; `root-navigator.test.tsx:144-146` `getPathname()` `toBe('/sign-in')`, protected content `toBeNull()` | ✅ PASS (mutant 17 killed) |
| AC6 no raw backend text | never rendered | `map-auth-error.test.ts:65-80` `not.toContain(RAW)` per branch; `sign-in-screen.test.tsx:182-185` whole tree `not.toContain(RAW)` | ✅ PASS (path trace from iteration 1 re-checked: no fix commit touches production error paths) |

### P1: Session restore and route protection (AUTH-07, AUTH-08)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 valid stored session: main area, sign-in never shown | `/`; sign-in not rendered | `root-navigator.test.tsx:129-131` `getPathname()` `toBe('/')`, `signInRendered` `not.toHaveBeenCalled()` | ✅ PASS |
| AC2 no stored session: sign-in | `/sign-in` | `root-navigator.test.tsx:75-78` | ✅ PASS (mutant 20 killed) |
| AC3 restoring: indicator, no protected content | "Carregando"; nothing protected | `root-navigator.test.tsx:61-65` `getByLabelText('Carregando')`, protected and sign-in `toBeNull()`, render spies not called; `session-provider.test.tsx:52` `toBe('loading:none')` | ✅ PASS (mutant 18 killed) |
| AC4a signed-out user opens protected route by URL: redirect to sign-in | `/sign-in` | `root-navigator.test.tsx:88-90` `/(app)` lands on `getPathname()` `toBe('/sign-in')`, `mainRendered` not called | ✅ PASS (mutant 20 killed) |
| AC4b signed-out user navigates in-app: stay on current screen, no protected content | stays `/register`; nothing protected | `root-navigator.test.tsx:101-107` `router.navigate('/')` then `queryByText('protected content')` `toBeNull()`, `getPathname()` `toBe('/register')`, `mainRendered` `not.toHaveBeenCalled()` | ✅ PASS (now exactly the spec outcome; iteration-1 gap closed) |
| AC5 signed-in user on sign-in/register: redirect to main area | `/` | `root-navigator.test.tsx:110-122` both URLs `getPathname()` `toBe('/')`, auth content `toBeNull()` | ✅ PASS |
| AC6 expired/invalid session: clear it and show sign-in | cleared; sign-in | "show sign-in": `session-use-cases.test.ts:47,56` `toBeNull()`; `session-provider.test.tsx:80` `signedOut:none`; signedOut renders sign-in (`root-navigator.test.tsx:75-76`). "clear it": delegated to supabase-js | ✅ PASS for "show sign-in"; "clear it" manual-pending (gap 1) |

### Edge Cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| Sign-in submitted twice quickly: one call | `sign-in-screen.test.tsx:168-172` `toHaveBeenCalledTimes(1)`; `use-auth-action.test.tsx:39-46` | ✅ PASS |
| Whitespace-only name treated as shorter than 2 | `auth-schemas.test.ts:61-63` | ✅ PASS |
| E-mail trimmed and lowercased | `register-screen.test.tsx:61-65,159-163`; `sign-in-screen.test.tsx:91-94`; `auth-schemas.test.ts:82,110` | ✅ PASS |

**Payload/conjunction rule**: repository calls assert normalized payloads (`toHaveBeenCalledWith` / `toHaveBeenNthCalledWith`), including the new register retry (`register-screen.test.tsx:159-163`). Conjunctive ACs were split; each half has evidence except AUTH-07 AC6 "clear it".

**Status**: ✅ All 21 AC rows (AUTH-08 AC4 split in two) and 3 edge cases have evidence matching the spec outcome; ⚠️ 2 residual spec-precision gaps, both acceptable (manual-pending / combined evidence).

### Spec-precision gaps (residual, non-blocking)

1. **AUTH-07 AC6 "clear it"**: the app maps restore failure to signed out; clearing storage is left to supabase-js `getSession`. Not testable without the real backend; manual-pending (AD-002).
2. **Register AC1 / Sign-in AC1 "navigate to the main area"**: proven by composition (screen tests reach `signedIn`; navigator tests send a signed-in user on auth routes to `/`). No single test drives a submit through the router. Low risk; same guard that mutants 5, 6 and 20 show is discriminating.

AUTH-08 AC4 (iteration-1 gap 1) is **closed**: the spec now names both cases and the test asserts both outcomes.

---

## Discrimination Sensor

Isolated scratch: `git worktree add --detach <session scratchpad>/wt HEAD` (outside the repo), `node_modules` as an NTFS junction to the real one. Each mutant applied with an exact-substring `perl` replace (changed line confirmed in `git diff`), full suite run (`npx jest src tooling`, 219 tests; scratch baseline green), reverted with `git checkout -- <file>` and scratch `git status --porcelain` confirmed empty after each. Junction removed with `rmdir` (real `node_modules` intact), worktree removed with `--force` and pruned.

| # | File:line | Description | Killed? |
| - | --------- | ----------- | ------- |
| 11 (re-test) | `src/modules/auth/presentation/register-screen.tsx:100` | `onRetry={undefined}` (register retry removed) | ✅ Killed by `RegisterScreen › shows the network banner with "Tentar novamente" that calls signUp again` |
| 12 (re-test) | `src/modules/auth/presentation/session-provider.tsx:39` | `if (active && !eventSeen)` to `if (active)` | ✅ Killed by `SessionProvider › keeps an auth event that arrives before the restore resolves` |
| 16 | `src/modules/auth/domain/auth-schemas.ts:14` | Display-name upper bound `max(40)` to `max(400)` | ✅ Killed (`rejects a name of 41 chars`) |
| 17 | `src/modules/auth/presentation/session-provider.tsx:35` | Subscriber ignores `null` events (sign-out never reaches the session, so "Sair" does not navigate) | ✅ Killed (3 tests: HomeScreen sign-out, navigator sign-out to `/sign-in`, provider follow) |
| 18 | `src/modules/auth/presentation/root-navigator.tsx:14` | Loading branch disabled (`if (false)`) | ✅ Killed (`shows only the loading indicator while the session restores`) |
| 19 | `src/modules/auth/presentation/register-screen.tsx:100` | `onRetry={retry}`: retry offered for every error (e.g. duplicate e-mail) | ❌ Survived (219/219 pass) - design.md:119 "onRetry only for network"; no register test asserts its absence |
| 20 | `src/modules/auth/presentation/root-navigator.tsx:35` | AUTH-08 guard `status === 'signedIn'` to `status !== 'loading'` | ✅ Killed (5 tests incl. URL redirect, in-app stay-put, root layout) |

Iteration-1 mutants 1-10 and 13-15 target files untouched by the fix range and were not re-run.

**Sensor depth**: P0 / critical path (auth): 7 manual behavior-level mutations this iteration (2 re-tests + 5 new), on top of 15 in iteration 1.
**Result**: 6/7 killed, 1 survived - FAIL ❌

**Isolation check**: real-tree `git status --porcelain` before = after = `?? docs/FIGMA_SCREENS.md` (user's file, untouched); `git diff` empty; `git worktree list` shows only the main tree.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Fix range is tests + one comment + spec/design text |
| Surgical changes | ✅ `ff65baf..af5b2de` touches only the three test files, `app/(auth)/register.tsx` comment, spec.md:90, design.md:128 and lessons files |
| No scope creep | ✅ |
| Matches patterns | ✅ New tests mirror the sign-in retry test and the existing deferred-promise provider test |
| Spec-anchored outcome check | ✅ AUTH-08 AC4 assertion now equals the spec text |
| Per-layer Coverage Expectation | ⚠️ Register presentation lacks the "no retry for non-network error" case that sign-in has (mutant 19) |
| Every test maps to a spec requirement | ✅ New tests map to AUTH-06 AC4 (register parity, design.md:119/162), AUTH-07 provider ordering (design guard), AUTH-08 AC4b |
| Documented guidelines: `docs/PROJECT_CONTEXT.md`, `docs/DESIGN_SYSTEM.md` | ✅ |

**SPEC_DEVIATION review**: the `app/(auth)/register.tsx` marker was removed in `af5b2de` because design.md:128 now documents `router.dismissTo('/sign-in')`; behavior still tested at `tooling/__tests__/register-route.test.tsx:41-42,55-57`. Resolved legitimately.

---

## Gate Check

- **Gate command**: `npm test && npm run typecheck && npm run lint` (Build gate from tasks.md)
- **Outcome**: `npm test` 34 suites, 219 passed, 0 failed, 0 skipped; `npm run typecheck` exit 0; `npm run lint` exit 0
- **Test count before feature**: 103 (Foundation)
- **Test count after feature**: 219 (iteration 1: 217)
- **Delta**: +116 (+2 since iteration 1; no deletions, no weakened assertions in the fix range)
- **Skipped tests**: none (no `.skip`/`.only`/`.todo`/`xit`/`xdescribe` in `src`, `tooling`, `app`)
- **Failures**: none

---

## Interactive UAT

Not performed by the Verifier. Pending the user (tasks.md Manual Verification, AD-002): "Confirm email" off; apply `supabase/migrations/0001_profiles.sql` + `get_advisors`; web walk of the Independent Tests; real Supabase error codes vs `mapAuthError`. All ⏳ manual-pending, not failures.

---

## Fix Plans

### Fix 1: Register shows "Tentar novamente" for non-network errors undetected (mutant 19)

- **Root cause**: `register-screen.test.tsx` has no negative retry assertion; sign-in has one (`sign-in-screen.test.tsx:148-156`).
- **Fix task**: In `src/modules/auth/__tests__/register-screen.test.tsx`, in the duplicate e-mail test (`:96-113`) or a new sibling, after `findByText('Este e-mail já está cadastrado')` add `expect(screen.queryByText('Tentar novamente')).toBeNull()`. Done when mutant 19 (`register-screen.tsx:100` `onRetry={retry}`) is killed.
- **Priority**: Minor (UX: a retry that can only fail again; design-required, test-only fix)

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AUTH-01 | Verified in code; Fix 1 open | Verified in code; manual check pending |
| AUTH-02 | ✅ Verified | ✅ Verified |
| AUTH-03 | Verified in code; manual pending | Verified in code; manual check pending |
| AUTH-04 | Verified in code; manual pending | Verified in code; manual check pending |
| AUTH-05 | Verified in code; manual pending | Verified in code; manual check pending |
| AUTH-06 | Verified in code; manual pending | ⚠️ Verified for sign-in; register retry negative case open (Fix 1) |
| AUTH-07 | Fix 2 open | Verified in code; "clear it" manual-pending |
| AUTH-08 | AC4 in-app needs decision | ✅ Verified (both AC4 cases) |

(spec.md not edited by the Verifier.)

---

## Summary

**Overall**: ❌ Not Ready (one test-only gap)

**Spec-anchored check**: 21/21 AC rows and 3/3 edge cases matched the spec outcome; 2 residual spec-precision gaps (AUTH-07 AC6 "clear it" manual-pending; AC1 navigation by composition), both non-blocking
**Sensor**: 7 mutations, 6 killed, 1 survived (mutant 19)
**Gate**: 219 passed, 0 failed, 0 skipped; typecheck and lint exit 0

**What works**: all iteration-1 gaps closed (mutants 11 and 12 killed, AUTH-08 AC4 spec and test aligned, SPEC_DEVIATION resolved in design.md); new mutants on name bounds, sign-out propagation, loading gate and the protected guard are all killed.

**Issues found**: Fix 1 (one negative assertion on the register banner).

**Next steps**: Route Fix 1 to an implementer, then re-verify (iteration 3 of 3, the last before escalation). The user runs the Manual Verification steps.
