-- SparkPage — Phase: first-party heatmaps + page snapshots
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Public landing pages load /h.js, which batches click / rage-click /
-- dead-click / scroll events and POSTs them to /api/heatmap/ingest/[projectId].
-- That route uses the service-role admin client to insert into heatmap_events.
-- Owners can read their own project's events via RLS.
--
-- page_snapshots stores one full-page screenshot per deployment so heatmap
-- coordinates remain visually accurate even after the page is edited. The
-- snapshot is captured in /api/internal/snapshot once the deployment row
-- transitions to status='ready', and the PNG is uploaded to Supabase Storage
-- (bucket: snapshots).

-- ── heatmap_events ──────────────────────────────────────────────────────────
-- One row per captured interaction on a published page. Coordinates are
-- normalised (0..1) at ingest so a single snapshot can back heatmaps from
-- visitors on any viewport size. `session_id` is a visitor-generated UUID
-- stored in sessionStorage; rage-click detection groups by it on the client
-- so the server only sees pre-classified events.
create table if not exists public.heatmap_events (
  id           bigserial primary key,
  project_id   uuid not null references public.projects(id) on delete cascade,
  session_id   text not null,
  event_type   text not null
                 check (event_type in ('click','rage_click','dead_click','scroll')),
  -- Normalised page coords (0..1). null for 'scroll'.
  x_norm       numeric(7,6),
  y_norm       numeric(7,6),
  -- Max scroll depth reached in the session, 0..100. Only set for 'scroll'.
  scroll_pct   smallint check (scroll_pct is null or (scroll_pct between 0 and 100)),
  viewport_w   smallint not null,
  viewport_h   smallint not null,
  device       text check (device in ('desktop','tablet','mobile')),
  pathname     text not null default '/',
  -- Click target metadata. PII-safe: the ingest route only persists text for
  -- BUTTON / A / H1-H6 targets and trims to 60 chars; INPUT / TEXTAREA / LABEL
  -- text is dropped client-side so we never see form values or field labels.
  target_tag   text,
  target_text  text,
  created_at   timestamptz not null default now()
);

create index if not exists heatmap_events_project_created_idx
  on public.heatmap_events (project_id, created_at desc);

create index if not exists heatmap_events_project_type_created_idx
  on public.heatmap_events (project_id, event_type, created_at desc);

-- ── page_snapshots ──────────────────────────────────────────────────────────
-- One row per (deployment, device) snapshot. `storage_path` is the object
-- key inside the `snapshots` Supabase Storage bucket; the dashboard mints a
-- short-lived signed URL at read time. `status='pending'` is inserted by the
-- deployment ready-transition hook; the internal snapshot route flips it to
-- 'ready' or 'error'.
create table if not exists public.page_snapshots (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  deployment_id  uuid not null references public.deployments(id) on delete cascade,
  storage_path   text not null,
  width_px       integer not null default 1440,
  height_px     integer,
  device         text not null default 'desktop'
                   check (device in ('desktop','tablet','mobile')),
  status         text not null default 'pending'
                   check (status in ('pending','ready','error')),
  error_message  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (deployment_id, device)
);

create index if not exists page_snapshots_project_created_idx
  on public.page_snapshots (project_id, created_at desc);

drop trigger if exists page_snapshots_set_updated_at on public.page_snapshots;
create trigger page_snapshots_set_updated_at
  before update on public.page_snapshots
  for each row execute function public.set_updated_at();

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.heatmap_events  enable row level security;
alter table public.page_snapshots  enable row level security;

-- heatmap_events: owners can SELECT their own project's events. No INSERT
-- policy → writes happen via service_role only (same pattern as `leads`).
drop policy if exists "heatmap_events_owner_select" on public.heatmap_events;
create policy "heatmap_events_owner_select" on public.heatmap_events
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = heatmap_events.project_id and p.user_id = auth.uid()
    )
  );

-- page_snapshots: owners can SELECT rows for their own projects. Writes are
-- service-role only (the snapshot capture route uses the admin client).
drop policy if exists "page_snapshots_owner_select" on public.page_snapshots;
create policy "page_snapshots_owner_select" on public.page_snapshots
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = page_snapshots.project_id and p.user_id = auth.uid()
    )
  );
