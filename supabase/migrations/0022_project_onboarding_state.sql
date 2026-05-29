-- 0022_project_onboarding_state.sql
-- Splits the URL / Describe onboarding pipeline at a user-gated checkpoint:
--   1. AI extract / concept phase persists its draft into onboarding_state
--      and flips build_status to 'awaiting_confirm'.
--   2. The /confirm page reads the draft, lets the user fix anything the
--      AI got wrong (and refuses to fill in any contact info the AI is
--      forbidden from inventing).
--   3. On submit, /api/projects/[id]/confirm flips status back to
--      'building' and runs the heavy generation phase
--      (generate / enhance / expandNeighborhoods / autoPick / finalize).
--
-- onboarding_state shape (jsonb, nullable):
--   {
--     source:     'url' | 'describe',
--     url?:       string,                  -- URL lane only
--     scrape?:    { screenshotUrl?, metadata? },  -- URL lane only
--     draft:      ExtractedBusinessInfo,   -- editable on /confirm
--     description?: string                 -- Describe lane verbatim input
--   }
--
-- Nullable + no default; rows created by other lanes (research, manual,
-- pre-existing url) keep onboarding_state IS NULL.

alter table public.projects
  add column if not exists onboarding_state jsonb;

-- Extend the build_status enum with the new gate value. Drop + re-add the
-- check so the new value is accepted without breaking existing rows.
alter table public.projects
  drop constraint if exists projects_build_status_check;
alter table public.projects
  add constraint projects_build_status_check
  check (build_status in ('building','ready','failed','awaiting_confirm'));
