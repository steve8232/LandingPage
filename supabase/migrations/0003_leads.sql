-- SparkPage — Phase 5: lead capture for published v1 pages
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Public landing pages POST form submissions to /api/leads/[projectId]; the
-- route inserts a row here via the service-role admin client. Owners can read
-- their own project's leads via RLS.

-- ── leads ───────────────────────────────────────────────────────────────────
-- One row per form submission. `payload` is the raw user-submitted JSON; we
-- never trust client field names so we store them as jsonb rather than
-- normalising into columns. Metadata fields capture lightweight signal for
-- spam triage without storing the full request.
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  payload      jsonb not null default '{}'::jsonb,
  user_agent   text,
  referer      text,
  /** Truncated client IP (best-effort, derived from x-forwarded-for). */
  ip           text,
  created_at   timestamptz not null default now()
);

create index if not exists leads_project_id_idx
  on public.leads (project_id, created_at desc);

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.leads enable row level security;

-- Owners can SELECT their own project's leads.
drop policy if exists "leads_owner_select" on public.leads;
create policy "leads_owner_select" on public.leads
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = leads.project_id and p.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy → writes happen via service_role only.
-- The /api/leads/[projectId] route uses src/lib/supabase/admin.ts for that
-- so submissions from unauthenticated visitors can land.
