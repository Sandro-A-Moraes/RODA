# Meetups Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline in this file (see "Design note"); no separate `design.md`.
**Status**: In progress

---

## Design note

Meetups follows AD-001..AD-003 and mirrors `src/modules/stories/`: `domain/` (contract, validation, use cases), `data/` (`InMemoryMeetupRepository`, `SupabaseMeetupRepository`, error mapper), `presentation/` (list view with RSVP, propose form). New migration `supabase/migrations/0005_meetups.sql` (tables, RLS, trigger that marks the creator as going).

Contract:

```ts
type Rsvp = 'going' | 'not_going';
interface Meetup {
  id: string; circleId: string; title: string; place: string;
  startsAt: Date;            // absolute instant; shown in the device's local time
  createdBy: string;
  goingNames: string[];      // names of members going; the count is its length
  myRsvp: Rsvp | null;
}
interface MeetupInput { title: string; place: string; startsAt: Date }
interface MeetupRepository {
  listUpcoming(circleId: string, now: Date): Promise<Result<Meetup[]>>; // startsAt > now, soonest first
  create(circleId: string, input: MeetupInput): Promise<Result<Meetup>>; // creator is going
  setRsvp(meetupId: string, rsvp: Rsvp): Promise<Result<void>>;          // replaces the earlier one
}
```

| Concern | Where it is enforced |
| ------- | -------------------- |
| Title 3-60, place 3-100 after trim; `DD/MM/AAAA` and `HH:MM` (real calendar date, 00:00-23:59); future date | `validateMeetupInput` in the domain, in that order, with the spec messages |
| Only members create and RSVP | RLS (`42501` -> `unauthorized`); in-memory takes an optional `isMember` like stories |
| One RSVP per member and meetup, changeable | primary key `(meetup_id, user_id)` + upsert; in-memory replaces |
| Creator is going | trigger `meetups_creator_going` (AFTER INSERT); in-memory does it in `create` |
| Past meetups hidden | repository filters `starts_at > now` |
| Names of those going | `profiles_select_circle_mates` + embed `profiles!meetup_rsvps_user_id_fkey(display_name)` |

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain: validation, use case | unit | One test per AC message; bounds 2/3/60/61 and 2/3/100/101; 31/02, 24:00, 12:60 invalid; past and equal-to-now rejected; repository not called when invalid | `src/modules/meetups/__tests__/*.test.ts` | `npm test` |
| Data: in-memory repository | unit | Upcoming only, soonest first, creator going, RSVP replace and idempotence, non-member refused | `src/modules/meetups/__tests__/*.test.ts` | `npm test` |
| Data: error mapper | unit | 42501, 23514, fallback | `src/modules/meetups/__tests__/*.test.ts` | `npm test` |
| Data: `SupabaseMeetupRepository` | none (AD-002: validated manually) | - (build gate) | - | build gate |
| Presentation: list and form | unit (RNTL) | loading, empty with action, error + retry, RSVP buttons, names and count, each field message | `src/modules/meetups/__tests__/*.test.tsx` | `npm test` |
| Wiring, route, barrel, docs | none | - (build gate) | - | build gate |

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks that add or change code with types | `npm test && npm run typecheck` |
| Build | After wiring, docs or config tasks | `npm test && npm run typecheck && npm run lint` |

---

## Execution Plan

### Phase 1: Domain and data

```
T1 → T2 → T3 → T4
```

### Phase 2: Presentation and wiring

```
T4 → T5 → T6 → T7
```

### Phase 3: Backend and docs

```
T7 → T8
```

---

## Task Breakdown

### T1: Meetup contract

**What**: `Meetup`, `Rsvp`, `MeetupInput`, `MeetupRepository`, `meetupRepositoryToken` as in the Design note.
**Where**: `src/modules/meetups/domain/meetup-repository.ts`
**Depends on**: None
**Requirement**: MEET-01..05

**Done when**:

- [x] Interface exposes `listUpcoming`, `create`, `setRsvp`
- [x] `npm run typecheck` passes

**Tests**: none
**Gate**: full
**Status**: Done
**Commit**: feat(meetups): add the meetup repository contract

---

### T2: Meetup validation and `createMeetup`

**What**: Tests first, one per validation AC (MEET-02): title and place bounds after trim, date/time format and real calendar date, future rule, messages "Título deve ter entre 3 e 60 caracteres", "Local deve ter entre 3 e 100 caracteres", "Data ou hora inválida", "A data deve ser no futuro"; repository not called on invalid input. Implement `validateMeetupInput` and `createMeetup`.
**Where**: `src/modules/meetups/domain/meetup-validation.ts`, `src/modules/meetups/domain/meetup-use-cases.ts`
**Depends on**: T1
**Requirement**: MEET-02

**Done when**:

- [x] Each validation AC has a test asserting the exact message
- [x] `createMeetup` forwards trimmed values and a local-time `Date`

**Tests**: unit
**Gate**: quick
**Status**: Done
**Commit**: feat(meetups): validate and create meetups

---

### T3: In-memory repository

**What**: Tests first (MEET-01, 03, 04, 05 and edge cases), then `InMemoryMeetupRepository`.
**Where**: `src/modules/meetups/data/in-memory-meetup-repository.ts`
**Depends on**: T2
**Requirement**: MEET-01, MEET-03, MEET-04, MEET-05

**Done when**:

- [x] Upcoming only, soonest first; a meetup whose time passed disappears
- [x] Creator is going; the same RSVP twice keeps one record; changing replaces
- [x] Non-member create and RSVP return `unauthorized`

**Tests**: unit
**Gate**: quick
**Status**: Done
**Commit**: feat(meetups): add the in-memory meetup repository

---

### T4: Supabase repository and error mapper

**What**: Mapper tests first (42501, 23514, fallback), then `mapMeetupError` and `SupabaseMeetupRepository`.
**Where**: `src/modules/meetups/data/map-meetup-error.ts`, `src/modules/meetups/data/supabase-meetup-repository.ts`
**Depends on**: T3
**Requirement**: MEET-05

**Done when**:

- [ ] Mapper never leaks backend text
- [ ] Repository uses the FK hint on the profiles embed

**Tests**: unit (mapper)
**Gate**: full
**Status**: Pending
**Commit**: feat(meetups): add the Supabase meetup repository

---

### T5: Meetups list with RSVP

**What**: Tests first (MEET-03, MEET-04): loading, empty state with "Propor encontro", error and retry, card with title, place, date, names going and count, "Eu vou"/"Não vou" recording the RSVP and refreshing, RSVP failure shows the error with retry. Implement `MeetupsView`.
**Where**: `src/modules/meetups/presentation/meetups-view.tsx`
**Depends on**: T4
**Requirement**: MEET-03, MEET-04, MEET-05

**Done when**:

- [ ] Each AC has a test
- [ ] No popularity metric beyond the going count the spec allows (AD-005)

**Tests**: unit (RNTL)
**Gate**: quick
**Status**: Pending
**Commit**: feat(meetups): list upcoming meetups with RSVP

---

### T6: Propose form

**What**: Tests first (MEET-01, MEET-02): valid submit calls `onSaved`; each message appears under its field; fields Título, Local, Data, Hora. Implement `MeetupFormScreen`.
**Where**: `src/modules/meetups/presentation/meetup-form-screen.tsx`
**Depends on**: T5
**Requirement**: MEET-01, MEET-02

**Done when**:

- [ ] Each validation message shown under its field
- [ ] Submit is single-flight (shared `useAsyncAction`)

**Tests**: unit (RNTL)
**Gate**: quick
**Status**: Pending
**Commit**: feat(meetups): add the propose meetup form

---

### T7: Wiring

**What**: Barrel, provider in `app/_layout.tsx`, "Encontros" tab shows `MeetupsView`, header action "Propor encontro", route `circles/[id]/meetups/new`.
**Where**: `src/modules/meetups/index.ts`, `app/_layout.tsx`, `app/(app)/circles/[id]/index.tsx`, `app/(app)/circles/[id]/meetups/new.tsx`
**Depends on**: T6
**Requirement**: MEET-01, MEET-03

**Done when**:

- [ ] The placeholder "Em breve" is gone
- [ ] Build gate green

**Tests**: none
**Gate**: build
**Status**: Pending
**Commit**: feat(meetups): wire meetups into the circle screen

---

### T8: Migration and docs

**What**: `0005_meetups.sql` (tables, RLS, creator-going trigger), applied to RODA; README and STATE updated.
**Where**: `supabase/migrations/0005_meetups.sql`, `README.md`, `.specs/STATE.md`
**Depends on**: T7
**Requirement**: MEET-01, MEET-04, MEET-05

**Done when**:

- [ ] Migration applied and policies visible in `pg_policies`
- [ ] README no longer says meetups are not implemented

**Tests**: none
**Gate**: build
**Status**: Pending
**Commit**: feat(meetups): add the meetups migration
