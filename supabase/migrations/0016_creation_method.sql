-- SparkPage — track how a project was created
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- A SparkPage project can be created via three flows:
--   'manual'    → the original wizard flow (user fills the form by hand)
--   'research'  → DataForSEO-assisted draft (Lane B)
--   'chat'      → guided chat-bot flow (Lane C)
--
-- The column drives:
--   * editor surfacing of method-specific affordances (e.g. research review)
--   * analytics on which flow produces the most-deployed pages
--
-- Default is 'manual' so existing rows backfill correctly.

alter table public.projects
  add column if not exists creation_method text not null default 'manual';

-- Drop & re-add the check so re-runs converge on the current rule set
-- (mirrors the pattern used by 0005_custom_domain.sql).
alter table public.projects
  drop constraint if exists projects_creation_method_check;
alter table public.projects
  add constraint projects_creation_method_check
  check (creation_method in ('manual','research','chat'));
