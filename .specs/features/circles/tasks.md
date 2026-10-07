# Circles Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline in this file (see "Design note"); no separate `design.md`.
**Status**: Done, Verifier PASS (retroactive: the code of T1-T2 and most of T3-T9 was written before Specify/Design/Tasks; this plan brings it to spec-driven completeness)

---

## Design note

Circles follows AD-001..AD-003: `domain/` (repository contract, `createCircle`/`joinCircle` use cases, Zod name schema), `data/` (`InMemoryCircleRepository` for tests, `SupabaseCircleRepository` for production), `presentation/` (four screens/views plus the circle shell). All writes go through two `security definer` RPCs, `create_circle` and `join_circle`; the tables have no insert policy, so a client cannot bypass the rules. Reads rely on RLS (`is_circle_member`), so a non-member gets zero rows (CIR-08).

| Concern | Where it is enforced |
| ------- | -------------------- |
| Name 2-40 after trim | Zod schema (UI message) and `check` constraint plus `btrim` in `create_circle` |
| Code alphabet and length | `create_circle` generator, `invite_code ~ '^[A-HJKMNP-Z2-9]{6}$'` check, in-memory generator |
| Code collision | `create_circle` loops until `not exists`; `unique` index is the backstop |
| Case-insensitive, trimmed match | `normalizeInviteCode` in the use case and `upper(btrim())` in `join_circle` |
| Empty code | Use case returns "Informe o código" before the repository is called |
| Duplicate membership | `join_circle` check, `circle_members` primary key (circle_id, user_id) as backstop |
| 12-member cap under concurrency | `circle_members_cap` before-insert trigger takes `for update` on the circle row, then counts; concurrent joins serialize on that lock |
| Visibility | `circles_select_member`, `circle_members_select_member`, `profiles_select_circle_mates` policies |
| Backend errors to Portuguese | `mapCircleError` (SQL codes `circle_full`, `already_member`, `not_found`, `unauthorized`, plus the `circle_members_pkey` race) |

Navigation: the list opens `/circles/[id]`; after creating, the route opens the **Membros** tab (`?tab=members`) so the creator sees the invite code first (CIR-01 AC 1). The members tab shows the invite card ("N de 12"), share and copy actions (`react-native` `Share` and `expo-clipboard`, both Expo Go compatible, AD-004) and the member rows (Figma frame 10).

### Audit result (spec.md vs. code, at the start of the retro-fit)

| AC | Result |
| -- | ------ |
| Create AC1, AC4; Join AC1-AC6; List AC1-AC4; Members AC5; RLS AC6 | Implemented as specified |
| Create AC1 "show its invite code" | Gap: creator landed on the Pactos tab. Fixed in T11 |
| Create AC4 non-string input | Bug: Zod returned an English message. Fixed in T3 |
| Concurrent double join by the same user | Gap: primary-key violation surfaced as a generic error. Fixed in T5 |
| Invite code could not be shared or copied | Gap. Added in T10 |
| Spec assumption "29^6" code space | Wrong figure: the alphabet has 31 symbols (23 letters + 8 digits), so 31^6. Corrected in spec.md (T12) |
| SQL (0002, circles part) | No change needed. Observations: the `create_circle` collision check and insert are not atomic, so a simultaneous identical code would raise a unique violation (probability about 1 in 887 million per pair, ignored); join has no rate limit on code guesses (out of scope) |

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/PROJECT_CONTEXT.md` (TDD, test layers, real Supabase backend validated manually), `docs/DESIGN_SYSTEM.md`, `.specs/features/auth/tasks.md` (matrix and gates), `jest.config.js`, `CLAUDE.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain: schema and use cases | unit (against `InMemoryCircleRepository`) | All branches; 1:1 to spec ACs; boundaries (2/40 characters, trim); repository not called on invalid input | `src/modules/circles/__tests__/*.test.ts` | `npm test` |
| Data: in-memory repository | unit | Every rule the SQL enforces: cap of 12, duplicate join, code matching, visibility, collision retry | `src/modules/circles/__tests__/*.test.ts` | `npm test` |
| Data: Supabase error mapper | unit | Each SQL code, the pkey race, fallback without backend text | `src/modules/circles/__tests__/*.test.ts` | `npm test` |
| Data: `SupabaseCircleRepository` queries | none (AD-002: real backend validated manually) | - (build gate; manual check in the Verifier run) | - | build gate |
| Presentation: screens and views | unit (React Native Testing Library) | Render + type + press + state per AC: loading, empty, error and retry, each message, no repository call on invalid input | `src/modules/circles/__tests__/*.test.tsx` | `npm test` |
| Presentation: pure helpers | unit | Every accepted value and the fallback | `src/modules/circles/__tests__/*.test.ts` | `npm test` |
| Route files (`app/`), contracts, barrel, SQL migration, docs | none | - (build gate; route behavior checked manually) | - | build gate |

## Gate Check Commands

> Generated from `package.json` scripts - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks that add or change code with types | `npm test && npm run typecheck` |
| Build | After wiring, docs or config tasks, and the last task of each phase | `npm test && npm run typecheck && npm run lint` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend and contract (already committed)

```
T1 → T2
```

### Phase 2: Domain and data

```
T2 → T3 → T4 → T5
```

### Phase 3: Presentation

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 4: Routes and documentation

```
T10 → T11 → T12
```

---

## Task Breakdown

### T1: Circles schema, RLS, cap trigger and RPCs

**What**: `circles` and `circle_members` tables, RLS select policies, membership helper functions, the `enforce_circle_cap` trigger and the `create_circle` / `join_circle` RPCs (circles part of the shared migration). Already applied to project RODA.
**Where**: `supabase/migrations/0002_circles_pacts_stories.sql`
**Depends on**: None
**Reuses**: `0001_profiles.sql` (`profiles`)
**Requirement**: CIR-01, CIR-02, CIR-03, CIR-04, CIR-05, CIR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] RLS enabled on both tables; no insert/update/delete policy (writes only through the RPCs)
- [x] Functions use `set search_path = ''` and `(select auth.uid())`; execute revoked from `public`/`anon`
- [x] Cap trigger locks the circle row before counting (concurrent joins serialize)
- [x] Audited against spec.md with no change needed (see Audit result)

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: `4c6c2e0` (`feat(db): version circles, pacts and stories migration`)

---

### T2: Circle repository contract

**What**: `Circle`, `Member`, `CircleRepository`, `MAX_CIRCLE_MEMBERS` and `circleRepositoryToken`.
**Where**: `src/modules/circles/domain/circle-repository.ts`
**Depends on**: T1
**Reuses**: `Result` from `@/core/errors`, `createToken` from `@/core/di`
**Requirement**: CIR-01, CIR-03, CIR-06, CIR-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Interface exposes `listMine`, `get`, `members`, `create`, `join`
- [x] `npm run typecheck` passes

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: `3ee4031` (`feat(circles,pacts): add domain, data and presentation layers`)

---

### T3: Create and join use cases

**What**: Make `createCircle` and `joinCircle` fully spec-conformant and covered: name bounds 2/40 after trim, Portuguese message for any non-name input (fix: Zod's English message leaked for non-strings), code normalization, empty code never reaches the repository.
**Where**: `src/modules/circles/domain/circle-use-cases.ts`
**Depends on**: T2
**Reuses**: `InMemoryCircleRepository`, `createAppError`
**Requirement**: CIR-01, CIR-02, CIR-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: boundary names (2 and 40 characters, padded), rejected names and non-strings with "Nome deve ter entre 2 e 40 caracteres" and `create` not called, code alphabet over 200 circles, `normalizeInviteCode` cases, repository receives the normalized code, empty code gives "Informe o código" without `join`
- [x] Gate check passes: `npm test && npm run typecheck`
- [x] Test count: 26 tests pass in `circle-use-cases.test.ts` (10 before)

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `f086248` (`fix(circles): show the name rule for non-string input and cover use cases`)

---

### T4: In-memory repository behavior

**What**: Cover `InMemoryCircleRepository` so it provably mirrors the SQL rules: creator as first member, code alphabet and collision retry, join matching, duplicate join, 12 cap (12th accepted, 13th rejected, count stays 12), visibility of list/get/members, unauthorized without a user.
**Where**: `src/modules/circles/data/in-memory-circle-repository.ts`
**Depends on**: T3
**Reuses**: `circle-repository.ts` contract
**Requirement**: CIR-02, CIR-03, CIR-04, CIR-05, CIR-06, CIR-07, CIR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first (see Coverage Expectation), including collision retry with a stubbed `Math.random`
- [x] Non-members get `not_found` for `get` and `members`; `listMine` returns only own circles
- [x] Gate check passes: `npm test`
- [x] Test count: 15 tests pass in `in-memory-circle-repository.test.ts`

**Tests**: unit
**Gate**: quick
**Status**: Done
**Commit**: `7bfedea` (`test(circles): cover in-memory repository cap, duplicates and visibility`)

---

### T5: Supabase error mapper

**What**: Test `mapCircleError` for every SQL code and the fallback, and map the `circle_members_pkey` unique violation (two simultaneous joins by one user) to "Você já faz parte deste círculo".
**Where**: `src/modules/circles/data/supabase-circle-repository.ts`
**Depends on**: T4
**Reuses**: `mapError`, `createAppError`
**Requirement**: CIR-04, CIR-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: `circle_full`, `already_member`, `not_found`, `unauthorized`, pkey race, unknown error without backend text, network failure
- [x] Gate check passes: `npm test && npm run typecheck`
- [x] Test count: 7 tests pass in `map-circle-error.test.ts`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `11ec04d` (`fix(circles): map the duplicate membership race to the already-member message`)

---

### T6: New circle screen

**What**: Test `NewCircleScreen`: trimmed name reaches the repository, invalid names show the rule and create nothing, repository failure shows an alert, pending request blocks a second create.
**Where**: `src/modules/circles/presentation/new-circle-screen.tsx`
**Depends on**: T5
**Reuses**: `TextField`, `Button`, `useAsyncAction`
**Requirement**: CIR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: success (name trimmed, code format, count 1), empty / 1 character / 41 characters show "Nome deve ter entre 2 e 40 caracteres" and `create` is not called, network failure message, single create while pending, back
- [x] Gate check passes: `npm test && npm run typecheck`
- [x] Test count: 7 tests pass in `new-circle-screen.test.tsx`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `1bb936a` (`test(circles): cover the new circle screen`)

---

### T7: Join circle screen

**What**: Test `JoinCircleScreen` for every Join AC: success, lowercase and padded code, empty code, unknown code, already a member, full circle.
**Where**: `src/modules/circles/presentation/join-circle-screen.tsx`
**Depends on**: T6
**Reuses**: `Button`, `useAsyncAction`
**Requirement**: CIR-03, CIR-04, CIR-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: one test per Join AC (messages "Código não encontrado", "Este círculo está cheio", "Você já faz parte deste círculo", "Informe o código" with `join` not called); input shows upper case capped at 6
- [x] Gate check passes: `npm test && npm run typecheck`
- [x] Test count: 8 tests pass in `join-circle-screen.test.tsx`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `df58a05` (`test(circles): cover the join circle screen`)

---

### T8: Circles list screen

**What**: Test `CirclesListScreen`: loading indicator, empty state with both actions, only own circles with "N de 12 membros", opening a circle, error banner with working retry.
**Where**: `src/modules/circles/presentation/circles-list-screen.tsx`
**Depends on**: T7
**Reuses**: `useLoad`, `EmptyState`, `ErrorBanner`
**Requirement**: CIR-06, CIR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: one test per List AC; `expo-router` `useFocusEffect` mocked as a mount effect
- [x] Gate check passes: `npm test && npm run typecheck`
- [x] Test count: 6 tests pass in `circles-list-screen.test.tsx`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `44e6537` (`test(circles): cover the circles list screen states`)

---

### T9: Members view

**What**: Test `MembersView`: invite code card, every member by display name with "Você" on the current user, "N de 12 membros" (1, 3 and 12), a non-member sees only the not-found banner and no data, loading, error with retry.
**Where**: `src/modules/circles/presentation/members-view.tsx`
**Depends on**: T8
**Reuses**: `Avatar`, `Ring`, `ErrorBanner`
**Requirement**: CIR-07, CIR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: one test per Members AC and the RLS AC (via the in-memory repository's visibility)
- [x] Gate check passes: `npm test && npm run typecheck`
- [x] Test count: 6 tests pass in `members-view.test.tsx` (7 after T10 adds the share/copy presence check)

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `1c0fef3` (`test(circles): cover the members view`)

---

### T10: Share and copy the invite code

**What**: Add `InviteCodeActions` ("Compartilhar" via `Share.share`, "Copiar código" via `expo-clipboard`, both with Portuguese feedback and failure messages) and render it under the invite card in `MembersView`. Adds the Expo-managed dependency `expo-clipboard` (AD-004).
**Where**: `src/modules/circles/presentation/invite-code-actions.tsx`
**Depends on**: T9
**Reuses**: `Button`, `Text`, theme roles (no hex colors)
**Requirement**: CIR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: copy puts only the code on the clipboard and confirms; share message names the circle and carries the code; copy failure and share failure show a message
- [x] `expo-clipboard` installed with `npx expo install` (version pinned by Expo)
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: 4 tests pass in `invite-code-actions.test.tsx`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: `5a6dbce` (`feat(circles): share and copy the invite code`)

---

### T11: Open the members tab after creating

**What**: `parseCircleTab` (pure) turns the `tab` route param into a `CircleTab` with a safe default; the circle route uses it as the initial tab and `circles/new` navigates with `tab: 'members'`, so the creator sees the invite code right after creation.
**Where**: `src/modules/circles/presentation/circle-tab.ts`
**Depends on**: T10
**Reuses**: `CircleShell` tab keys
**Requirement**: CIR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: the four known tabs are kept; undefined, empty, wrong case and unknown values fall back to `pacts`
- [x] Route files updated; `CircleTab` type moved to `circle-tab.ts` and still exported from the module barrel
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`
- [x] Test count: 8 tests pass in `circle-tab.test.ts`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: `0791656` (`feat(circles): open the members tab after creating a circle`)

---

### T12: Traceability and handoff

**What**: Correct the code-space figure in spec.md, map CIR-01..CIR-08 to tasks and tests in the traceability table, and update the Handoff in STATE.md.
**Where**: `.specs/features/circles/spec.md`
**Depends on**: T11
**Reuses**: Traceability table format from `auth/spec.md`
**Requirement**: CIR-01, CIR-02, CIR-03, CIR-04, CIR-05, CIR-06, CIR-07, CIR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Every requirement lists its tasks; status is "Implemented" (Verifier PASS)
- [x] `validate_tasks.py` exits 0 on this file
- [x] Handoff in `.specs/STATE.md` states the current step

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: `docs(circles): map requirements to tasks and update the handoff` (this commit)

---

## Validation tables

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (phase start) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | SQL migration | none | none | ✅ OK |
| T2 | Contract | none | none | ✅ OK |
| T3 | Domain use cases | unit | unit | ✅ OK |
| T4 | In-memory repository | unit | unit | ✅ OK |
| T5 | Supabase error mapper | unit | unit | ✅ OK |
| T6 | Screen | unit | unit | ✅ OK |
| T7 | Screen | unit | unit | ✅ OK |
| T8 | Screen | unit | unit | ✅ OK |
| T9 | View | unit | unit | ✅ OK |
| T10 | Component + dependency | unit | unit | ✅ OK |
| T11 | Pure helper + route files | unit | unit | ✅ OK |
| T12 | Docs | none | none | ✅ OK |
