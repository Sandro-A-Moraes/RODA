-- Stories hardening (validation gaps 1-3 of .specs/features/stories/validation.md).
-- Closes server-side holes that only a crafted API call can reach.
-- Not yet applied to project RODA.

-- 1. A reaction update must satisfy the same rules as an insert. Without this,
-- a PATCH (or an upsert that hits a conflict) could move a reaction onto the
-- caller's own story, or onto a story of a circle the caller has left.

drop policy if exists "reactions_update_own" on public.story_reactions;

create policy "reactions_update_own" on public.story_reactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and public.is_circle_member(public.story_circle(story_id))
    and public.story_author(story_id) <> (select auth.uid())
  );

-- 2. The client picks stories.day (its local day). Bound it to the server day
-- +-1 so device time zones still work but a story cannot be backdated or
-- future-dated. This lives in the insert policy, not in a CHECK: current_date
-- is not immutable, a CHECK would be re-evaluated on any later update and on a
-- dump/restore of older rows, while stories have no update policy, so insert
-- is the only way a client sets day. Existing rows are untouched.

drop policy if exists "stories_insert_member" on public.stories;

create policy "stories_insert_member" on public.stories
  for insert to authenticated
  with check (
    public.is_circle_member(circle_id)
    and author_id = (select auth.uid())
    and day between current_date - 1 and current_date + 1
  );

-- 3. Body length measured after trimming spaces, tabs and newlines, as the app
-- does (plain btrim(x) trims only spaces). Existing padded bodies are trimmed
-- first; the constraint is validated only if no blank body remains, otherwise
-- it stays NOT VALID (enforced for new rows) instead of failing the migration.

update public.stories
  set body = btrim(body, E' \t\n\r')
  where body <> btrim(body, E' \t\n\r')
    and char_length(btrim(body, E' \t\n\r')) >= 1;

alter table public.stories
  drop constraint if exists stories_body_check;

alter table public.stories
  add constraint stories_body_check
    check (char_length(btrim(body, E' \t\n\r')) between 1 and 280) not valid;

do $$
begin
  if not exists (
    select 1 from public.stories where char_length(btrim(body, E' \t\n\r')) = 0
  ) then
    alter table public.stories validate constraint stories_body_check;
  else
    raise notice 'stories_body_check left NOT VALID: blank bodies exist';
  end if;
end;
$$;
