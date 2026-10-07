# Circles Specification

## Problem Statement

A circle is the closed group of at most 12 acquaintances that every other Roda feature belongs to. Users need to create a circle, invite people with a code, join an existing one and see who is in it.

## Goals

- [ ] A user can create a circle and share its invite code.
- [ ] Another user can join with that code until the circle has 12 members.
- [ ] Members can see their circles and each circle's member list, and nobody else can.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Leaving or deleting a circle, removing members | Not needed for the demo; avoids ownership edge cases |
| Renaming a circle, editing description | Not a course requirement |
| Public circle discovery or search | Anti-feature: no public profiles (AD-005) |
| Expiring or regenerating invite codes | Added complexity with no demo value |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Member cap | 12 including the creator | Defined in the product concept (Dunbar-inspired) | y |
| Invite code format | 6 characters from `A-Z` and `2-9` excluding `O`, `I`, `L` | Easy to read aloud and type, collision space of 31^6 (23 letters + 8 digits) | n |
| Code matching | Case-insensitive, whitespace trimmed | Users will paste or type loosely | n |
| Circle name bounds | 2 to 40 characters after trim | Fits a list row | n |
| Creator role | Creator is a normal member with no special rights in this feature | Pact edit/delete rights are defined in `pacts` | n |
| Multiple circles per user | Allowed | Real life has family and friends circles; list screen handles it | n |
| Atomic cap enforcement | Backed by SQL (trigger/constraint) as well as the domain | AD-003: the cap must hold under concurrent joins | n |
| Duplicate join | Joining a circle you are already in is rejected | Keeps membership unique | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Create a circle ⭐ MVP

**User Story**: As a user, I want to create a circle so that I can invite my friends.

**Why P1**: No circle, no app.

**Acceptance Criteria**:

1. WHEN a signed-in user submits a valid circle name THEN the system SHALL create the circle, add the user as its first member and show its invite code.
2. The system SHALL generate invite codes of 6 characters from the alphabet in the Assumptions table.
3. IF the generated code collides with an existing circle's code THEN the system SHALL generate a new code until it is unique.
4. IF the name is shorter than 2 or longer than 40 characters after trimming THEN the system SHALL show "Nome deve ter entre 2 e 40 caracteres" and not create the circle.

**Independent Test**: Create a circle, see a 6-character code and yourself in the member list.

---

### P1: Join by invite code ⭐ MVP

**User Story**: As a user, I want to enter a code so that I can join my friends' circle.

**Why P1**: Circles are useless with one member.

**Acceptance Criteria**:

1. WHEN a signed-in user submits a valid invite code for a circle with fewer than 12 members THEN the system SHALL add the user as a member and navigate to that circle.
2. IF no circle has the submitted code THEN the system SHALL show "Código não encontrado".
3. IF the circle already has 12 members THEN the system SHALL show "Este círculo está cheio" and not add the user.
4. IF the user is already a member of that circle THEN the system SHALL show "Você já faz parte deste círculo" and not add a second membership.
5. WHEN the code is submitted in lowercase or with surrounding spaces THEN the system SHALL match it as if typed in uppercase and trimmed.
6. IF the submitted code is empty THEN the system SHALL show "Informe o código" and not call the repository.

**Independent Test**: Use a second account to join with the code; fill a circle to 12 and see the 13th rejected.

---

### P1: See my circles and members ⭐ MVP

**User Story**: As a member, I want to see my circles and who is in each so that I know who I am doing this with.

**Why P1**: It is the hub that every other feature hangs from.

**Acceptance Criteria**:

1. WHEN a signed-in user opens the circles tab THEN the system SHALL list only the circles the user belongs to.
2. WHILE the circle list is loading the system SHALL show a loading indicator.
3. IF the user belongs to no circle THEN the system SHALL show an empty state with "Criar círculo" and "Entrar com código" actions.
4. IF loading the list fails THEN the system SHALL show an error banner with a retry action.
5. WHEN a member opens a circle THEN the system SHALL show every member's display name and the member count as "N de 12".
6. IF a user is not a member of a circle THEN the system SHALL NOT return that circle's data or members.

**Independent Test**: Two accounts in different circles each see only their own.

---

## Edge Cases

- WHEN the 12th member joins THEN the system SHALL accept the join and report the circle as full afterwards.
- IF two users join the last free slot simultaneously THEN the system SHALL accept exactly one and reject the other with "Este círculo está cheio".

---

## Requirement Traceability

| Requirement ID | Story | Tasks | Status |
| -------------- | ----- | ----- | ------ |
| CIR-01 | P1: Create (AC 1, 4) | T1, T3, T4, T6, T10, T11 | Implemented |
| CIR-02 | P1: Create (AC 2-3) | T1, T3, T4 | Implemented |
| CIR-03 | P1: Join (AC 1, 5, 6) | T1, T3, T4, T7 | Implemented |
| CIR-04 | P1: Join (AC 2, 4) | T1, T4, T5, T7 | Implemented |
| CIR-05 | P1: Join (AC 3) and edge cases | T1, T4, T5, T7 | Implemented |
| CIR-06 | P1: My circles (AC 1-4) | T2, T4, T8 | Implemented |
| CIR-07 | P1: My circles (AC 5) | T2, T4, T9 | Implemented |
| CIR-08 | P1: My circles (AC 6) | T1, T4, T8, T9 | Implemented |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped. Verifier PASS (validation.md); manual check on the real backend pending.

---

## Success Criteria

- [ ] Two accounts can form a circle through the code on the real backend.
- [ ] RLS blocks reading a circle the account does not belong to.
