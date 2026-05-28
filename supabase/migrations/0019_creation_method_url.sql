-- SparkPage — add 'url' to projects.creation_method
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Phase 8 introduces a fourth onboarding lane:
--   'url'  → user pastes an existing website URL, which Firecrawl scrapes
--            and we use to auto-pick a v1 template + draft overrides.
--
-- This drops and re-adds the check constraint to expand the allowed set;
-- mirrors the pattern used by 0016_creation_method.sql.

alter table public.projects
  drop constraint if exists projects_creation_method_check;
alter table public.projects
  add constraint projects_creation_method_check
  check (creation_method in ('manual','research','chat','url'));
