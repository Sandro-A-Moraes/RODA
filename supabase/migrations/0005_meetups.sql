-- Meetups: tables, row level security and the creator-going trigger.
-- Applied to project RODA through the Supabase MCP.

create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  title text not null
    constraint meetups_title_check check (char_length(btrim(title)) between 3 and 60),
  place text not null
    constraint meetups_place_check check (char_length(btrim(place)) between 3 and 100),
  starts_at timestamptz not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index meetups_circle_idx on public.meetups (circle_id, starts_at);

create table public.meetup_rsvps (
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('going', 'not_going')),
  primary key (meetup_id, user_id)
);

alter table public.meetups enable row level security;
alter table public.meetup_rsvps enable row level security;

create function public.meetup_circle(p_meetup uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select circle_id from public.meetups where id = p_meetup;
$$;

revoke execute on function public.meetup_circle(uuid) from public, anon;
grant execute on function public.meetup_circle(uuid) to authenticated;

create policy "meetups_select_member" on public.meetups
  for select to authenticated
  using (public.is_circle_member(circle_id));

-- A meetup must start in the future when it is created. This lives in the
-- insert policy, not in a CHECK: now() is not immutable and meetups have no
-- update policy, so insert is the only way a client sets starts_at.
create policy "meetups_insert_member" on public.meetups
  for insert to authenticated
  with check (
    public.is_circle_member(circle_id)
    and created_by = (select auth.uid())
    and starts_at > now()
  );

-- Members see who answered what: planning needs the names going.
create policy "meetup_rsvps_select_member" on public.meetup_rsvps
  for select to authenticated
  using (public.is_circle_member(public.meetup_circle(meetup_id)));

create policy "meetup_rsvps_insert_own_member" on public.meetup_rsvps
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_circle_member(public.meetup_circle(meetup_id))
  );

create policy "meetup_rsvps_update_own_member" on public.meetup_rsvps
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and public.is_circle_member(public.meetup_circle(meetup_id))
  );

-- The proposer is going from the start (MEET-01 AC1).
create function public.meetup_creator_going()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.meetup_rsvps (meetup_id, user_id, status)
  values (new.id, new.created_by, 'going');
  return new;
end;
$$;

revoke execute on function public.meetup_creator_going() from public, anon, authenticated;

create trigger meetups_creator_going
  after insert on public.meetups
  for each row execute function public.meetup_creator_going();
