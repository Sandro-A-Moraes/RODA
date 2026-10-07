-- Circles, pacts and stories: tables, row level security and RPCs.
-- Applied to project RODA through the Supabase MCP.

-- ---------------------------------------------------------------- circles

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  invite_code text not null unique check (invite_code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index circle_members_user_idx on public.circle_members (user_id);

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;

-- Membership helpers run as definer so policies never recurse into themselves.
create function public.is_circle_member(p_circle uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = p_circle and user_id = (select auth.uid())
  );
$$;

create function public.shares_circle_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_members mine
    join public.circle_members theirs on theirs.circle_id = mine.circle_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

revoke execute on function public.is_circle_member(uuid) from public, anon;
revoke execute on function public.shares_circle_with(uuid) from public, anon;
grant execute on function public.is_circle_member(uuid) to authenticated;
grant execute on function public.shares_circle_with(uuid) to authenticated;

create policy "circles_select_member" on public.circles
  for select to authenticated
  using (public.is_circle_member(id));

create policy "circle_members_select_member" on public.circle_members
  for select to authenticated
  using (public.is_circle_member(circle_id));

-- Members may read the display name of people who share a circle with them.
create policy "profiles_select_circle_mates" on public.profiles
  for select to authenticated
  using (public.shares_circle_with(id));

-- Atomic cap of 12 members (AD-003).
create function public.enforce_circle_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.circles where id = new.circle_id for update;
  if (select count(*) from public.circle_members where circle_id = new.circle_id) >= 12 then
    raise exception 'circle_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger circle_members_cap
  before insert on public.circle_members
  for each row execute function public.enforce_circle_cap();

create function public.create_circle(p_name text)
returns public.circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_circle public.circles;
begin
  if v_uid is null then
    raise exception 'unauthorized' using errcode = 'P0001';
  end if;
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.circles where invite_code = v_code);
  end loop;
  insert into public.circles (name, invite_code, created_by)
  values (btrim(p_name), v_code, v_uid)
  returning * into v_circle;
  insert into public.circle_members (circle_id, user_id) values (v_circle.id, v_uid);
  return v_circle;
end;
$$;

create function public.join_circle(p_code text)
returns public.circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_circle public.circles;
begin
  if v_uid is null then
    raise exception 'unauthorized' using errcode = 'P0001';
  end if;
  select * into v_circle from public.circles where invite_code = upper(btrim(p_code));
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.circle_members where circle_id = v_circle.id and user_id = v_uid) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  insert into public.circle_members (circle_id, user_id) values (v_circle.id, v_uid);
  return v_circle;
end;
$$;

revoke execute on function public.enforce_circle_cap() from public, anon, authenticated;
revoke execute on function public.create_circle(text) from public, anon;
revoke execute on function public.join_circle(text) from public, anon;
grant execute on function public.create_circle(text) to authenticated;
grant execute on function public.join_circle(text) to authenticated;

-- ------------------------------------------------------------------ pacts

create table public.pacts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 60),
  description text not null default '' check (char_length(description) <= 280),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index pacts_circle_idx on public.pacts (circle_id, created_at);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  pact_id uuid not null references public.pacts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (pact_id, user_id, day)
);

alter table public.pacts enable row level security;
alter table public.check_ins enable row level security;

create policy "pacts_select_member" on public.pacts
  for select to authenticated
  using (public.is_circle_member(circle_id));

create policy "pacts_insert_member" on public.pacts
  for insert to authenticated
  with check (public.is_circle_member(circle_id) and created_by = (select auth.uid()));

create policy "pacts_update_creator" on public.pacts
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "pacts_delete_creator" on public.pacts
  for delete to authenticated
  using (created_by = (select auth.uid()));

-- Members only read their own check-ins; the rest is exposed as an aggregate.
create policy "check_ins_select_own" on public.check_ins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "check_ins_insert_member" on public.check_ins
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.pacts p
      where p.id = pact_id and public.is_circle_member(p.circle_id)
    )
  );

-- Collective progress without revealing who checked in (PACT-05).
create function public.pact_progress(p_circle uuid, p_day date)
returns table (pact_id uuid, done_count integer, member_count integer, i_did boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    (select count(*) from public.check_ins c where c.pact_id = p.id and c.day = p_day)::integer,
    (select count(*) from public.circle_members m where m.circle_id = p.circle_id)::integer,
    exists (
      select 1 from public.check_ins c
      where c.pact_id = p.id and c.day = p_day and c.user_id = (select auth.uid())
    )
  from public.pacts p
  where p.circle_id = p_circle and public.is_circle_member(p.circle_id);
$$;

revoke execute on function public.pact_progress(uuid, date) from public, anon;
grant execute on function public.pact_progress(uuid, date) to authenticated;

-- ---------------------------------------------------------------- stories

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  day date not null,
  created_at timestamptz not null default now(),
  unique (circle_id, author_id, day)
);

create index stories_circle_idx on public.stories (circle_id, day desc);

create table public.story_reactions (
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('with_you', 'inspired')),
  primary key (story_id, user_id)
);

alter table public.stories enable row level security;
alter table public.story_reactions enable row level security;

create function public.story_circle(p_story uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select circle_id from public.stories where id = p_story;
$$;

create function public.story_author(p_story uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select author_id from public.stories where id = p_story;
$$;

revoke execute on function public.story_circle(uuid) from public, anon;
revoke execute on function public.story_author(uuid) from public, anon;
grant execute on function public.story_circle(uuid) to authenticated;
grant execute on function public.story_author(uuid) to authenticated;

create policy "stories_select_member" on public.stories
  for select to authenticated
  using (public.is_circle_member(circle_id));

create policy "stories_insert_member" on public.stories
  for insert to authenticated
  with check (public.is_circle_member(circle_id) and author_id = (select auth.uid()));

-- A reaction is visible to who gave it and to the story's author (kinds only, no counts in the UI).
create policy "reactions_select_own_or_author" on public.story_reactions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.story_author(story_id) = (select auth.uid()));

create policy "reactions_insert_member" on public.story_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_circle_member(public.story_circle(story_id))
    and public.story_author(story_id) <> (select auth.uid())
  );

create policy "reactions_update_own" on public.story_reactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "reactions_delete_own" on public.story_reactions
  for delete to authenticated
  using (user_id = (select auth.uid()));
