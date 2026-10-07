# Stories Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline in this file (see "Design note"); no separate `design.md`.
**Status**: Pending.

---

## Design note

Stories follows AD-001..AD-003 and mirrors `src/modules/pacts/`: `domain/` (repository contract, `createStory` use case, Zod schema, reaction helpers), `data/` (`InMemoryStoryRepository`, `SupabaseStoryRepository`), `presentation/` (feed view, composer screen). The tables, RLS policies and helper functions already exist in `supabase/migrations/0002_circles_pacts_stories.sql` (applied to RODA), so no new migration is planned.

Contract:

```ts
type ReactionKind = 'with_you' | 'inspired';
interface Story {
  id: string; circleId: string; authorId: string; authorName: string;
  body: string; day: string;            // YYYY-MM-DD, device local
  isMine: boolean;
  myReaction: ReactionKind | null;      // reaction the current user gave (never on own story)
  receivedKinds: ReactionKind[];        // kinds received; filled only on the user's own stories; no counts
}
interface StoryRepository {
  listByCircle(circleId: string, today: string): Promise<Result<Story[]>>; // last 7 days incl. today, newest first
  create(circleId: string, body: string, today: string): Promise<Result<Story>>;
  react(storyId: string, kind: ReactionKind | null): Promise<Result<void>>; // null removes
}
```

| Concern | Where it is enforced |
| ------- | -------------------- |
| Body 1-280 after trim, Portuguese messages for empty, too long and non-string input | Zod schema in `createStory`; SQL `check (char_length(body) between 1 and 280)` is not trim-aware, see T2 note |
| One story per member, circle and day | `unique (circle_id, author_id, day)`; SQLSTATE 23505 mapped to `conflict` "Você já compartilhou hoje"; in-memory returns the same |
| Only members post, as themselves | `stories_insert_member`; SQLSTATE 42501 mapped to `unauthorized`; in-memory takes an optional `isMember` like pacts |
| Feed window and order | Repository filters `day >= today - 6` and sorts by `day` desc then `created_at` desc; the `today` argument is supplied by the screen per request |
| Author display name | `profiles_select_circle_mates` lets members read each other's profiles; Supabase repository joins `profiles(display_name)` |
| No reaction on own story, one reaction per member and story, toggle/replace | `reactions_insert_member` forbids own story; primary key `(story_id, user_id)`; `react` does upsert or delete; use case and in-memory reject own story with `unauthorized` |
| Author sees received kinds, never counts | `reactions_select_own_or_author`; `receivedKinds` is a deduplicated list of kinds; `Story` has no number field for reactions |
| Day rollover | `create` re-evaluates against the `today` passed at submit time |
| Backend errors to Portuguese | `mapStoryError` (23505, 42501, 23514, then `mapError`) |

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain: schema, use cases | unit (against `InMemoryStoryRepository`) | One test per AC; body 0/1/280/281 after trim; whitespace and newlines only is empty; repository not called on invalid input | `src/modules/stories/__tests__/*.test.ts` | `npm test` |
| Data: in-memory repository | unit | 7-day window boundary (day 6 in, day 7 out), newest first, one per day, non-member rejection, reaction toggle/replace/remove, own-story rejection, `receivedKinds` only for the author | `src/modules/stories/__tests__/*.test.ts` | `npm test` |
| Data: Supabase error mapper | unit (stub client) | Each SQL code and the fallback | `src/modules/stories/__tests__/*.test.ts` | `npm test` |
| Data: `SupabaseStoryRepository` queries | none (AD-002: validated manually) | - (build gate) | - | build gate |
| Presentation: feed view and composer | unit (React Native Testing Library) | loading, empty without end marker, error and retry, end marker last, no numeric counters, author and date, composer replaced by notice, counter, each message | `src/modules/stories/__tests__/*.test.tsx` | `npm test` |
| Route files (`app/`), barrel, wiring, docs | none | - (build gate; checked manually) | - | build gate |

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks that add or change code with types | `npm test && npm run typecheck` |
| Build | After wiring, docs or config tasks, and the last task of each phase | `npm test && npm run typecheck && npm run lint` |

---

## Execution Plan

### Phase 1: Domain and data

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Presentation and wiring

```
T5 → T6 → T7 → T8 → T9
```

### Phase 3: Documentation

```
T9 → T10
```

---

## Task Breakdown

### T1: Story repository contract

**What**: `Story`, `ReactionKind`, `StoryRepository` and `storyRepositoryToken` as in the Design note.
**Where**: `src/modules/stories/domain/story-repository.ts`
**Depends on**: None
**Requirement**: STORY-01, STORY-03, STORY-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Interface exposes `listByCircle`, `create`, `react`
- [x] `Story` has no numeric reaction field
- [x] `npm run typecheck` passes

**Tests**: none
**Gate**: full
**Status**: Done
**Commit**: feat(stories): add the story repository contract

---

### T2: Story validation and `createStory`

**What**: Tests first, one per validation AC: body 0/1/280/281 after trim, only whitespace and newlines is empty ("Escreva algo para compartilhar"), over 280 ("Máximo de 280 caracteres"), non-string input gets the Portuguese rule, repository not called on invalid input. Implement the Zod schema and `createStory`.
**Where**: `src/modules/stories/domain/story-use-cases.ts`, `src/modules/stories/domain/story-validation.ts`
**Depends on**: T1
**Reuses**: `createAppError`, the `createPact` pattern in `src/modules/pacts/domain/pact-use-cases.ts`
**Requirement**: STORY-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `story-validation.test.ts`
- [x] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: feat(stories): validate the story body and add createStory

---

### T3: In-memory repository: posting, one per day, window and order

**What**: Tests first for STORY-02 (second story same day returns `conflict` "Você já compartilhou hoje" and keeps one record; same author on another day allowed; non-member gets `unauthorized`) and STORY-03 (window: day today-6 included, today-7 excluded; newest first; author display name and day present; stories of other circles hidden). Implement `InMemoryStoryRepository` (constructor takes `currentUserId`, `displayName(userId)` and optional `isMember`, like pacts).
**Where**: `src/modules/stories/data/in-memory-story-repository.ts`
**Depends on**: T2
**Reuses**: `InMemoryPactRepository`, `daysAgo` from `src/shared/date/local-day.ts`
**Requirement**: STORY-02, STORY-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `in-memory-story-repository.test.ts`
- [x] A seed of stories across 9 days returns only the last 7, newest first
- [x] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: feat(stories): add the in-memory story repository with the daily rule and feed window

---

### T4: In-memory repository: reactions

**What**: Tests first for STORY-06 and STORY-07: react sets `myReaction`; another kind replaces it; `null` removes; reacting to own story returns `unauthorized` and stores nothing; `receivedKinds` is filled only on the author's own stories, deduplicated, with no counts; non-members cannot react. Implement `react`.
**Where**: `src/modules/stories/data/in-memory-story-repository.ts`
**Depends on**: T3
**Requirement**: STORY-06, STORY-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `story-reactions.test.ts`
- [x] Gate check passes: `npm test && npm run typecheck`

**Tests**: unit
**Gate**: full
**Status**: Done
**Commit**: feat(stories): add reactions to the in-memory repository

---

### T5: Supabase repository and error mapper

**What**: `mapStoryError` with tests (23505 → conflict "Você já compartilhou hoje", 42501 → unauthorized, 23514 → validation, fallback `mapError`) and `SupabaseStoryRepository` (join `profiles(display_name)`, window filter, upsert/delete reactions, own `receivedKinds` via `story_reactions`).
**Where**: `src/modules/stories/data/map-story-error.ts`, `src/modules/stories/data/supabase-story-repository.ts`
**Depends on**: T4
**Reuses**: `src/modules/pacts/data/supabase-pact-repository.ts`
**Requirement**: STORY-02, STORY-03, STORY-06, STORY-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Mapper tests first in `supabase-story-repository.test.ts`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(stories): add the supabase story repository and error mapper

---

### T6: Feed view

**What**: Tests first for STORY-04 and STORY-05 (and STORY-03 AC2, AC7): loading indicator; empty state "Ninguém compartilhou ainda" with no end marker; error banner with retry; `FlatList` whose last element is "você chegou ao fim"; each story shows author name and local date; no numeric counter anywhere. Implement `StoriesView` aligned to Figma frame 08 (`8:276`).
**Where**: `src/modules/stories/presentation/stories-view.tsx`
**Depends on**: T5
**Reuses**: `src/modules/pacts/presentation/pacts-view.tsx`, `useLoad`, `EmptyState`, `ErrorBanner`
**Requirement**: STORY-03, STORY-04, STORY-05

**Tools**:

- MCP: Figma (frame 08, `8:276`)
- Skill: NONE

**Done when**:

- [x] Tests first in `stories-view.test.tsx`
- [x] No hex literals; colors come from `src/core/theme`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(stories): add the finite stories feed view

---

### T7: Composer and "already shared" notice

**What**: Tests first for STORY-01 and STORY-02: composer with "N de 280" counter; submit saves and the feed shows the story; empty and too-long messages without calling the repository; a conflict shows "Você já compartilhou hoje"; when the member already posted today the composer is replaced by the notice. Implement `StoryComposerScreen` aligned to Figma frame 14 (`11:518`) and the notice in the feed per frame 08.
**Where**: `src/modules/stories/presentation/story-composer-screen.tsx`, `src/modules/stories/presentation/stories-view.tsx`
**Depends on**: T6
**Requirement**: STORY-01, STORY-02

**Tools**:

- MCP: Figma (frame 14, `11:518`)
- Skill: NONE

**Done when**:

- [x] Tests first in `story-composer-screen.test.tsx`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(stories): add the story composer and the already shared notice

---

### T8: Reaction controls

**What**: Tests first for STORY-06 and STORY-07 in the UI: tap selects a kind; another kind replaces; the same kind removes; no controls on the member's own story; the author sees received kinds as labels ("Estou com você", "Me inspirou") without numbers; a failed call shows the error and restores the previous selection. Implement the controls.
**Where**: `src/modules/stories/presentation/stories-view.tsx`, `src/modules/stories/presentation/reaction-bar.tsx`
**Depends on**: T7
**Requirement**: STORY-06, STORY-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests first in `reaction-bar.test.tsx`
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: unit
**Gate**: build
**Status**: Done
**Commit**: feat(stories): add qualitative reaction controls to the feed

---

### T9: Wiring: barrel, DI, routes

**What**: Export the module from `index.ts`, register `storyRepositoryToken` in `app/_layout.tsx` like pacts, replace the "Em breve" placeholder of the `stories` tab in `app/(app)/circles/[id]/index.tsx` with `StoriesView`, add the "Novo relato" action and the route `app/(app)/circles/[id]/stories/new.tsx`.
**Where**: `src/modules/stories/index.ts`, `app/_layout.tsx`, `app/(app)/circles/[id]/index.tsx`, `app/(app)/circles/[id]/stories/new.tsx`
**Depends on**: T8
**Requirement**: STORY-01, STORY-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Stories tab shows the feed; "Novo relato" opens the composer and returns on save (wired; device check pending, restart Metro with `--clear` for the new route)
- [x] Gate check passes: `npm test && npm run typecheck && npm run lint`

**Tests**: none
**Gate**: build
**Status**: Done
**Commit**: feat(stories): wire the stories feed and composer into the circle

---

### T10: Traceability and handoff

**What**: Mark STORY-01..07 as implemented in `spec.md`, confirm the assumptions table, update `.specs/STATE.md` Handoff (python now runs as `python`).
**Where**: `.specs/features/stories/spec.md`, `.specs/STATE.md`
**Depends on**: T9
**Requirement**: STORY-01, STORY-02, STORY-03, STORY-04, STORY-05, STORY-06, STORY-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Traceability table has no Pending rows
- [ ] `python .claude/skills/tlc-spec-driven/scripts/validate_spec.py stories` exits 0

**Tests**: none
**Gate**: build
**Status**: Pending
**Commit**: -
