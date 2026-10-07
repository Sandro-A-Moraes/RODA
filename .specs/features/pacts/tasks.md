# Pacts Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline in this file (see "Design note"); no separate `design.md`.
**Status**: In progress (retroactive: the code of T1-T2 and the UI was written before Specify/Design/Tasks; this plan brings it to spec-driven completeness). T1-T7 are the non-UI half; T-UI-* belong to the presentation work.

---

## Design note

Pacts follows AD-001..AD-003: `domain/` (repository contract, `createPact`/`updatePact` use cases, Zod schema, `progressPercent`), `data/` (`InMemoryPactRepository` for tests, `SupabasePactRepository` for production), `presentation/` (list view, form, detail). Writes go straight to the tables under RLS (ownership and membership are expressible as policies, so no RPC is needed); progress is read through the `pact_progress` RPC so members see only aggregates.

| Concern | Where it is enforced |
| ------- | -------------------- |
| Title 3-60 and description at most 280 after trim | Zod schema (UI message) and `check` constraints on `pacts` (migration 0003 makes them trim-aware) |
| Only members create pacts | `pacts_insert_member` policy (`is_circle_member` and `created_by = auth.uid()`); in-memory: optional `isMember` dependency |
| Only the creator edits or deletes | `pacts_update_creator`, `pacts_delete_creator`; the repository turns a zero-row result into `unauthorized`, or `not_found` when the pact is no longer visible |
| Check-in only by a member of the pact's circle, as themselves | `check_ins_insert_member` policy (`user_id = auth.uid()` and the pact's circle has the user); a refusal is SQLSTATE 42501, mapped to `unauthorized` |
| One check-in per pact, member and day | `unique (pact_id, user_id, day)`; SQLSTATE 23505 mapped to `conflict` "Você já fez check-in hoje"; in-memory returns the same |
| Delete removes check-ins | `check_ins.pact_id ... on delete cascade`; in-memory removes them explicitly |
| No per-person data | `check_ins_select_own` (a member reads only their own rows); `pact_progress` is `security definer` and returns counts plus `i_did` |
| Progress "X de N" with N current members | `pact_progress` counts `circle_members` at read time, so a new member is included; `progressPercent` rounds and returns 0 when N is 0 |
| Day rollover | The repository takes `day` (`YYYY-MM-DD`, device local) on every call; the screen computes it per request |
| Backend errors to Portuguese | `mapPactError` (23505, 42501, 23514, then `mapError`) |

### Audit result (spec.md vs. code, at the start of the retro-fit)

| AC | Result |
| -- | ------ |
| Create/list AC1, AC4; Check-in AC1-AC2, AC6; Progress AC1-AC3, AC5; Edit/delete AC1-AC6 (domain, in-memory, SQL) | Implemented as specified |
| Create/list AC2-AC3 with non-string input | Bug: Zod's English message leaked for `undefined`, `null` and numbers. Fixed in T3 |
| Check-in AC4 in the in-memory repository | Bug: `checkIn` and `create` let any signed-in user act on any circle, unlike the SQL policies. Fixed in T5 with an optional `isMember` dependency (default keeps old callers working); `get`/`listByCircle` also hide circles the user is not in |
| Edit/delete AC7 (`not_found`) | Bug: `SupabasePactRepository.update`/`remove` reported `unauthorized` whenever zero rows changed, including a pact that was already deleted. Fixed in T6 by probing visibility |
| `mapPactError` | Gap: a check constraint violation (23514) fell to `unknown`. Mapped to `validation` in T6 |
| Edge: double tap, day rollover, new member counted | Covered by the unique constraint, the `day` argument and `pact_progress`; tests in T4-T5 |
| SQL title/description caps | Present (3-60, at most 280) but not trim-aware: a title of three spaces passes the check via a direct API call. Real gap, closed by migration 0003 (T7). Not applied to the remote project |
| SQL `check_ins` insert policy, `pact_progress`, cascade | Correct, no change. Observations: `day` is client supplied and not range-checked (future days can be inserted via the API; harmless, out of scope); a creator keeps edit rights if they stop being a member (no leave feature exists) |

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/PROJECT_CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `.specs/features/circles/tasks.md` (matrix and gates), `jest.config.js`, `CLAUDE.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain: schema, use cases, `progressPercent` | unit (against `InMemoryPactRepository`) | One test per AC; boundaries (title 2/3/60/61 after trim, description 280/281); repository not called on invalid input; N=0; 2 of 3 = 67 | `src/modules/pacts/__tests__/*.test.ts` | `npm test` |
| Data: in-memory repository | unit | Every rule the SQL enforces: ordering, circle scoping, creator-only edit/delete, cascade, one check-in per day, new day, non-member rejection, memberCount | `src/modules/pacts/__tests__/*.test.ts` | `npm test` |
| Data: Supabase error mapper and zero-row handling | unit (stub client) | Each SQL code, fallback, not_found vs unauthorized | `src/modules/pacts/__tests__/*.test.ts` | `npm test` |
| Data: `SupabasePactRepository` queries | none (AD-002: real backend validated manually) | - (build gate; manual check in the Verifier run) | - | build gate |
| Presentation: screens and views | unit (React Native Testing Library) | Render + type + press + state per AC: loading, empty, error and retry, each message, no repository call on invalid input, disabled check-in button, delete confirmation | `src/modules/pacts/__tests__/*.test.tsx` | `npm test` |
| Route files (`app/`), contracts, barrel, SQL migrations, docs | none | - (build gate; route behavior and RLS checked manually) | - | build gate |

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

### Phase 2: Domain and data (non-UI)

```
T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 3: Presentation (owned by the UI agent)

```
T7 → T-UI-1 → T-UI-2 → T-UI-3
```

### Phase 4: Documentation

```
T-UI-3 → T8
```

---

## Task Breakdown

### T1: Pacts and check_ins schema, RLS and progress RPC

**What**: `pacts` and `check_ins` tables with caps and the unique day constraint, RLS policies, `pact_progress` (pacts part of the shared migration). Already applied to project RODA.
**Where**: `supabase/migrations/0002_circles_pacts_stories.sql`
**Depends on**: None
**Requirement**: PACT-01, PACT-02, PACT-03, PACT-04, PACT-05, PACT-06, PACT-08, PACT-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] RLS enabled on both tables; policies match the Design note
- [x] Audited against spec.md; the only finding is the trim-aware cap (T7)

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: `4c6c2e0` (`feat(db): version circles, pacts and stories migration`)

---

### T2: Pact repository contract

**What**: `Pact`, `PactInput`, `PactRepository` and `pactRepositoryToken`.
**Where**: `src/modules/pacts/domain/pact-repository.ts`
**Depends on**: T1
**Requirement**: PACT-01, PACT-02, PACT-03, PACT-06, PACT-08, PACT-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Interface exposes `listByCircle`, `get`, `create`, `update`, `remove`, `checkIn`
- [x] `npm run typecheck` passes

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: `3ee4031` (`feat(circles,pacts): add domain, data and presentation layers`)

---

### T3: Pact validation and use cases

**What**: One test per validation AC: title 2/3/60/61 after trim, description 280/281, repository not called on invalid input for create and update, and the Portuguese rule for non-string input (fix: Zod's English message leaked for `undefined`, `null`, numbers).
**Where**: `src/modules/pacts/domain/pact-use-cases.ts`
**Depends on**: T2
**Reuses**: `InMemoryPactRepository`, `createAppError`
**Requirement**: PACT-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first (21 tests in `pact-validation.test.ts`), fix applied
- [x] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `fix(pacts): show the Portuguese rule for non-string pact input` (this commit)

---

### T4: Progress rules

**What**: Test `progressPercent` (2 of 3 = 67, 1 of 3 = 33, N=0 gives 0, no division by zero) and that `get`/`listByCircle` report `doneCount` as distinct members, `memberCount` as the current count (a member joining later raises N), `checkedInByMe` per user, and never expose who checked in.
**Where**: `src/modules/pacts/domain/pact-use-cases.ts`, `src/modules/pacts/data/in-memory-pact-repository.ts`
**Depends on**: T3
**Reuses**: `InMemoryPactRepository`
**Requirement**: PACT-05, PACT-06, PACT-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first: 3 members and 2 check-ins give "2 de 3" and 67; N=0; N changes after check-ins; `Pact` has no member list
- [x] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `test(pacts): cover collective progress rules` (this commit)

---

### T5: In-memory repository mirrors the SQL

**What**: Cover create, list (circle scoping, oldest first), check-in (single record, double tap, new day, day rollover, non-member `unauthorized`), edit/delete (creator only, `not_found`, cascade). Add the optional `isMember(circleId, userId)` dependency so non-members cannot create, check in or read, as the RLS policies do.
**Where**: `src/modules/pacts/data/in-memory-pact-repository.ts`
**Depends on**: T4
**Reuses**: `pact-repository.ts` contract
**Requirement**: PACT-02, PACT-03, PACT-04, PACT-08, PACT-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first, including a concurrent `Promise.all` double check-in keeping one record
- [x] Constructor stays compatible: `(currentUserId, memberCount, isMember?)`
- [x] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: `fix(pacts): reject non-members in the in-memory repository` (this commit)

---

### T6: Supabase error mapping and zero-row handling

**What**: Test `mapPactError` (23505 conflict, 42501 unauthorized, 23514 validation, unknown without backend text, network) and make `update`/`remove` return `not_found` when the pact is no longer visible and `unauthorized` when it exists but is not the user's (tests with a stub client).
**Where**: `src/modules/pacts/data/supabase-pact-repository.ts`
**Depends on**: T5
**Reuses**: `mapError`, `createAppError`
**Requirement**: PACT-04, PACT-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests first
- [ ] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Pending
**Commit**: `fix(pacts): report not_found for pacts that no longer exist`

---

### T7: Trim-aware title and description caps

**What**: Migration `0003` replaces the `pacts` title and description checks with `btrim`-based ones (title 3-60 after trim). Never edits applied migrations; the user applies it to the remote project.
**Where**: `supabase/migrations/0003_pacts_trim_checks.sql`
**Depends on**: T6
**Requirement**: PACT-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Migration written
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint`
- [ ] NOT applied to the remote project (reported to the user)

**Tests**: none
**Gate**: build
**Status**: Pending
**Commit**: `fix(db): make pact title and description caps trim-aware`

---

### T-UI-1: Pacts list view

**What**: Test and fix `PactsView`: loading indicator, empty state with "Criar pacto", ordered list with "X de N hoje" and percentage, error banner with retry, check-in from the card, no ranking.
**Where**: `src/modules/pacts/presentation/pacts-view.tsx`
**Depends on**: T7
**Requirement**: PACT-02, PACT-05, PACT-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] One test per List AC (5-7) and Progress AC (1-3, 5)
- [ ] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Pending
**Commit**: `test(pacts): cover the pacts view`

---

### T-UI-2: Pact form screen

**What**: Test `PactFormScreen` for create and edit: valid submit, title and description messages, repository not called on invalid input, failure alert, single submit while pending.
**Where**: `src/modules/pacts/presentation/pact-form-screen.tsx`
**Depends on**: T-UI-1
**Requirement**: PACT-01, PACT-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] One test per Create AC (1-3) and Edit AC (1)
- [ ] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Pending
**Commit**: `test(pacts): cover the pact form screen`

---

### T-UI-3: Pact detail screen

**What**: Test `PactDetailScreen`: progress "X de N hoje" and percentage updating after a check-in, "Check-in feito hoje" with disabled button, check-in failure keeps the button, edit and delete controls only for the creator, delete confirmation (confirm and cancel), `not_found` message.
**Where**: `src/modules/pacts/presentation/pact-detail-screen.tsx`
**Depends on**: T-UI-2
**Requirement**: PACT-03, PACT-04, PACT-05, PACT-07, PACT-08, PACT-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] One test per Check-in AC (1-6), Progress AC (4) and Edit/delete AC (2-7)
- [ ] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Pending
**Commit**: `test(pacts): cover the pact detail screen`

---

### T8: Traceability

**What**: Map PACT-01..PACT-09 to tasks and tests in the spec traceability table and set status to Implemented after the Verifier PASS.
**Where**: `.specs/features/pacts/spec.md`
**Depends on**: T-UI-3
**Requirement**: PACT-01, PACT-02, PACT-03, PACT-04, PACT-05, PACT-06, PACT-07, PACT-08, PACT-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Every requirement lists its tasks
- [ ] `validate_tasks.py` exits 0 on this file

**Tests**: none
**Gate**: build
**Status**: Pending
**Commit**: `docs(pacts): map requirements to tasks`

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
| T-UI-1 | T7 | T7 → T-UI-1 | ✅ Match |
| T-UI-2 | T-UI-1 | T-UI-1 → T-UI-2 | ✅ Match |
| T-UI-3 | T-UI-2 | T-UI-2 → T-UI-3 | ✅ Match |
| T8 | T-UI-3 | T-UI-3 → T8 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | SQL migration | none | none | ✅ OK |
| T2 | Contract | none | none | ✅ OK |
| T3 | Domain use cases | unit | unit | ✅ OK |
| T4 | Domain and in-memory | unit | unit | ✅ OK |
| T5 | In-memory repository | unit | unit | ✅ OK |
| T6 | Supabase mapper and repository | unit | unit | ✅ OK |
| T7 | SQL migration | none | none | ✅ OK |
| T-UI-1 | View | unit | unit | ✅ OK |
| T-UI-2 | Screen | unit | unit | ✅ OK |
| T-UI-3 | Screen | unit | unit | ✅ OK |
| T8 | Docs | none | none | ✅ OK |
