-- SparkPage — DataForSEO-assisted research drafts (Lane B).
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- One row per "Look up my business" task initiated from the research wizard.
-- Lifecycle:
--   1. POST /api/research      — admin creates a project (creation_method='research'),
--                                inserts a row here with status='pending', then calls
--                                postMyBusinessInfoTask().
--   2. DataForSEO postback     — /api/webhooks/dataforseo/[token] verifies the token
--                                against DATAFORSEO_WEBHOOK_TOKEN, finds the row by
--                                task_id, persists raw_payload + flips status='ready'.
--   3. Editor review screen    — operator edits the draft into `reviewed_overrides`
--                                and promotes it into the normal project overrides.
--
-- RLS mirrors 0013_rbac_project_policies.sql: SELECT for any project member
-- (owner / admin / collaborator); writes are service-role only (the wizard
-- route and the webhook both use createAdminClient()).

create table if not exists public.dataforseo_research (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  -- DataForSEO-issued task id. Globally unique on their side; we enforce
  -- uniqueness here too so the webhook upsert path is deterministic.
  task_id             text not null unique,
  status              text not null default 'pending'
                        check (status in ('pending','ready','error')),
  keyword             text not null,
  location_name       text,
  language_code       text not null default 'en',
  -- Full DataForSEO postback envelope, stored verbatim so the dashboard can
  -- show the raw data and we can re-normalise later without re-querying.
  raw_payload         jsonb,
  -- Operator-edited draft overrides (V1ContentOverrides shape). Null until
  -- the review screen saves the first edit.
  reviewed_overrides  jsonb,
  error_message       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists dataforseo_research_project_created_idx
  on public.dataforseo_research (project_id, created_at desc);

drop trigger if exists dataforseo_research_set_updated_at on public.dataforseo_research;
create trigger dataforseo_research_set_updated_at
  before update on public.dataforseo_research
  for each row execute function public.set_updated_at();

-- ── Row-Level Security ─────────────────────────────────────────────────────
alter table public.dataforseo_research enable row level security;

-- SELECT for any project member (mirrors leads / calls / heatmap_events).
-- INSERT / UPDATE / DELETE remain service-role only — the wizard route and
-- the webhook both use createAdminClient() so no end-user write path exists.
drop policy if exists "dataforseo_research_member_select" on public.dataforseo_research;
create policy "dataforseo_research_member_select" on public.dataforseo_research
  for select using (
    public.project_edit_role(dataforseo_research.project_id, auth.uid()) is not null
  );
