-- 0020_project_build_status.sql
-- Adds asynchronous build tracking to public.projects so the URL onboarding
-- lane can return a project id immediately and run scrape/extract/generate
-- in a background continuation (Next.js `after()`), with a /building page
-- polling for completion.
--
-- All existing rows backfill to build_status='ready' so the rest of the app
-- (chat / research / manual lanes, which build synchronously) behaves
-- exactly as before.

alter table public.projects
  add column if not exists build_status text not null default 'ready';

alter table public.projects
  drop constraint if exists projects_build_status_check;
alter table public.projects
  add constraint projects_build_status_check
  check (build_status in ('building','ready','failed'));

alter table public.projects
  add column if not exists build_stage text;

alter table public.projects
  add column if not exists build_error text;

-- Partial index so the dashboard can cheaply find still-building projects
-- without scanning the whole table.
create index if not exists projects_build_status_building_idx
  on public.projects (updated_at desc)
  where build_status = 'building';
