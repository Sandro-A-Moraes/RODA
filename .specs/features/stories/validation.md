# Stories Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/stories/spec.md`
**Diff range**: `5c3ff0f..0f5678d` (HEAD = `0f5678d`, commits `3404716`..`0f5678d`) for `src/modules/stories/`, `app/_layout.tsx`, `app/(app)/circles/[id]/index.tsx`, `app/(app)/circles/[id]/stories/new.tsx`; SQL already in `supabase/migrations/0002_circles_pacts_stories.sql` (lines 234-311), no new migration.
**Iteration**: 1 of 3
**Verifier**: independent sub-agent (author != verifier, fresh context)

## Validation: stories - PASS (with ranked non-blocking gaps and manual-pending items)

All 7 requirements (STORY-01..07) are implemented, and every AC is anchored to a test that asserts the spec-defined outcome: exact Portuguese strings, 280 accepted and 281 rejected after trim, today-6 in and today-7 out, end marker only when there are stories, no digits rendered, toggle/replace/remove, own-story rejection, deduplicated kinds. Gate is green (58 suites, 509 tests; typecheck and lint exit 0). The discrimination sensor injected 35 behavior-level faults in an isolated git worktree and all 35 were killed. The review found no defect reachable through the app. It found server-side gaps that only a crafted API call can reach, all in migration 0002 (outside the diff range): the reaction UPDATE policy lets a user move a reaction onto their own story (gap 1), `stories.day` is chosen by the client with no server bound and the feed has only a lower bound (gap 2), and the body check is not trim-aware (gap 3). Gaps 1-3 should become one hardening migration before the demo.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T10 | Done | Commits `3404716`, `2107790`, `dbc0061`, `3a5e5ea`, `fae5b63` (style), `d2570ac`, `dbbf3f3`, `b3d1c42`, `4efff53`, `5c8aa80`, `0f5678d` |
| Manual check on the real backend | Pending user | Spec Success Criteria unchecked; AD-002, not counted as failure |

`validate_tasks.py stories`: 0 errors, 9 warnings (multi-file `Where`, `Tests: none` on T1/T9/T10 matching the Coverage Matrix).

---

## Spec-Anchored Acceptance Criteria

Impl paths are under `src/modules/stories/`; tests under `src/modules/stories/__tests__/`.

### P1: Post a daily story (STORY-01, STORY-02)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 01 AC1 text 1-280: saved to the circle for the local day, shown in the feed | stored trimmed, `circleId`, `day` = local day, listed | `domain/story-validation.ts:12-16`, `domain/story-use-cases.ts:8-17`, `data/in-memory-story-repository.ts:84-113`, `data/supabase-story-repository.ts:95-113`, `presentation/story-composer-screen.tsx:48-54` | `story-validation.test.ts:35-50` (`'x'`, padded, 280, newline-padded 280: `toBe(stored)`, `create` `toHaveBeenCalledWith('c1', stored, TODAY)`); `in-memory-story-repository.test.ts:38-62` (`toMatchObject` circleId, day TODAY, trimmed body; listed `toEqual(['Li um livro no parque'])`); `story-composer-screen.test.tsx:83-100` (create with trimmed body and `'2026-10-07'`, `onSaved` once, repository holds the story), `:102-113` (280 accepted) | PASS |
| 01 AC2 empty after trim: "Escreva algo para compartilhar", not saved | exact message, repository not called | `story-validation.ts:8,13-15` | `story-validation.test.ts:54-67` (`''`, `' '`, `'   '`, `'\n'`, `' \n\t \n '`: `toEqual({code:'validation', message: EMPTY_RULE})`, `create` `not.toHaveBeenCalled`); `:88-103` non-string; `story-composer-screen.test.tsx:115-129` (`findByText(EMPTY)`, no create, no `onSaved`) | PASS |
| 01 AC3 over 280: "Máximo de 280 caracteres", not saved | exact message; 280 in, 281 out | `story-validation.ts:6,9,16` | `story-validation.test.ts:71-84` (281 and padded 281: `toEqual({validation, LENGTH_RULE})`, no create); `story-composer-screen.test.tsx:131-142` | PASS |
| 02 AC4 second story same day: "Você já compartilhou hoje", one record | `conflict` with exact message; one body listed | `in-memory-story-repository.ts:95-101`; `data/map-story-error.ts:10-12`; SQL `unique (circle_id, author_id, day)` (`0002:243`) | `in-memory-story-repository.test.ts:66-78` (`toEqual({code:'conflict', message:'Você já compartilhou hoje'})`, list `['Primeiro']`), `:80-111` (other day, other member, other circle allowed); `supabase-story-repository.test.ts:4-11` (23505 to the same conflict); `story-composer-screen.test.tsx:144-158` (notice shown, `onSaved` not called, one record) | PASS in-memory and mapper; SQL constraint manual-pending |
| 02 AC5 already posted today: composer replaced by "Você já compartilhou hoje" | notice, no field, no "Compartilhar" | `presentation/story-composer-screen.tsx:70-71`; `presentation/stories-view.tsx:28-30,146-152` | `story-composer-screen.test.tsx:160-169` (`findByText(ALREADY)`, field and button `toBeNull`), `:171-182` (yesterday's own story or someone else's today keeps the composer); `stories-view.test.tsx:151-169` (feed notice only after my own post today) | PASS |
| 02 AC6 non-member posts: `unauthorized` | code `unauthorized`, nothing stored | `in-memory-story-repository.ts:89-93`; RLS `stories_insert_member` (`0002:287-289`); `map-story-error.ts:14` | `in-memory-story-repository.test.ts:115-125` (code, list `[]`), `:127-134` (signed out); `supabase-story-repository.test.ts:13-23` (42501) | PASS in-memory and mapper; RLS manual-pending |

### P1: Finite feed (STORY-03, STORY-04, STORY-05)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 03 AC1 last 7 days incl. today, newest first | 9-day seed gives days 0..6 descending; today-6 in, today-7 out; same day newest first | `domain/feed-window.ts:4-11`; `in-memory-story-repository.ts:65-82`; `supabase-story-repository.ts:70-76` (`gte day`, `order day desc, created_at desc`) | `in-memory-story-repository.test.ts:138-155` (`toEqual` seven days `2026-10-07`..`2026-10-01`), `:157-165` (`['Seis dias']`), `:167-182` (`['Terceira','Segunda','Primeira']`), `:202-219` (other circle and non-member hidden); `stories-view.test.tsx:96-119` (rendered order, out-of-window and other circle `toBeNull`) | PASS in-memory; Supabase query untested by design (AD-002) |
| 03 AC2 `FlatList` whose last element is "você chegou ao fim" | last rendered text is the end marker | `stories-view.tsx:93-105,141-156` (`ListFooterComponent`) | `stories-view.test.tsx:118` (`texts[texts.length - 1]` `toBe(END)`), `:167-168` | PASS |
| 03 AC7 author display name and local date | name then date before each body | `stories-view.tsx:18-25,72-75` | `stories-view.test.tsx:121-149` (`['Ana Souza','hoje']`, `['Beto Lima','ontem']`, `['Carla Dias','DD/MM']`); `in-memory-story-repository.test.ts:184-200` (`authorName 'Bruno'`, `day '2026-10-05'`) | PASS with spec-precision gap 1 (date format) |
| 04 AC3 loading indicator | "Carregando", no end marker | `stories-view.tsx:119-126` | `stories-view.test.tsx:55-63` | PASS |
| 04 AC4 no stories: "Ninguém compartilhou ainda", no end marker | exact title, `queryByText(END)` null | `stories-view.tsx:130-137` | `stories-view.test.tsx:65-72` | PASS |
| 04 AC5 load failure: banner with retry | network text, retry shows stories | `stories-view.tsx:127-129` | `stories-view.test.tsx:74-94` | PASS |
| 05 AC6 no numeric like, reaction or view counter | no digit rendered; `Story` has no number field | `domain/story-repository.ts:10-23`; `stories-view.tsx` | `stories-view.test.tsx:171-183` (`queryByText(/\d/)` null); `reaction-bar.test.tsx:124-125,133-134`; `story-reactions.test.ts:167-181` (no `number` values on `Story`) | PASS |

### P2: Qualitative reactions (STORY-06, STORY-07)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 06 AC1 tap a kind: recorded, shown selected | `myReaction` = kind; chip `selected` true | `presentation/reaction-bar.tsx:34-49`; `in-memory-story-repository.ts:115-134`; `supabase-story-repository.ts:131-136` (upsert) | `story-reactions.test.ts:37-46` (`myReaction` `toBe('with_you')`); `reaction-bar.test.tsx:70-81` (`selected` true/false, repository `with_you`) | PASS |
| 06 AC2 another kind replaces | `inspired` only; author sees `['inspired']` | `reaction-bar.tsx:36`; `in-memory-story-repository.ts:128-132` | `story-reactions.test.ts:48-58`; `reaction-bar.test.tsx:83-94` | PASS |
| 06 AC3 same kind removes | `myReaction` null; received `[]` | `reaction-bar.tsx:36` (`null`); `in-memory-story-repository.ts:131`; `supabase-story-repository.ts:126-130` (delete) | `story-reactions.test.ts:60-71`; `reaction-bar.test.tsx:96-106` | PASS |
| 06 AC4 own story: rejected, no controls | `unauthorized`, nothing stored; no chips | `in-memory-story-repository.ts:125-127`; RLS `reactions_insert_member` (`0002:296-302`); `stories-view.tsx:79-88` | `story-reactions.test.ts:87-97`; `reaction-bar.test.tsx:108-114` (both chips `toBeNull`) | PASS in-memory; RLS has a bypass through UPDATE (gap 1) |
| 07 AC5 author sees kinds received, no counts | `Recebeu: Estou com você` (deduplicated), both kinds listed once, nothing for others | `in-memory-story-repository.ts:59-61`; `supabase-story-repository.ts:57-59`; `reaction-bar.tsx:69-77`; RLS `reactions_select_own_or_author` (`0002:292-294`) | `story-reactions.test.ts:133-165`; `reaction-bar.test.tsx:116-151` (`getByText('Recebeu: Estou com você')` after two identical reactions, then `'Recebeu: Estou com você · Me inspirou'`, no digit, nothing for non-authors) | PASS |
| 07 AC6 failure: error shown, previous selection restored | network text; previous chip selected; repository unchanged | `reaction-bar.tsx:40-48` | `reaction-bar.test.tsx:153-171` | PASS |

### Edge cases

| Edge case | Evidence | Result |
| --------- | -------- | ------ |
| Date changes while composer is open: rule evaluated at submit | `story-composer-screen.tsx:48-49` reads `localDay()` per submit; `story-composer-screen.test.tsx:184-201` (`create` called with `'2026-10-08'`, `onSaved` once) | PASS |
| Only whitespace and newlines is empty | `story-validation.test.ts:54-67` (`'\n'`, `' \n\t \n '`); `story-composer-screen.test.tsx:115` | PASS |

### Spec-precision gaps

1. STORY-03 AC7 "local date" has no format; the feed renders "hoje", "ontem" or `DD/MM` (Figma 08) and the tests assert that rendering. Amend the spec to name the format.
2. STORY-06 AC4 "reject it" names no error code; the implementation and tests use `unauthorized`, whose shared message is "Você precisa entrar para continuar." (wrong wording for a signed-in member; see gap 5). The UI never offers the action, so the message only appears through a direct call.
3. STORY-07 AC6 "show the error message" is generic; tests assert the network message, which is the only failure the UI can hit.
4. The composer counter "N de 280" comes from Figma 14 and `tasks.md`, not the spec; tested at `story-composer-screen.test.tsx:73-81`.

---

## Gate Check (Build level)

| Command | Result |
| ------- | ------ |
| `npm test` | 58 suites, 509 tests passed, 0 failed, 0 skipped |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |

Stories suites alone: 73 tests in 7 suites. Before the feature: 436 tests (pacts report); delta +73. No weakened, skipped or deleted assertions seen.

---

## Discrimination Sensor

Method: `git worktree add --detach <scratchpad>/wt HEAD`, with `node_modules` linked as a directory junction. A Python script applied each fault (`str.replace` on one file), ran `npx jest src/modules/stories` in the worktree, and restored the file from memory after each run. Afterwards the junction was removed with `rmdir` (this removes only the link; the real `node_modules` is intact), then the worktree was removed with `git worktree remove --force` and pruned. The scratch worktree's own porcelain was empty before removal. Real-tree porcelain: the baseline was ` M docs/FIGMA_SCREENS.md`; after cleanup it is only `?? .specs/features/stories/validation.md` (this report). The user committed the `FIGMA_SCREENS.md` change during the sensor run (`1ec33b0`, author Sandro-A-Moraes); the Verifier never touched that file.

Unmutated worktree run: 73/73 passed. A first cold-cache run showed 3 timeouts that did not come back. Every kill count below is small and specific, so none of the kills comes from that flakiness.

| # | File | Fault | Failing tests | Result |
| - | ---- | ----- | ------------- | ------ |
| 1 | `domain/feed-window.ts:10` | window off by one (`FEED_DAYS - 1` to `FEED_DAYS`, today-7 included) | 3 | Killed |
| 2 | `domain/feed-window.ts:10` | window one day short (`FEED_DAYS - 2`) | 3 | Killed |
| 3 | `data/in-memory-story-repository.ts:78` | day order reversed (oldest first) | 3 | Killed |
| 4 | `data/in-memory-story-repository.ts:77` | same-day order reversed | 1 | Killed |
| 5 | `data/in-memory-story-repository.ts:74` | window filter dropped | 3 | Killed |
| 6 | `data/in-memory-story-repository.ts:74` | circle filter dropped | 2 | Killed |
| 7 | `domain/story-validation.ts:14` | `.trim()` dropped | 10 | Killed |
| 8 | `domain/story-validation.ts:16` | max 280 to 281 | 3 | Killed |
| 9 | `domain/story-validation.ts:15` | min 1 to 0 | 8 | Killed |
| 10 | `domain/story-validation.ts:8` | empty message changed | 12 | Killed |
| 11 | `domain/story-use-cases.ts:15-16` | `createStory` skips validation | 19 | Killed |
| 12 | `data/in-memory-story-repository.ts:97` | unique-day check skipped | 2 | Killed |
| 13 | `data/in-memory-story-repository.ts:97` | unique-day check ignores the circle | 1 | Killed |
| 14 | `data/in-memory-story-repository.ts:100` | conflict message dropped | 4 | Killed |
| 15 | `data/in-memory-story-repository.ts:91` | non-member can post | 1 | Killed |
| 16 | `data/in-memory-story-repository.ts:125` | own-story reaction allowed | 1 | Killed |
| 17 | `data/in-memory-story-repository.ts:131` | previous reaction not removed (replace adds a second row) | 4 | Killed |
| 18 | `data/in-memory-story-repository.ts:131` | `null` does not remove | 2 | Killed |
| 19 | `data/in-memory-story-repository.ts:59` | `receivedKinds` shown to every viewer | 1 | Killed |
| 20 | `data/in-memory-story-repository.ts:60` | `receivedKinds` not deduplicated | 2 | Killed |
| 21 | `presentation/reaction-bar.tsx:36` | toggle bug: same kind stays selected | 1 | Killed |
| 22 | `presentation/reaction-bar.tsx:36` | replace bug: another kind removes | 1 | Killed |
| 23 | `presentation/reaction-bar.tsx:41-42` | no rollback on failure | 1 | Killed |
| 24 | `presentation/stories-view.tsx:79` | reaction controls on own story | 2 | Killed |
| 25 | `presentation/stories-view.tsx:153` | end marker removed | 2 | Killed |
| 26 | `presentation/stories-view.tsx:130` | empty state skipped (end marker on an empty feed) | 1 | Killed |
| 27 | `presentation/stories-view.tsx:78` | "N reações" count rendered on each story | 2 | Killed |
| 28 | `presentation/reaction-bar.tsx:74` | received count appended for the author | 1 | Killed |
| 29 | `presentation/stories-view.tsx:29` | notice never shown | 2 | Killed |
| 30 | `presentation/stories-view.tsx:29` | notice shown for anyone's story today | 2 | Killed |
| 31 | `presentation/story-composer-screen.tsx:49` | composer uses the day captured at mount | 1 | Killed |
| 32 | `data/map-story-error.ts:11` | 23505 message dropped | 1 | Killed |
| 33 | `data/map-story-error.ts:14` | 42501 mapping dropped | 1 | Killed |
| 34 | `presentation/stories-view.tsx:22` | "ontem" off by one | 2 | Killed |
| 35 | `presentation/story-composer-screen.tsx:90` | counter max wrong (`de 300`) | 1 | Killed |

**Sensor depth**: 35 manual mutants, more than the lightweight tier asks for, covering every new branch of the domain, in-memory data, mapper and presentation. `SupabaseStoryRepository` was not mutated because it has no automated test by design (AD-002).
**Result**: 35/35 killed - PASS

---

## Code Quality Check

| Check | Pass? |
| ----- | ----- |
| No features beyond what was asked; AD-005 held: bounded window, `scrollEnabled={false}`, no `onEndReached`, no counts, `receivedKinds` is a deduplicated list | Yes |
| Module layering (AD-001): no imports from other modules in `src/modules/stories`; route files import only the barrel | Yes |
| No hex literals in stories code (grep empty; lint rule AD-006 green) | Yes |
| Tests map to ACs, edge cases or Done-when items; no unclaimed tests | Yes |
| Exact Portuguese messages asserted | Yes |
| Supabase repository read against migration 0002: `profiles(display_name)` embed resolves through the single FK `stories.author_id -> profiles.id` and is readable via `profiles_select_circle_mates`; reactions read once per feed with `.in(story_id)` and RLS limits them to own plus received; upsert uses `onConflict: 'story_id,user_id'` matching the primary key; delete is scoped to `user_id` | Yes, with gaps 1-3 |

---

## Ranked Gaps

1. **Major (server, direct API only)** - `supabase/migrations/0002_circles_pacts_stories.sql:304-307`: `reactions_update_own` checks only `user_id = auth.uid()`. A PATCH on `story_reactions` can therefore change `story_id` to the caller's own story (bypassing STORY-06 AC4 and the insert policy at `:296-302`) or to a story of a circle they left, and a removed member can keep changing `kind`. The app never does this (`src/modules/stories/data/supabase-story-repository.ts:131-136` upserts on the same key). An upsert that hits a conflict is checked only against the UPDATE policy, so the policy has to stay and be tightened. **Fix task**: migration `0004_stories_hardening.sql` that recreates the policy with `with check (user_id = (select auth.uid()) and public.is_circle_member(public.story_circle(story_id)) and public.story_author(story_id) <> (select auth.uid()))`, or `revoke update on public.story_reactions from authenticated; grant update (kind) on public.story_reactions to authenticated;`. Verify manually: a PATCH that sets `story_id` to the caller's own story is refused.
2. **Major/Minor (server, direct API only)** - `0002:240` and `supabase-story-repository.ts:105`: the client chooses `day` and the server does not bound it. A direct insert can backdate or future-date stories and post one story for any day it picks. The feed filters only `gte day` (`supabase-story-repository.ts:74`, `src/modules/stories/data/in-memory-story-repository.ts:74`), so a future-dated story stays at the top of the feed for weeks. **Fix task**: in 0004 add `check (day between current_date - 1 and current_date + 1)` on `stories` (allows for device timezones); add `.lte('day', today)` to the Supabase query and `s.day <= today` to the in-memory filter, with a test "a story dated tomorrow is not listed today".
3. **Minor (server, direct API only)** - `0002:241`: `check (char_length(body) between 1 and 280)` is not trim-aware, so the API can store a body of only spaces or newlines, and a padded body is measured differently from the app rule. **Fix task**: in 0004 replace it with `check (char_length(btrim(body, E' \t\n\r')) between 1 and 280)`. Plain `btrim(x)` trims only spaces, so the explicit character set is needed to match JS `trim()` for the whitespace-and-newlines edge case. The same newline gap exists in pacts `0003_pacts_trim_checks.sql:10-13` (out of scope here).
4. **Minor** - `src/modules/stories/data/map-story-error.ts:14` with `src/core/errors/app-error.ts:17`: a 42501 (non-member post, own-story reaction) shows "Você precisa entrar para continuar." to a member who is already signed in. **Fix task**: return `createAppError('unauthorized', 'Você não pode fazer isso neste círculo.')` (or similar) and update `supabase-story-repository.test.ts:13-23`.
5. **Minor** - `map-story-error.ts:16`: 23514 maps to the generic "Dados inválidos. Revise as informações e tente novamente." instead of the spec messages. Only reachable when client validation is bypassed or the rules drift apart; acceptable. Optional fix: read the constraint name (`stories_body_check`) and return the matching spec message.
6. **Minor** - `src/modules/stories/presentation/reaction-bar.tsx:34-49`: there is no pending guard, so rapid taps send concurrent upsert/delete calls. They can arrive out of order and leave the server with a different reaction than the chip on screen. **Fix task**: ignore presses while a call is pending (or disable the chips), with a double-tap test asserting a single `react` call.
7. **Info** - `in-memory-story-repository.ts:70` returns `ok([])` when signed out, while `supabase-story-repository.ts:69` returns `unauthorized`. Users never see this (routes are protected); align if convenient.
8. **Manual-pending (AD-002)** - `SupabaseStoryRepository` queries (window, order by `day` then `created_at`, `profiles(display_name)` embed, reaction read), RLS isolation, the unique constraint and both spec Success Criteria. Manual run: two accounts post, a second post on the same day is rejected, B reacts, A sees "Recebeu: Estou com você" with no number, and the feed ends with "você chegou ao fim".
9. **Spec-precision** - date format (STORY-03 AC7), rejection code and message (STORY-06 AC4), error message (STORY-07 AC6), and the counter that comes from Figma; see the section above. Amend the spec wording when convenient.

## Lessons

There was no failing gate, failing AC or surviving mutant. Two spec-precision gaps were recorded as candidate lessons: L-012 (name the display format of required dates and labels, from STORY-03 AC7) and L-013 (name the error code and message for every required rejection, from STORY-06 AC4). The review gaps (RLS update policy, day bound, trim-aware check) are not validation signals under `lessons.md`, so they were not recorded.

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| STORY-01..07 | Implemented | Verified in code (server hardening gaps 1-3 and the manual check pending) |
