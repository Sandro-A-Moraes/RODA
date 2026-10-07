# Circles Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/circles/spec.md`
**Diff range**: `4c6c2e0..HEAD` (HEAD = `c1ddfd1`) for `src/modules/circles`, `app/(app)`, `supabase/migrations`. The SQL itself lives in `4c6c2e0` (`0002_circles_pacts_stories.sql`) and was read as part of the audit.
**Iteration**: 1 of 3
**Verifier**: independent sub-agent (author != verifier, fresh context)

## Validation: circles - PASS (with accepted manual-pending items)

All 8 requirements are implemented and each AC is anchored to a test that asserts the spec-defined outcome. Gate is green (322 tests across 44 suites, typecheck and lint exit 0). The discrimination sensor injected 18 behavior-level faults into a scratch worktree and all 18 were killed. Remaining items are non-blocking: route-level navigation and the real-backend checks (RLS, SQL trigger, concurrent join) have no automated test by design (AD-002, Coverage Matrix).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T12 | Done | `tasks.md` status says "Done, Verifier pending"; this run is that Verifier |
| Manual check on the real backend | Pending user | Spec Success Criteria (two accounts, RLS block) unchecked; AD-002, not counted as failure |

---

## Spec-Anchored Acceptance Criteria

Impl = implementation `file:line`. Tests live in `src/modules/circles/__tests__/`.

### P1: Create a circle (CIR-01, CIR-02)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 valid name: create, creator first member, show code | circle exists, `memberCount` 1, creator listed, code visible | `domain/circle-use-cases.ts:20-29`, `data/in-memory-circle-repository.ts:147-159`, `presentation/members-view.tsx:358-365`, `app/(app)/circles/new.tsx:26-30` | `circle-use-cases.test.ts:25-29` (`name` `toBe('Família')`, `memberCount` `toBe(1)`); `in-memory-circle-repository.test.ts:228-232` (members `toEqual([{u1,Ana}])`); `members-view.test.tsx:437-442` (`getByText('1 de 12 membros')`, label `Código de convite ${code}`); `new-circle-screen.test.tsx:316-324` (`create` called with `'Família'`, `onCreated` once) | PASS. Route hop to `?tab=members` has no test (gap 1) |
| AC4 name <2 or >40 after trim: "Nome deve ter entre 2 e 40 caracteres", not created | exact message, no create | `circle-use-cases.ts:8-14,24-27` | `circle-use-cases.test.ts:32-41` (`'a'`, `' a '`, 41 chars: message `toBe`, `listMine` empty); `:111-120` boundaries 2/40/padded accepted; `:122-136` non-strings, `create` not called; `:138-145`; `new-circle-screen.test.tsx:327-339` (`findByText(nameMessage)`, `create` not called) | PASS |
| AC2 6 chars from alphabet without O, I, L | `^[A-HJKMNP-Z2-9]{6}$`, 31 symbols | `in-memory-circle-repository.ts:84,117-125`; SQL `invite_code ~ '^[A-HJKMNP-Z2-9]{6}$'` check | `circle-use-cases.test.ts:26-28`, `:147-159` (200 codes match regex, 200 distinct); `in-memory-circle-repository.test.ts:243-251` (extremes give `'AAA999'`) | PASS |
| AC3 collision: generate again until unique | second circle gets a different code | `in-memory-circle-repository.ts:123`; SQL loop in `create_circle` (`0002:113`) | `in-memory-circle-repository.test.ts:253-263` (`first` `'AAAAAA'`, `second` `'999999'` with stubbed `Math.random`) | PASS for in-memory; SQL loop manual-pending |

### P1: Join by invite code (CIR-03, CIR-04, CIR-05)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 valid code, <12: add member, navigate to circle | `memberCount` +1; navigation to circle | `circle-use-cases.ts:31-40`, `in-memory-circle-repository.ts:161-180`, `join-circle-screen.tsx:137-143`, `app/(app)/circles/join.tsx:10-12` | `circle-use-cases.test.ts:58`; `in-memory-circle-repository.test.ts:284-285`; `join-circle-screen.test.tsx:190-194` (`onJoined` once with `{name:'Família',memberCount:2}`) | PASS. `router.replace` to `/circles/[id]` has no test (gap 1) |
| AC2 unknown code: "Código não encontrado" | exact text, nothing added | `in-memory-circle-repository.ts:167-169`, `supabase-circle-repository.ts:227-229` | `circle-use-cases.test.ts:76`; `in-memory-circle-repository.test.ts:293-296` (`toEqual({code:'not_found',message})`); `join-circle-screen.test.tsx:235-236`; `map-circle-error.test.ts:420` | PASS |
| AC3 full circle: "Este círculo está cheio", not added | exact text; count stays 12; 12th accepted | `in-memory-circle-repository.ts:175-177`, `supabase-circle-repository.ts:217-219`, SQL `enforce_circle_cap` (`0002:74-91`) | `circle-use-cases.test.ts:91-99`; `in-memory-circle-repository.test.ts:313-331` (12th `memberCount` `toBe(i)`, 13th `toEqual({conflict,'Este círculo está cheio'})`, count `toBe(12)`); `join-circle-screen.test.tsx:266-267`; `map-circle-error.test.ts:415` | PASS |
| AC4 already a member: "Você já faz parte deste círculo", no second membership | exact text, 1 membership | `in-memory-circle-repository.ts:170-174`, `supabase-circle-repository.ts:221-226` | `in-memory-circle-repository.test.ts:306-310` (error `toEqual`, `members` `toHaveLength(1)`); `:344-346` (full circle + member reports already-member first); `join-circle-screen.test.tsx:246-252` (count stays 2); `map-circle-error.test.ts:416-419,438-441` (pkey race) | PASS |
| AC5 lowercase or padded matches as uppercase trimmed | repo receives `ABC234` | `circle-use-cases.ts:16-18,35`, `in-memory-circle-repository.ts:165`, `join-circle-screen.tsx:183-185` | `circle-use-cases.test.ts:163-170` (4 cases `toBe`), `:180` (`join` `toHaveBeenCalledWith('ABC234')`); `join-circle-screen.test.tsx:204`, `:213-215` (input shows `'ABC234'`); `in-memory-circle-repository.test.ts:282` | PASS |
| AC6 empty code: "Informe o código", repo not called | exact text, 0 calls | `circle-use-cases.ts:36-38` | `circle-use-cases.test.ts:67-68` (`message` `toBe`, `join` `not.toHaveBeenCalled()`), `:188`; `join-circle-screen.test.tsx:224-226` | PASS |

### P1: See my circles and members (CIR-06, CIR-07, CIR-08)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| AC1 list only my circles | only member circles | `in-memory-circle-repository.ts:127-135`, `circles-list-screen.tsx:76-101`; RLS `circles_select_member` | `in-memory-circle-repository.test.ts:361-365` (names `toEqual(['Família','Outro grupo'])`); `circles-list-screen.test.tsx:92-96` (`queryByLabelText('Do Beto')` `toBeNull()`, `'2 de 12 membros'`, `'1 de 12 membros'`) | PASS |
| AC2 loading indicator | "Carregando" present then gone | `circles-list-screen.tsx:48-53` | `circles-list-screen.test.tsx:56-59` (`getByLabelText('Carregando')`, then `queryByLabelText` `toBeNull()`) | PASS |
| AC3 empty state with "Criar círculo" and "Entrar com código" | both actions fire | `circles-list-screen.tsx:57-70` | `circles-list-screen.test.tsx:66-77` (`onCreate` and `onJoin` `toHaveBeenCalledTimes(1)`) | PASS |
| AC4 load error: banner with retry | message, retry recovers | `circles-list-screen.tsx:54-56` | `circles-list-screen.test.tsx:131-141` (network text, press "Tentar novamente", list shown, `queryByRole('alert')` `toBeNull()`) | PASS |
| AC5 every member's display name and "N de 12" | names, `N de 12 membros` | `members-view.tsx:366-368,376-406` | `members-view.test.tsx:467-471` (three names, `'3 de 12 membros'`), `:484` (`'12 de 12 membros'`); `in-memory-circle-repository.test.ts:405-408` (order and names) | PASS |
| AC6 non-member gets no circle data or members | `not_found`, nothing rendered | `in-memory-circle-repository.ts:109-115,137-145`; RLS `circle_members_select_member`, `profiles_select_circle_mates` | `in-memory-circle-repository.test.ts:393-394`; `members-view.test.tsx:493-497` (not-found text, `queryByText('Ana Lima')` and code label `toBeNull()`) | PASS in-memory; RLS itself is manual-pending |

### Edge cases

| Edge case | Evidence | Result |
| --------- | -------- | ------ |
| 12th member accepted, circle reported full afterwards | `in-memory-circle-repository.test.ts:316-331`; `members-view.test.tsx:484` | PASS |
| Two users take the last slot simultaneously: one accepted, other "Este círculo está cheio" | SQL only (`enforce_circle_cap` takes `for update` on the circle row before counting, `0002:81-83`); `map-circle-error.test.ts:415` covers the mapping. No automated concurrency test possible against in-memory | Manual-pending (gap 2) |

### Spec-precision gaps

- Join AC1 "navigate to that circle" and Create AC1 "show its invite code" do not say which route or tab. The code delivers `/circles/[id]` and `?tab=members`; tests assert the screen callbacks only.
- Edge case "simultaneously" has no outcome measurable below the real backend.
- List AC3 and AC4 do not state exact texts for the empty state body or the banner; tests assert the actions and Foundation error text, which is the available precision.

---

## Gate Check (Build level)

| Command | Result |
| ------- | ------ |
| `npm test` | 44 suites, 322 tests passed, 0 failed, 0 skipped |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |

Circles suites alone: 88 tests. No weakened assertions seen.

---

## Discrimination Sensor

Scratch: temporary `git worktree` at HEAD with `node_modules` junctioned. Each fault applied, `npx jest src/modules/circles` run, file restored. Worktree and junction removed; real tree `git status --porcelain` was empty before and after (identical baseline); `node_modules` intact.

| # | Fault | Failing tests | Result |
| - | ----- | ------------- | ------ |
| 1 | `MAX_CIRCLE_MEMBERS` 12 to 13 | 6 | Killed |
| 2 | cap check `>=` to `>` | 3 | Killed |
| 3 | `normalizeInviteCode` drops `toUpperCase` | 3 | Killed |
| 4 | `normalizeInviteCode` drops `trim` | 4 | Killed |
| 5 | empty-code guard disabled | 3 | Killed |
| 6 | name min 2 to 1 | 3 | Killed |
| 7 | name max 40 to 41 | 3 | Killed |
| 8 | name `.trim()` removed | 7 | Killed |
| 9 | duplicate-member check disabled | 4 | Killed |
| 10 | full-circle message changed (in-memory) | 3 | Killed |
| 11 | alphabet gains `O` | 3 | Killed |
| 12 | code collision check removed | 1 | Killed |
| 13 | in-memory join stops normalizing the code | 1 | Killed |
| 14 | `findMine` ignores membership (visibility leak) | 2 | Killed |
| 15 | `listMine` stops filtering by membership | 3 | Killed |
| 16 | `mapCircleError` full message changed | 1 | Killed |
| 17 | `mapCircleError` drops the `circle_members_pkey` race | 1 | Killed |
| 18 | "Código não encontrado" message changed (in-memory) | 3 | Killed |

18 of 18 killed, 0 survived.

---

## Code Quality Check

| Check | Pass? |
| ----- | ----- |
| No features beyond what was asked (share/copy added in T10 serves the Create goal "share its invite code") | Yes |
| Only required files touched; matches module layering (AD-001..AD-003) | Yes |
| Tests map to ACs or listed edge cases; no unclaimed tests (the "goes back from the header" tests are Done-when UI behavior) | Yes |
| No hardcoded hex colors in circles code (theme roles used) | Yes |
| Spec-anchored outcome check: exact messages asserted | Yes |
| Project guidelines followed (Coverage Matrix in `tasks.md`, `docs/PROJECT_CONTEXT.md`) | Yes |

---

## Ranked Gaps (none blocking)

1. Route files `app/(app)/circles/new.tsx:26-30` and `join.tsx:10-12` (navigation target and `tab=members`) have no automated test; only screen callbacks are asserted. Accepted by the Coverage Matrix ("route behavior checked manually"). Manual check required.
2. Concurrent last-slot join and RLS isolation (Success Criteria in `spec.md`) are enforced in SQL and unverified by automated tests; need the two-account manual run on project RODA.
3. `SupabaseCircleRepository` queries (`select` embedding `circle_members(count)`, `profiles(display_name)` join, `displayName` fallback) are untested by design (AD-002); verify in the manual run, in particular that RLS `profiles_select_circle_mates` returns names for fellow members.
4. Minor: `tasks.md` still says "Verifier pending" and `spec.md` traceability says "Verifier run ... pending"; update when closing the feature.

## Lessons

No grounded failures found (no surviving mutant, no failing gate); no lessons distilled.
