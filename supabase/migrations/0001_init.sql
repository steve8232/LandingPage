-- SparkPage — initial schema (Phase 1)
-- Run once in Supabase SQL editor: paste this entire file and click Run.
-- Re-running is safe: every statement is idempotent.

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ── projects ────────────────────────────────────────────────────────────────
-- One row per saved SparkPage. The latest snapshot of overrides lives here
-- for cheap reads; historical revisions go in project_revisions.
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  text not null,
  title        text not null default 'Untitled SparkPage',
  slug         text not null,
  overrides    jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);

-- ── project_revisions ───────────────────────────────────────────────────────
-- Append-only history. Each save bumps projects.overrides AND inserts here.
create table if not exists public.project_revisions (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  overrides    jsonb not null,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

create index if not exists project_revisions_project_id_idx
  on public.project_revisions (project_id, created_at desc);

-- ── deployments ─────────────────────────────────────────────────────────────
-- One row per successful (or attempted) publish to Vercel. Phase 3 writes here.
create table if not exists public.deployments (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  revision_id           uuid references public.project_revisions(id) on delete set null,
  vercel_deployment_id  text,
  url                   text,
  status                text not null default 'pending'
                          check (status in ('pending','building','ready','error','canceled')),
  error_message         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists deployments_project_id_idx
  on public.deployments (project_id, created_at desc);

-- ── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists deployments_set_updated_at on public.deployments;
create trigger deployments_set_updated_at
  before update on public.deployments
  for each row execute function public.set_updated_at();

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.projects           enable row level security;
alter table public.project_revisions  enable row level security;
alter table public.deployments        enable row level security;

-- projects: owner-only CRUD
drop policy if exists "projects_owner_select" on public.projects;
create policy "projects_owner_select" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "projects_owner_insert" on public.projects;
create policy "projects_owner_insert" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "projects_owner_update" on public.projects;
create policy "projects_owner_update" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_owner_delete" on public.projects;
create policy "projects_owner_delete" on public.projects
  for delete using (auth.uid() = user_id);

-- project_revisions: visible/insertable only via owned projects
drop policy if exists "project_revisions_owner_select" on public.project_revisions;
create policy "project_revisions_owner_select" on public.project_revisions
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_revisions.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "project_revisions_owner_insert" on public.project_revisions;
create policy "project_revisions_owner_insert" on public.project_revisions
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_revisions.project_id and p.user_id = auth.uid()
    )
  );

-- deployments: read-only for owners; writes happen via service-role only
drop policy if exists "deployments_owner_select" on public.deployments;
create policy "deployments_owner_select" on public.deployments
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = deployments.project_id and p.user_id = auth.uid()
    )
  );

-- No insert/update/delete policy for deployments → only service_role can write.
-- Phase 3 server routes use src/lib/supabase/admin.ts for that.
