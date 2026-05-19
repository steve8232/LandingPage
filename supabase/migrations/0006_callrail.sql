-- SparkPage — Phase 1 CallRail integration (call tracking + recordings).
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Three things land here:
--   1. user_integrations — per-user CallRail API key. RLS is ON with *no*
--      policies, matching the deployments-table pattern, so the key is
--      reachable only via the service-role admin client on the server.
--   2. projects columns — bind a SparkPage to one CallRail Company plus an
--      optional per-company webhook signing key.
--   3. calls — webhook-ingested call records. Owners can SELECT their own
--      project's calls; writes happen through service_role only.

-- ── user_integrations ──────────────────────────────────────────────────────
create table if not exists public.user_integrations (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  callrail_api_key     text,
  callrail_account_id  text,
  updated_at           timestamptz not null default now()
);

alter table public.user_integrations enable row level security;
-- Intentionally NO policies → service_role only.
-- (Identical posture to public.deployments from 0001_init.sql.)

-- ── projects: per-page CallRail binding ────────────────────────────────────
alter table public.projects
  add column if not exists callrail_company_id text;

alter table public.projects
  add column if not exists callrail_company_name text;

-- Per-company "secret token" from CallRail's webhook config page. Used to
-- verify the Signature header on /api/webhooks/callrail/[projectId] posts.
alter table public.projects
  add column if not exists callrail_webhook_signing_key text;

-- ── calls ──────────────────────────────────────────────────────────────────
-- One row per CallRail call event. Hot fields are promoted to columns for
-- indexing and dashboard rendering; the raw webhook body is kept in `payload`
-- so we can surface new CallRail fields later without a migration.
create table if not exists public.calls (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id) on delete cascade,
  callrail_call_id     text not null,
  start_time           timestamptz,
  direction            text,
  answered             boolean,
  duration             integer,
  customer_name        text,
  customer_phone       text,
  customer_city        text,
  customer_state       text,
  tracking_phone       text,
  source               text,
  campaign             text,
  landing_page_url     text,
  recording_url        text,
  transcription        text,
  payload              jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- One CallRail call id maps to at most one row per project. Re-posts of the
-- same call (post-call retries, call-modified webhooks) upsert by this key.
create unique index if not exists calls_project_callrail_id_idx
  on public.calls (project_id, callrail_call_id);

create index if not exists calls_project_start_idx
  on public.calls (project_id, start_time desc);

alter table public.calls enable row level security;

-- Owners can SELECT their own project's calls. Mirrors leads_owner_select.
drop policy if exists "calls_owner_select" on public.calls;
create policy "calls_owner_select" on public.calls
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = calls.project_id and p.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy → writes happen via service_role only,
-- driven by /api/webhooks/callrail/[projectId].
