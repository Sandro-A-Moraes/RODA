# Stories Specification

## Problem Statement

Mainstream feeds reward volume and popularity. Roda offers one short daily reflection per person ("what did I do offline today?") in a finite feed with qualitative reactions, so sharing feels like a conversation among friends, not a performance.

## Goals

- [ ] A member can post at most one story per day to their circle.
- [ ] The feed is finite, chronological and ends with an explicit end marker.
- [ ] Reactions are qualitative and never shown as counts.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Photos, video or attachments | Storage and permissions add scope; text is enough |
| Comments and replies | Reactions cover the interaction for the deadline |
| Editing or deleting a story | Not required; keeps "one story per day" simple |
| Like counters, reaction totals | Anti-feature (AD-005) |
| Pagination or infinite scroll | Anti-feature (AD-005) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Story text bounds | 1 to 280 characters after trim | Short reflection; matches the "short" product intent | y |
| Day definition | Local calendar day `YYYY-MM-DD`, same as pacts | Consistent rule across the app | y |
| Feed window | Stories from the last 7 days including today | Keeps the feed finite and the query bounded | y |
| Feed order | Newest first | A chronological feed is read from the latest | y |
| Reaction set | `with_you` ("Estou com você"), `inspired` ("Me inspirou") | Two qualitative kinds are enough to demo; the set is fixed | y |
| Reaction rules | One reaction per member per story; choosing another replaces it; choosing the same removes it | Simple toggle with no counts | y |
| Reaction visibility | A member sees which reactions they gave and which reaction kinds their own story received, never counts | Qualitative signal without a popularity metric | y |
| Reacting to own story | Not allowed | Self-reaction carries no meaning | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Post a daily story ⭐ MVP

**User Story**: As a member, I want to share one reflection a day with my circle so that we stay connected without scrolling.

**Why P1**: It is the shared substitute for the social feed.

**Acceptance Criteria**:

1. WHEN a member submits story text of 1 to 280 characters THEN the system SHALL save it to that circle for the local day and show it in the feed.
2. IF the text is empty after trimming THEN the system SHALL show "Escreva algo para compartilhar" and not save.
3. IF the text exceeds 280 characters THEN the system SHALL show "Máximo de 280 caracteres" and not save.
4. IF the member already posted a story in that circle today THEN the system SHALL reject a second story with "Você já compartilhou hoje" and keep a single record.
5. WHILE the member has already posted today the system SHALL replace the composer with a "Você já compartilhou hoje" notice.
6. IF a user who is not a member of the circle attempts to post THEN the system SHALL reject it with an `unauthorized` error.
7. WHILE the member has not posted today the feed SHALL show a prompt "O que você fez offline hoje?" with the action "Escrever relato" that opens the composer.
8. IF the circle has no stories the empty state SHALL include the action "Escrever relato".

**Independent Test**: Post once, see the composer replaced; try posting again via the repository and see rejection.

---

### P1: Finite feed ⭐ MVP

**User Story**: As a member, I want to read my circle's recent stories and reach the end so that I know when I am done.

**Why P1**: The finite feed is the central anti-feature promise.

**Acceptance Criteria**:

1. WHEN a member opens the feed THEN the system SHALL list the circle's stories from the last 7 days including today, newest first.
2. The system SHALL render the feed as a `FlatList` whose last element is the text "você chegou ao fim".
3. WHILE the feed is loading the system SHALL show a loading indicator.
4. IF the circle has no stories in the window THEN the system SHALL show an empty state "Ninguém compartilhou ainda" and the end marker SHALL NOT appear.
5. IF loading fails THEN the system SHALL show an error banner with a retry action.
6. The system SHALL NOT show any numeric like, reaction or view counter on a story.
7. The system SHALL show each story's author display name and local date.

**Independent Test**: Seed stories across 9 days; only the last 7 appear, newest first, followed by the end marker.

---

### P2: Qualitative reactions

**User Story**: As a member, I want to react to a friend's story so that they feel supported without a score.

**Why P2**: It enriches the feed but the feed stands without it.

**Acceptance Criteria**:

1. WHEN a member taps a reaction kind on another member's story THEN the system SHALL record that reaction and show it as selected.
2. WHEN a member taps a different kind on a story they already reacted to THEN the system SHALL replace the previous reaction.
3. WHEN a member taps the kind they already selected THEN the system SHALL remove the reaction.
4. IF a member attempts to react to their own story THEN the system SHALL reject it and not show reaction controls on it.
5. WHERE a story has received reactions the author SHALL see which reaction kinds were received, without counts.
6. IF recording the reaction fails THEN the system SHALL show the error message and restore the previous selection.

**Independent Test**: Account B reacts to A's story; A sees "Estou com você" without a number.

---

## Edge Cases

- WHEN the local date changes while the composer is open THEN the system SHALL evaluate the one-per-day rule against the new date at submit time.
- IF the story text contains only whitespace and newlines THEN the system SHALL treat it as empty.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| STORY-01 | P1: Post (AC 1-3) | Execute (T2, T3, T7, T9) | Implemented |
| STORY-02 | P1: Post (AC 4-6) | Execute (T3, T5, T7) | Implemented |
| STORY-03 | P1: Feed (AC 1-2, 7) | Execute (T1, T3, T5, T6, T9) | Implemented |
| STORY-04 | P1: Feed (AC 3-5) | Execute (T6) | Implemented |
| STORY-05 | P1: Feed (AC 6) | Execute (T1, T6) | Implemented |
| STORY-06 | P2: Reactions (AC 1-4) | Execute (T1, T4, T5, T8) | Implemented |
| STORY-07 | P2: Reactions (AC 5-6) | Execute (T4, T5, T8) | Implemented |
| STORY-08 | P1: Post (AC 7-8) | Execute (T11, T12) | Pending |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] The feed visibly ends with "você chegou ao fim" and shows no counters anywhere.
- [ ] A second post on the same day is impossible through UI and repository.
