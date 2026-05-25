-- SparkPage — Role-based access control.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Adds:
--   1. public.profiles            — one row per auth.users, holds role + email.
--   2. public.project_collaborators — many-to-many between users and projects
--      with viewer/editor distinction.
--   3. helper functions is_admin / project_edit_role used by RLS policies on
--      projects + child tables (see 0013_rbac_project_policies.sql).
--
-- New profile rows default to role='user'. Admin bootstrap is done in app
-- code: src/lib/auth/role.ts checks SPARKPAGE_ADMIN_EMAILS on first sign-in
-- and upserts role='admin' via the service-role client. Postgres triggers
-- can't reliably read OS env vars, so the source of truth stays in Node.

-- ── enums ──────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sparkpage_role') then
    create type public.sparkpage_role as enum ('admin','user');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'collaborator_role') then
    create type public.collaborator_role as enum ('viewer','editor');
  end if;
end $$;

-- ── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       public.sparkpage_role not null default 'user',
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a 'user' profile for every new auth.users row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any pre-existing users.
insert into public.profiles (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

-- ── project_collaborators ──────────────────────────────────────────────────
-- Defined before project_edit_role() because `language sql` functions
-- validate referenced relations at CREATE time.
create table if not exists public.project_collaborators (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.collaborator_role not null default 'editor',
  added_by   uuid references auth.users(id) on delete set null,
  added_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_collaborators_user_idx
  on public.project_collaborators (user_id);

-- ── helpers ────────────────────────────────────────────────────────────────
-- SECURITY DEFINER avoids the classic RLS-recursion trap: policies on
-- profiles can't safely query profiles, but a definer function can.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = uid and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

-- Returns the caller's edit relationship to a project, or null when the
-- caller can't even see it. Used by RLS policies on projects + child tables.
--   'owner'   — projects.user_id matches; full edit.
--   'admin'   — caller has admin role; full edit.
--   'editor'  — listed in project_collaborators with role='editor'.
--   'viewer'  — listed in project_collaborators with role='viewer'.
--   null      — no access.
create or replace function public.project_edit_role(pid uuid, uid uuid)
returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.projects p where p.id = pid and p.user_id = uid) then 'owner'
    when public.is_admin(uid) then 'admin'
    else (
      select c.role::text
      from public.project_collaborators c
      where c.project_id = pid and c.user_id = uid
      limit 1
    )
  end;
$$;

revoke all on function public.project_edit_role(uuid, uuid) from public;
grant execute on function public.project_edit_role(uuid, uuid) to authenticated, service_role;

-- ── RLS: profiles ──────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_or_admin_select" on public.profiles;
create policy "profiles_self_or_admin_select" on public.profiles
  for select using (
    user_id = auth.uid() or public.is_admin(auth.uid())
  );

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin(auth.uid()))
              with check (public.is_admin(auth.uid()));

-- INSERT only happens through the handle_new_user trigger (SECURITY DEFINER)
-- and the service-role bootstrap path, so no user-facing INSERT policy.

-- ── RLS: project_collaborators ─────────────────────────────────────────────
alter table public.project_collaborators enable row level security;

drop policy if exists "pc_visible_to_member_owner_admin" on public.project_collaborators;
create policy "pc_visible_to_member_owner_admin" on public.project_collaborators
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_collaborators.project_id and p.user_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

-- Writes: admins only. (Owners-who-are-not-admins delegate this to admins
-- in the current model; revisit if/when teams need self-service sharing.)
drop policy if exists "pc_admin_write" on public.project_collaborators;
create policy "pc_admin_write" on public.project_collaborators
  for all using (public.is_admin(auth.uid()))
          with check (public.is_admin(auth.uid()));
