-- ---------------------------------------------------------------------------
-- Seed 20 SAMPLE paddlers into the current boat-planner event so the Boat
-- Assignments planner can be exercised with a full crew.
--
-- Run in: Supabase Dashboard → SQL Editor (executes as postgres, bypasses RLS).
--
-- Safe & reversible: every user gets an @sample.alpas.test email. To remove
-- them all later (cascades to their sign-ups):
--   delete from auth.users where email like '%@sample.alpas.test';
--
-- The target event is taken from JC Gabuya's existing real sign-up, so these
-- land in the SAME event/day you see in the planner. (The list's own "JC" row
-- is omitted — that's the already-present JC Gabuya.)
-- birthday is left null (none supplied); the Masters (40+) preset needs ages,
-- so it will treat these as age-unknown.
-- ---------------------------------------------------------------------------
with target as (
  select event_id, event_title
  from public.training_signups
  where name = 'JC Gabuya'
  order by created_at desc
  limit 1
),
people (name, slug, gender, side, weight, need_pfd, need_paddle) as (
  values
    ('Jepay',    'jepay',    'Female', 'Left',     56, false, false),
    ('Nancy',    'nancy',    'Female', 'Right',    52, false, false),
    ('Brendz',   'brendz',   'Female', 'Left',     71, false, false),
    ('Hazel',    'hazel',    'Female', 'Left',     51, false, false),
    ('Kyle',     'kyle',     'Female', 'Right',    56, false, false),
    ('Zee',      'zee',      'Female', 'Right',    49, false, false),
    ('Pia',      'pia',      'Female', 'Right',    68, false, false),
    ('Rein',     'rein',     'Female', 'Left',     76, false, false),
    ('Raenna',   'raenna',   'Female', 'Left',     55, false, false),
    ('Ai Wei',   'ai-wei',   'Female', 'Left',     55, false, false),
    ('George',   'george',   'Male',   'Left',     82, false, false),
    ('Norman',   'norman',   'Male',   'Coach',    98, false, false),
    ('Migs',     'migs',     'Male',   'Right',    73, false, false),
    ('Tza',      'tza',      'Female', 'Right',    54, false, false),
    ('Cruz',     'cruz',     'Male',   'Left',     65, false, false),
    ('Ruiz',     'ruiz',     'Male',   'Left',     51, false, false),
    ('Cherian',  'cherian',  'Male',   'Coxswain', 67, false, false),
    ('Rae-anne', 'rae-anne', 'Female', 'Right',    55, true,  true ),
    ('Shyan',    'shyan',    'Male',   'Right',    65, false, false),
    ('Dhan',     'dhan',     'Male',   'Right',    72, false, false)
),
new_users as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  )
  select
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    p.slug || '@sample.alpas.test',
    null,  -- never log in; roster/planner only read training_signups
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, false
  from people p
  returning id, email
)
insert into public.training_signups (
  user_id, event_id, event_title, attending,
  name, gender, birthday, side, weight, need_pfd, need_paddle, status
)
select
  u.id, t.event_id, t.event_title, 'both',
  p.name, p.gender, null, p.side, p.weight, p.need_pfd, p.need_paddle, 'confirmed'
from new_users u
join people p on p.slug = split_part(u.email, '@', 1)
cross join target t;

-- Sanity check — should list the 20 sample paddlers on the target event:
-- select name, gender, side, weight from public.training_signups
-- where user_id in (select id from auth.users where email like '%@sample.alpas.test')
-- order by name;
