-- ============================================================================
-- AlpasPinas — admin-editable home page write-ups
-- ============================================================================
-- Small key/value store for the prose paragraphs on the home page (About's
-- manifesto, Training's intro, Contact's invite text, etc.) so admins can
-- reword them from /admin without a code deploy. Same shape/RLS pattern as
-- app_config (public read, admin write) since this is non-sensitive marketing
-- copy that every visitor needs to render the page.
-- ============================================================================

create table if not exists public.site_content (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "site_content: public read" on public.site_content;
create policy "site_content: public read"
  on public.site_content for select
  using (true);

drop policy if exists "site_content: admin write" on public.site_content;
create policy "site_content: admin write"
  on public.site_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed with the copy currently hardcoded in each component, so the admin
-- editor opens pre-filled with the real text instead of blank fields.
-- `on conflict do nothing` keeps this re-runnable without clobbering edits.
insert into public.site_content (key, value) values
  ('hero.intro', 'Start with a weekend session. No experience needed, all gear provided, and a crew that will get you on the water fast.'),
  ('about.manifesto', 'AlpasPinas is a Filipino dragon boat crew in Malaysia — a home away from home that moves on a single beat. We paddle to break away: from the pack on the start line, and from anything that says a crew this far from home can''t line up and win.'),
  ('training.intro', 'Four sessions a week — weeknights for fitness and technique, weekends for full-crew water time. Sessions marked open welcome drop-ins, no confirmation needed.'),
  ('training.cta', 'Weekend sessions are beginner-friendly and all gear is provided. Message us to reserve your seat for this week.'),
  ('featuredGear.note', 'Members race in club kit. Your jersey, paddle, and PFD are provided once you join the crew.'),
  ('raceRecord.intro', 'Seasons of racing across the region and a growing trophy shelf. Here''s where we''ve lined up lately.'),
  ('contact.invite', 'There''s a seat in the boat with your name on it. Come try a session — no experience needed, all gear provided. We''ll get you on the water within a week or two.')
on conflict (key) do nothing;
