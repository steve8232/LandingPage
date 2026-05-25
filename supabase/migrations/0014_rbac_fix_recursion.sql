-- SparkPage — fix infinite recursion between projects and
-- project_collaborators RLS policies.
--
-- The 0013 projects.SELECT policy did `exists (select 1 from
-- project_collaborators ...)` inline, and the 0012
-- project_collaborators.SELECT policy did `exists (select 1 from
-- projects ...)` inline. Each policy triggers the other when
-- evaluated, producing:
--   "infinite recursion detected in policy for relation 'projects'"
--
-- Fix: wrap the cross-table lookups in SECURITY DEFINER helpers
-- (owned by postgres, which has BYPASSRLS), the same pattern already
-- used by is_admin() and project_edit_role() in 0012.

-- ── helpers ────────────────────────────────────────────────────────────────
create or replace function public.is_project_member(pid uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.user_id = uid
  ) or public.is_admin(uid) or exists (
    select 1 from public.project_collaborators c
    where c.project_id = pid and c.user_id = uid
  );
$$;
revoke all on function public.is_project_member(uuid, uuid) from public;
grant execute on function public.is_project_member(uuid, uuid)
  to authenticated, service_role;

create or replace function public.is_project_editor(pid uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.user_id = uid
  ) or public.is_admin(uid) or exists (
    select 1 from public.project_collaborators c
    where c.project_id = pid and c.user_id = uid and c.role = 'editor'
  );
$$;
revoke all on function public.is_project_editor(uuid, uuid) from public;
grant execute on function public.is_project_editor(uuid, uuid)
  to authenticated, service_role;

create or replace function public.is_project_owner(pid uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.user_id = uid
  );
$$;
revoke all on function public.is_project_owner(uuid, uuid) from public;
grant execute on function public.is_project_owner(uuid, uuid)
  to authenticated, service_role;

-- ── projects ───────────────────────────────────────────────────────────────
drop policy if exists "projects_member_select" on public.projects;
create policy "projects_member_select" on public.projects
  for select using (
    public.is_project_member(id, auth.uid())
  );

drop policy if exists "projects_editor_update" on public.projects;
create policy "projects_editor_update" on public.projects
  for update using (
    public.is_project_editor(id, auth.uid())
  ) with check (
    public.is_project_editor(id, auth.uid())
  );

-- ── project_collaborators ──────────────────────────────────────────────────
drop policy if exists "pc_visible_to_member_owner_admin" on public.project_collaborators;
create policy "pc_visible_to_member_owner_admin" on public.project_collaborators
  for select using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.is_project_owner(project_id, auth.uid())
  );
