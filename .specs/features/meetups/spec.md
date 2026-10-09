# Meetups Specification

## Problem Statement

The app's purpose is to send people back to real life. Members need to propose an in-person activity to their circle and confirm who is coming. This feature is a Should-have and the first to be cut if time runs out.

## Goals

- [ ] A member can propose a meetup with date and place.
- [ ] Members can confirm or decline attendance and see who is going.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Maps, geolocation, address autocomplete | Native permissions and extra APIs; free text is enough |
| Calendar export and push reminders | Anti-feature for notifications (AD-005); extra scope |
| Editing or cancelling a meetup | Cut for the deadline |
| Recurring meetups | Not needed |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Meetup fields | title (3 to 60 chars), place (3 to 100 chars), date and time | Minimum to meet in person | n |
| Date rule | Must be in the future at creation time | A past meetup is meaningless | n |
| Date input | Text input `DD/MM/AAAA` and `HH:MM` with validation | Native date pickers need extra libraries or behave differently on web | n |
| RSVP states | `going` or `not_going`, one per member per meetup, changeable | Simple and testable | n |
| Attendance visibility | Members see names of those going and the count going | Planning needs names; this is not a popularity metric | n |
| List contents | Upcoming meetups only, soonest first | Past meetups add no value in the demo | n |
| Creator RSVP | Creator is automatically `going` | A proposer who is not coming is unusual | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P2: Propose a meetup

**User Story**: As a member, I want to propose a meetup so that the circle meets in person.

**Why P2**: Closes the loop of the product but is not needed for course requirements.

**Acceptance Criteria**:

1. WHEN a member submits a valid title, place and future date and time THEN the system SHALL create the meetup in that circle and mark the creator as going.
2. IF the date and time are not in the future THEN the system SHALL show "A data deve ser no futuro" and not create the meetup.
3. IF the date or time text does not match `DD/MM/AAAA` or `HH:MM` THEN the system SHALL show "Data ou hora inválida".
4. IF the title is shorter than 3 or longer than 60 characters after trimming THEN the system SHALL show "Título deve ter entre 3 e 60 caracteres".
5. IF the place is shorter than 3 or longer than 100 characters after trimming THEN the system SHALL show "Local deve ter entre 3 e 100 caracteres".

**Independent Test**: Create a meetup for tomorrow and see it in the list with yourself as going.

---

### P2: List meetups and RSVP

**User Story**: As a member, I want to see upcoming meetups and say whether I am going.

**Why P2**: Makes proposed meetups actionable.

**Acceptance Criteria**:

1. WHEN a member opens the meetups of a circle THEN the system SHALL list only upcoming meetups of that circle, soonest first.
2. WHEN a member taps "Eu vou" or "Não vou" THEN the system SHALL record that RSVP, replacing any earlier one by the same member.
3. WHEN a member opens a meetup THEN the system SHALL show the names of members going and the count going.
4. WHILE the list is loading the system SHALL show a loading indicator.
5. IF the circle has no upcoming meetups THEN the system SHALL show an empty state with a "Propor encontro" action.
6. IF loading or recording the RSVP fails THEN the system SHALL show the error message with a retry action.
7. IF a user who is not a member of the circle attempts to RSVP THEN the system SHALL reject it with an `unauthorized` error.

**Independent Test**: Account B marks "Eu vou" and appears in A's going list.

---

## Edge Cases

- WHEN a meetup's start time passes THEN the system SHALL stop listing it as upcoming.
- IF a member taps the same RSVP twice THEN the system SHALL keep exactly one RSVP record.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MEET-01 | P2: Propose (AC 1) | Execute | Implemented |
| MEET-02 | P2: Propose (AC 2-5) | Execute | Implemented |
| MEET-03 | P2: List and RSVP (AC 1, 4-5) | Execute | Implemented |
| MEET-04 | P2: List and RSVP (AC 2-3) | Execute | Implemented |
| MEET-05 | P2: List and RSVP (AC 6-7) | Execute | Implemented |

**Coverage:** 5 total, 5 mapped to tasks (`tasks.md` T1-T9)

---

## Success Criteria

- [ ] A meetup can be proposed and two accounts can RSVP on the real backend.
