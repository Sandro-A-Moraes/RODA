# Pacts Specification

## Problem Statement

Commitments made to other people hold better than personal goals. A pact is a collective commitment of a circle (for example "no phones during meals") that members confirm daily, and the circle sees shared progress instead of a ranking. This is the main CRUD feature of the course project.

## Goals

- [ ] Members can create, view, edit and delete pacts of their circle.
- [ ] Each member can check in once per pact per day.
- [ ] The pact shows collective progress with no per-person ranking.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Streaks, scores, per-person rankings | Anti-feature: no popularity metrics or comparison (AD-005) |
| Reminder notifications | Anti-feature: engagement-bait notifications (AD-005) |
| Undoing a check-in | Keeps the one-per-day rule simple; no requirement |
| Pact end dates, recurrence schedules | Daily recurrence only; scope cut for the deadline |
| Device-measured screen time | Not possible in Expo Go (AD-004) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Pact fields | title (3 to 60 chars), description (optional, up to 280 chars) | Enough to state a commitment; bounds fit a card | n |
| Who may create | Any member of the circle | Pacts are collective; no admin role exists | n |
| Who may edit or delete | Only the member who created the pact | Prevents others from erasing a commitment; simple ownership rule | n |
| Definition of "day" | Calendar day in the device's local time, stored as `YYYY-MM-DD` | Users think in local days; avoids timezone surprises | n |
| Collective progress | Today's progress = distinct members who checked in today divided by current member count, shown as "X de N hoje" plus a percentage | Single, ranking-free number that is easy to test | n |
| Who may check in | Any member of the circle that owns the pact | Collective accountability | n |
| Delete behavior | Deleting a pact also deletes its check-ins, after a confirmation prompt | No orphaned data; confirmation prevents accidents | n |
| Check-in uniqueness | Enforced in domain and by a SQL unique constraint on (pact, member, day) | AD-003: must hold under retries and double taps | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Create and list pacts ⭐ MVP

**User Story**: As a member, I want to create a pact and see my circle's pacts so that we commit to something together.

**Why P1**: The create and read halves of the required CRUD.

**Acceptance Criteria**:

1. WHEN a member submits a valid title and optional description THEN the system SHALL create the pact in that circle and show it in the pact list.
2. IF the title is shorter than 3 or longer than 60 characters after trimming THEN the system SHALL show "Título deve ter entre 3 e 60 caracteres" and not create the pact.
3. IF the description is longer than 280 characters THEN the system SHALL show "Descrição deve ter no máximo 280 caracteres".
4. WHEN a member opens a circle's pacts THEN the system SHALL list only that circle's pacts, ordered by creation date, oldest first.
5. WHILE the pact list is loading the system SHALL show a loading indicator.
6. IF the circle has no pacts THEN the system SHALL show an empty state with a "Criar pacto" action.
7. IF loading fails THEN the system SHALL show an error banner with a retry action.

**Independent Test**: Create two pacts and see both in the list; fail validation with a 2-character title.

---

### P1: Check in ⭐ MVP

**User Story**: As a member, I want to confirm a pact for today so that the circle knows I kept my word.

**Why P1**: The daily mechanism is the product's core loop.

**Acceptance Criteria**:

1. WHEN a member who has not checked in today taps "Fazer check-in" on a pact THEN the system SHALL record one check-in for that member, pact and local day.
2. IF the member already checked in on that pact today THEN the system SHALL reject a second check-in and keep a single record.
3. WHILE the member has already checked in today the pact SHALL show "Check-in feito hoje" and the check-in button SHALL be disabled.
4. IF a user who is not a member of the pact's circle attempts a check-in THEN the system SHALL reject it with an `unauthorized` error.
5. IF the check-in request fails THEN the system SHALL show the error message and leave the button available for retry.
6. The system SHALL NOT display any ranking, ordering or comparison of members by check-ins.

**Independent Test**: Check in, see the button disabled; reopen the app and still see it disabled.

---

### P1: Collective progress ⭐ MVP

**User Story**: As a member, I want to see how the whole circle is doing today so that I feel accountable to the group, not compared to it.

**Why P1**: It is what separates a pact from a personal to-do.

**Acceptance Criteria**:

1. WHEN a member opens a pact THEN the system SHALL show today's progress as "X de N hoje", where X is the number of distinct members who checked in today and N is the circle's current member count.
2. The system SHALL show the progress percentage as X divided by N, rounded to the nearest whole number.
3. IF N is zero THEN the system SHALL show 0% and not divide by zero.
4. WHEN a new check-in is recorded THEN the system SHALL update the displayed progress without requiring the user to reopen the screen.
5. The system SHALL NOT reveal which members have or have not checked in beyond the aggregate number.

**Independent Test**: With 3 members and 2 check-ins, the pact shows "2 de 3 hoje" and 67%.

---

### P1: Edit and delete pacts ⭐ MVP

**User Story**: As the creator of a pact, I want to fix or remove it so that the circle's commitments stay accurate.

**Why P1**: The update and delete halves of the required CRUD.

**Acceptance Criteria**:

1. WHEN the creator submits valid changes to a pact THEN the system SHALL save them and show the updated pact.
2. IF a member who did not create the pact attempts to edit it THEN the system SHALL reject the change with an `unauthorized` error and not show edit controls.
3. WHEN the creator taps "Apagar" THEN the system SHALL ask for confirmation before deleting.
4. WHEN the creator confirms deletion THEN the system SHALL delete the pact and its check-ins and remove it from the list.
5. WHEN the creator cancels the confirmation THEN the system SHALL keep the pact unchanged.
6. IF a member who did not create the pact attempts to delete it THEN the system SHALL reject it with an `unauthorized` error and not show the delete control.
7. IF the pact no longer exists when edited or deleted THEN the system SHALL show a `not_found` error message.

**Independent Test**: Edit a title, delete a pact with and without confirming; a second account sees no edit controls.

---

## Edge Cases

- IF the user taps "Fazer check-in" twice quickly THEN the system SHALL record exactly one check-in.
- WHEN the local date changes while the pact screen is open THEN the system SHALL treat the next check-in as belonging to the new day.
- WHEN a member joins the circle after check-ins were made today THEN N in today's progress SHALL include the new member.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PACT-01 | P1: Create and list (AC 1-3) | Specify | Pending |
| PACT-02 | P1: Create and list (AC 4-7) | Specify | Pending |
| PACT-03 | P1: Check in (AC 1-3) | Specify | Pending |
| PACT-04 | P1: Check in (AC 4-5) | Specify | Pending |
| PACT-05 | P1: Check in (AC 6) and Progress (AC 5) | Specify | Pending |
| PACT-06 | P1: Progress (AC 1-3) | Specify | Pending |
| PACT-07 | P1: Progress (AC 4) | Specify | Pending |
| PACT-08 | P1: Edit and delete (AC 1-2) | Specify | Pending |
| PACT-09 | P1: Edit and delete (AC 3-7) | Specify | Pending |

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped ⚠️

---

## Success Criteria

- [ ] Full create, read, update, delete cycle works against the real backend.
- [ ] Two accounts checking in produce the correct "X de N hoje" on both devices.
