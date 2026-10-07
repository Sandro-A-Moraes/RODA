-- Pact title and description bounds measured after trimming, as the app does.
-- Without this, a direct API call could store a title of only spaces.
-- NOT applied yet: run it against project RODA before relying on it.

alter table public.pacts
  drop constraint if exists pacts_title_check,
  drop constraint if exists pacts_description_check;

alter table public.pacts
  add constraint pacts_title_check
    check (char_length(btrim(title)) between 3 and 60),
  add constraint pacts_description_check
    check (char_length(btrim(description)) <= 280);
