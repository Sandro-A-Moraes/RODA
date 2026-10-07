# Pacts Validation

**Date**: 2026-10-07
**Spec**: `.specs/features/pacts/spec.md`
**Diff range**: `3ee4031..a11811d` (HEAD = `a11811d`) for `src/modules/pacts`; SQL in `supabase/migrations/0002_circles_pacts_stories.sql` (lines 154-232) and `0003_pacts_trim_checks.sql`.
**Iteration**: 1 of 3
**Verifier**: independent sub-agent (author != verifier, fresh context)

## Validation: pacts - PASS (with accepted manual-pending items)

All 9 requirements (PACT-01..09) are implemented, and each AC is anchored to a test that asserts the spec-defined outcome. Gate is green (51 suites, 436 tests, typecheck and lint exit 0). The discrimination sensor injected 23 behavior-level faults; 22 were killed and 1 survived as an equivalent mutant (cascade delete is unobservable through the in-memory repository, see gap 2). Remaining items are non-blocking: RLS, the unique constraint, `pact_progress`, the cascade and migration 0003 have no automated test by design (AD-002) and migration 0003 is not applied to the remote project.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T7 | Done | Commits `4c6c2e0`, `3ee4031`, `401969d`, `3d131b9`, `b8e2bd2`, `eaf1e6b`, `a11811d` |
| T-UI-1, T-UI-2, T-UI-3 | Done | Were "Pending" in `tasks.md`; reconciled with git: `fd43759`, `b95d0a8`, `be9ac09` (form commit `b95d0a8` and its fix `401969d`) |
| T8 | Done | This report plus traceability |
| Migration 0003 on project RODA | Pending user | Not applied (instruction); title of spaces still passes a direct API call until it is |
| Manual check on the real backend | Pending user | Spec Success Criteria unchecked; AD-002, not counted as failure |

---

## Spec-Anchored Acceptance Criteria

Impl = implementation `file:line` under `src/modules/pacts/`. Tests live in `src/modules/pacts/__tests__/`.

### P1: Create and list pacts (PACT-01, PACT-02)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 01 AC1 valid title + optional description: create in that circle, show in list | pact has `circleId`, trimmed title, creator, 0 progress; listed | `domain/pact-use-cases.ts:37-43`, `data/in-memory-pact-repository.ts:74-90`, `data/supabase-pact-repository.ts:117-136`, `presentation/pact-form-screen.tsx:67-74` | `in-memory-pact-repository.test.ts:38-54` (`toMatchObject` circleId c1, title `'Sem celular'`, createdBy u1, doneCount 0); `:56-63` (listed id); `pact-form-screen.test.tsx:46-61` (`create` called with trimmed fields, `onSaved` once), `:63-77` (empty description) | PASS |
| 01 AC2 title <3 or >60 after trim: "Título deve ter entre 3 e 60 caracteres", not created | exact message, repo not called | `domain/pact-use-cases.ts:11-16,28-35`; SQL `0003:10-11` | `pact-validation.test.ts:34-56` (`''`,`'  '`,`'ab'`,`'  ab  '`, 61 chars, padded 61: `toEqual({validation, TITLE_RULE})`, `create`/`update` `not.toHaveBeenCalled`); `:18-32` boundaries 3 and 60 accepted and trimmed; `:58-65` non-string; `pact-form-screen.test.tsx:79-93` (field error shown, `create` not called) | PASS |
| 01 AC3 description >280: "Descrição deve ter no máximo 280 caracteres" | exact message, 280 accepted | `pact-use-cases.ts:17-21`; SQL `0003:12-13` | `pact-validation.test.ts:69-81` (0, 280, padded 280 accepted), `:83-97` (281 rejected, message `toEqual`, repo not called), `:99-106`; `pact-form-screen.test.tsx:95-108,109-120` | PASS |
| 02 AC4 only that circle's pacts, oldest first | order Primeiro, Segundo, Terceiro; other circle excluded | `in-memory-pact-repository.ts:59-65`; `supabase-pact-repository.ts:56-78` (`eq circle_id`, `order created_at asc`) | `in-memory-pact-repository.test.ts:65-79` (`toEqual` three titles), `pact-use-cases.test.ts:69-82`; `pacts-view.test.tsx:84-101` (buttons `toEqual(['Primeiro pacto','Segundo pacto'])`, other circle `toBeNull`) | PASS in-memory; the Supabase `order` clause is untested by design (gap 3) |
| 02 AC5 loading indicator | "Carregando" shown | `presentation/pacts-view.tsx:37-41` | `pacts-view.test.tsx:45-52` (`getByLabelText('Carregando')`) | PASS |
| 02 AC6 empty state with "Criar pacto" | action fires | `pacts-view.tsx:48-58` | `pacts-view.test.tsx:54-62` (`Nenhum pacto ainda`, press, `onCreate` once) | PASS |
| 02 AC7 load failure: banner with retry | message, retry recovers | `pacts-view.tsx:42-44` | `pacts-view.test.tsx:64-82` (network text, press "Tentar novamente", list shown) | PASS |

### P1: Check in (PACT-03, PACT-04, PACT-05)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 03 AC1 member who has not checked in: one record for member, pact, day | `doneCount` 1, `checkedInByMe` true | `in-memory-pact-repository.ts:113-131`, `supabase-pact-repository.ts:181-193`, `presentation/pact-detail-screen.tsx:41-45` | `in-memory-pact-repository.test.ts:127-137`; `pact-detail-screen.test.tsx:147-160` (`checkIn` called with `(pactId, localDay())`, "1 de 3") | PASS |
| 03 AC2 second check-in rejected, one record | `conflict` "Você já fez check-in hoje", count 1 | `in-memory-pact-repository.ts:122-128`; `supabase-pact-repository.ts:35-37`; SQL `unique (pact_id, user_id, day)` (`0002:173`) | `in-memory-pact-repository.test.ts:139-152` (`toEqual({conflict, message})`, count 1), `:154-166` (`Promise.all` double tap: one `ok`, count 1), `:168-180` new day accepted; `supabase-pact-repository.test.ts:55-62,102-109` (23505 to conflict) | PASS in-memory; the SQL constraint itself manual-pending |
| 03 AC3 already checked in: "Check-in feito hoje", button disabled | label and `disabled` true | `pact-detail-screen.tsx:133-140` | `pact-detail-screen.test.tsx:147-160` (`accessibilityState.disabled` true, "Fazer check-in" gone), `:162-173`; double tap in UI `:174-193` (`checkIn` called once) | PASS |
| 04 AC1 non-member: `unauthorized` | code `unauthorized`, nothing recorded | `in-memory-pact-repository.ts:119-121`; RLS `check_ins_insert_member` (`0002:201-209`); `supabase-pact-repository.ts:38` | `in-memory-pact-repository.test.ts:206-217` (code, count stays 0), `:219-227` signed out; `supabase-pact-repository.test.ts:64-73,110-117` (42501) | PASS in-memory and mapper; RLS manual-pending |
| 04 AC2 failure: message shown, button available | error text, `disabled` false, retry works | `pact-detail-screen.tsx:132,138` (`useAsyncAction`) | `pact-detail-screen.test.tsx:194-214` (offline text, `disabled` `toBe(false)`, retry gives "1 de 3", error cleared) | PASS |
| 05 AC1 no ranking, ordering or comparison | no member names, no ranking text | `Pact` has no member list (`domain/pact-repository.ts:5-17`); `pacts-view.tsx`; detail note `pact-detail-screen.tsx:128-130` | `pact-progress.test.ts:121-140` (exact key list of `Pact`), `pacts-view.test.tsx:164-172` (`queryByText(/ranking\|u1\|u2/i)` null), `pact-detail-screen.test.tsx:102-112` | PASS |

### P1: Collective progress (PACT-05, PACT-06, PACT-07)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 06 AC1 "X de N hoje" (X distinct members today, N current members) | 2 of 3 | `in-memory-pact-repository.ts:46-57`; SQL `pact_progress` (`0002:212-229`); `pacts-view.tsx:112` | `pact-progress.test.ts:52-67` (done 2, member 3, 67); `pacts-view.test.tsx:103-119` (`findByText('2 de 3 hoje')`, `'67%'`); `pact-detail-screen.test.tsx:70-89` (`'2 de 3'`, ring `now: 67`) | PASS with spec-precision gap 1 (detail shows "2 de 3" without "hoje") |
| 06 AC2 percent = X/N rounded to nearest | 2/3=67, 1/8=13, 1/2=50 | `domain/pact-use-cases.ts:23-26` | `pact-progress.test.ts:33-45` (8 rows via `toBe`, includes 1 of 8 = 13 and 1 of 3 = 33), `pact-use-cases.test.ts:34-42` (5/7=71, 3/7=43, 6/7=86) | PASS |
| 06 AC3 N=0: 0%, no divide by zero | 0 | `pact-use-cases.ts:24` | `pact-progress.test.ts:39-42,47-49` (`Number.isFinite`), `:96-105`; `pacts-view.test.tsx:140-148` ("0 de 0 hoje", "0%"); `pact-detail-screen.test.tsx:91-100` | PASS |
| 07 AC4 new check-in updates progress without reopening | progress changes after press | `pact-detail-screen.tsx:41-45` (`reload` after success) | `pact-detail-screen.test.tsx:147-160` ("0 de 3" to "1 de 3" without remount); `pact-progress.test.ts:107-119` (repository level) | PASS |
| 05 AC5 aggregate only | no per-person data | `check_ins_select_own` (`0002:197-199`), `pact_progress` returns counts and `i_did` | `pact-progress.test.ts:121-140`; `pact-detail-screen.test.tsx:102-112` | PASS in code; RLS manual-pending |

### P1: Edit and delete pacts (PACT-08, PACT-09)

| Criterion | Spec-defined outcome | Impl | Test `file:line` + assertion | Result |
| --------- | -------------------- | ---- | ---------------------------- | ------ |
| 08 AC1 creator saves valid changes, sees updated pact | updated title and description | `in-memory-pact-repository.ts:90-98`; `supabase-pact-repository.ts:148-162`; `pact-form-screen.tsx:67-74` | `in-memory-pact-repository.test.ts:239-256` (`toMatchObject`, `get` shows new title); `pact-form-screen.test.tsx:164-183` (prefilled, `update` called with new fields, `onSaved`), `:185-197` validation on edit | PASS |
| 08 AC2 non-creator: `unauthorized`, no edit controls | code and hidden control | `in-memory-pact-repository.ts:92-94`; RLS `pacts_update_creator`; `pact-detail-screen.tsx:58,65-69` | `in-memory-pact-repository.test.ts:258-271` (code, title unchanged); `pact-detail-screen.test.tsx:227-236` (`queryByRole 'Editar pacto'` null); `supabase-pact-repository.test.ts:150-161` | PASS |
| 09 AC3 "Apagar" asks confirmation first | dialog shown, `remove` not called | `pact-detail-screen.tsx:141-147,152-207` | `pact-detail-screen.test.tsx:238-253` (title, body text, `remove` `not.toHaveBeenCalled`) | PASS |
| 09 AC4 confirm: delete pact and check-ins, remove from list | list empty, `onBack` | `in-memory-pact-repository.ts:100-111`; SQL cascade `0002:169`; `pact-detail-screen.tsx:46-53` | `in-memory-pact-repository.test.ts:285-300` (list `[]`, later `checkIn` `not_found`); `pact-detail-screen.test.tsx:271-285` (`onBack` once, `get` not ok, list `[]`) | PASS; cascade of check-ins not observable in memory (gap 2) |
| 09 AC5 cancel keeps pact | unchanged | `pact-detail-screen.tsx:199-203` | `pact-detail-screen.test.tsx:255-269` (dialog gone, `remove` not called, `onBack` not called, `get` ok) | PASS |
| 09 AC6 non-creator delete: `unauthorized`, no delete control | code and hidden control | `in-memory-pact-repository.ts:102-104`; RLS `pacts_delete_creator`; `pact-detail-screen.tsx:141` | `in-memory-pact-repository.test.ts:273-283`; `pact-detail-screen.test.tsx:227-236`; `supabase-pact-repository.test.ts:186-196` | PASS |
| 09 AC7 pact gone: `not_found` message | "Não encontramos o que você procura." | `in-memory-pact-repository.ts:91,101`; `supabase-pact-repository.ts:139-145,153,164-171` | `in-memory-pact-repository.test.ts:315-339`; `supabase-pact-repository.test.ts:137-148,173-184` (probe returns null gives `not_found`); `pact-detail-screen.test.tsx:286-301` (delete of vanished pact, `onBack` not called); `pact-form-screen.test.tsx:217-228` (on load and on save) | PASS |

### Edge cases

| Edge case | Evidence | Result |
| --------- | -------- | ------ |
| Double tap records exactly one check-in | UI: `pact-detail-screen.test.tsx:174-193` (`checkIn` `toHaveBeenCalledTimes(1)`); repository: `in-memory-pact-repository.test.ts:154-166`; SQL unique constraint | PASS |
| Local date changes while screen is open: next check-in belongs to the new day | `localDay()` is computed on every call (`pact-detail-screen.tsx:39,42`); repository day rollover tested at `in-memory-pact-repository.test.ts:168-180`; no test advances the clock with the detail screen mounted | PASS at repository level; screen-level rollover untested (gap 4) |
| Member joins after check-ins: N includes them | `pact-progress.test.ts:80-94` (`memberCount` 3 after joining, `doneCount` 1); SQL counts `circle_members` at read time (`0002:221`) | PASS |

### Spec-precision gaps

- Progress AC1 says the system shows "X de N hoje" plus the percentage. The list card shows both texts. The detail screen shows "Hoje" as a label, "X de N" as the numeral and "fizeram o check-in", and the percentage only as the ring's accessibility value and visual arc (no percent text). Tests assert that rendering. Either the spec should say "on the list card" or the detail should print the percent. Not blocking (Figma-driven design, AD-005 unaffected).
- Edit/delete AC3 names the control "Apagar"; the detail button is "Apagar pacto" and the dialog confirm button is "Apagar". Tests assert both. Consistent with the intent.
- Edit/delete AC4 "delete its check-ins" has no outcome observable below the real backend.

---

## Gate Check (Build level)

| Command | Result |
| ------- | ------ |
| `npm test` | 51 suites, 436 tests passed, 0 failed, 0 skipped |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |

Pacts suites alone: 128 tests in 8 suites. No weakened, skipped or deleted assertions seen.

---

## Discrimination Sensor

Method: each fault applied in place with `sed`, `npx jest src/modules/pacts` run, file restored with `git checkout -- <file>`. `git status --porcelain` and `git diff --stat` were empty before the run and after the last restore (identical baseline).

| # | Fault | Failing tests | Result |
| - | ----- | ------------- | ------ |
| 1 | title min 3 to 2 | 6 | Killed |
| 2 | title max 60 to 61 | 4 | Killed |
| 3 | title `.trim()` removed | 7 | Killed |
| 4 | description max 280 to 281 | 3 | Killed |
| 5 | `progressPercent` `Math.round` to `Math.floor` | 7 | Killed |
| 6 | `progressPercent` N=0 guard removed | 8 | Killed |
| 7 | in-memory check-in uniqueness disabled | 3 | Killed |
| 8 | in-memory `update` creator check removed | 2 | Killed |
| 9 | in-memory `remove` creator check removed | 2 | Killed |
| 10 | in-memory `checkIn` membership check removed | 1 | Killed |
| 11 | in-memory `remove` stops deleting the pact's check-ins | 0 | **Survived (equivalent)**: ids come from a monotonically increasing sequence and `checkIn` on a deleted pact returns `not_found`, so orphan rows are unobservable |
| 12 | `listByCircle` drops the circle filter | 3 | Killed |
| 13 | `view` counts check-ins of every day | 3 | Killed |
| 14 | `mapPactError` conflict message changed | 1 | Killed |
| 15 | `missingOrForbidden` result inverted | 4 | Killed |
| 16 | `mapPactError` drops the 23514 mapping | 1 | Killed |
| 17 | detail screen `mine` always true (controls shown to all) | 1 | Killed |
| 18 | check-in button no longer disabled after check-in | 2 | Killed |
| 19 | list card percent computed wrongly | 1 | Killed |
| 20 | "Apagar pacto" deletes without confirmation | 4 | Killed |
| 21 | hard-coded hex color in `pact-detail-screen.tsx` | n/a: `eslint` exit 1, `Hex color literal outside src/core/theme` (`no-restricted-syntax`) | Killed by lint gate |
| 22 | detail screen stops reloading after check-in (PACT-07) | 2 | Killed |
| 23 | detail screen bypasses the pending guard of `useAsyncAction` (double tap) | 2 | Killed |

22 of 23 killed; 1 survivor judged equivalent at the repository interface (gap 2).

---

## Code Quality Check

| Check | Pass? |
| ----- | ----- |
| No features beyond what was asked (no ranking, streaks, reminders; AD-005) | Yes |
| Only required files touched; module layering follows AD-001..AD-003 | Yes |
| Tests map to ACs or listed edge cases; no unclaimed tests | Yes |
| No hardcoded hex colors in pacts code (theme roles; ESLint rule enforced and mutation-checked) | Yes |
| Spec-anchored outcome check: exact messages asserted | Yes |
| SQL read: RLS on both tables, creator-only update/delete, member-only insert, `pact_progress` revokes `public`/`anon`, cascade on `check_ins.pact_id` | Yes |
| Project guidelines followed (Coverage Matrix in `tasks.md`, `docs/PROJECT_CONTEXT.md`) | Yes |

---

## Ranked Gaps (none blocking)

1. Migration `0003_pacts_trim_checks.sql` is not applied to project RODA; until it is, the SQL caps are not trim-aware (a title of spaces passes via a direct API call). Needs user action; then run a manual check.
2. Cascade delete of check-ins (Edit/delete AC4) has no automated test (mutant 11 is equivalent in memory). Verify in the manual run: delete a pact that has check-ins and confirm `check_ins` is empty for it.
3. `SupabasePactRepository` queries (`order created_at`, `pact_progress` RPC mapping, `i_did`), RLS isolation, the unique constraint under real double taps and "two accounts see the same X de N" (Success Criteria) are manual-pending by AD-002.
4. Day rollover with the detail screen mounted is covered only at the repository level; a screen test with a faked clock would close it. Low risk since `localDay()` is evaluated per call.
5. Detail screen shows no percent text (see spec-precision gaps); decide to amend the spec or the screen.
6. The skill validators (`validate_tasks.py`, `validate_state.py`) were not run: `python3` is unavailable on this machine. Structure checked by reading.

## Lessons

No failing gate or failing AC; the single survivor is an equivalent mutant. No lessons distilled.
