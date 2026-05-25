-- SparkPage — RBAC: replace single-owner RLS with member/admin-aware policies.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Depends on 0012_rbac.sql:
--   public.is_admin(uid)             -- boolean
--   public.project_edit_role(pid,uid) -- 'owner'|'admin'|'editor'|'viewer'|null
--
-- Access model:
--   projects.SELECT  — owner, admin, or any collaborator (viewer/editor).
--   projects.INSERT  — admin only (user_id must equal auth.uid()).
--   projects.UPDATE  — owner, admin, or 'editor' collaborator.
--   projects.DELETE  — admin only.
--
-- Child tables (leads, calls, heatmap_events, page_snapshots, project_revisions,
-- deployments) inherit visibility via project_edit_role IS NOT NULL.
-- project_revisions.INSERT is restricted to roles that can edit
-- ('owner','admin','editor').

-- ── projects ────────────────────────────────────────────────────────────────
drop policy if exists "projects_owner_select" on public.projects;
drop policy if exists "projects_owner_insert" on public.projects;
drop policy if exists "projects_owner_update" on public.projects;
drop policy if exists "projects_owner_delete" on public.projects;
drop policy if exists "projects_member_select" on public.projects;
drop policy if exists "projects_admin_insert" on public.projects;
drop policy if exists "projects_editor_update" on public.projects;
drop policy if exists "projects_admin_delete" on public.projects;

create policy "projects_member_select" on public.projects
  for select using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.project_collaborators c
      where c.project_id = projects.id and c.user_id = auth.uid()
    )
  );

create policy "projects_admin_insert" on public.projects
  for insert with check (
    public.is_admin(auth.uid()) and user_id = auth.uid()
  );

create policy "projects_editor_update" on public.projects
  for update using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.project_collaborators c
      where c.project_id = projects.id
        and c.user_id = auth.uid()
        and c.role = 'editor'
    )
  ) with check (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.project_collaborators c
      where c.project_id = projects.id
        and c.user_id = auth.uid()
        and c.role = 'editor'
    )
  );

create policy "projects_admin_delete" on public.projects
  for delete using (public.is_admin(auth.uid()));

-- ── project_revisions ───────────────────────────────────────────────────────
drop policy if exists "project_revisions_owner_select" on public.project_revisions;
drop policy if exists "project_revisions_owner_insert" on public.project_revisions;
drop policy if exists "project_revisions_member_select" on public.project_revisions;
drop policy if exists "project_revisions_editor_insert" on public.project_revisions;

create policy "project_revisions_member_select" on public.project_revisions
  for select using (
    public.project_edit_role(project_revisions.project_id, auth.uid()) is not null
  );

create policy "project_revisions_editor_insert" on public.project_revisions
  for insert with check (
    public.project_edit_role(project_revisions.project_id, auth.uid())
      in ('owner','admin','editor')
  );

-- ── deployments ─────────────────────────────────────────────────────────────
drop policy if exists "deployments_owner_select" on public.deployments;
drop policy if exists "deployments_member_select" on public.deployments;

create policy "deployments_member_select" on public.deployments
  for select using (
    public.project_edit_role(deployments.project_id, auth.uid()) is not null
  );
-- No INSERT/UPDATE/DELETE policy → service_role only, as before.

-- ── leads ───────────────────────────────────────────────────────────────────
drop policy if exists "leads_owner_select" on public.leads;
drop policy if exists "leads_member_select" on public.leads;

create policy "leads_member_select" on public.leads
  for select using (
    public.project_edit_role(leads.project_id, auth.uid()) is not null
  );
-- INSERT remains service_role only.

-- ── calls ───────────────────────────────────────────────────────────────────
drop policy if exists "calls_owner_select" on public.calls;
drop policy if exists "calls_member_select" on public.calls;

create policy "calls_member_select" on public.calls
  for select using (
    public.project_edit_role(calls.project_id, auth.uid()) is not null
  );
-- INSERT remains service_role only.

-- ── heatmap_events ──────────────────────────────────────────────────────────
drop policy if exists "heatmap_events_owner_select" on public.heatmap_events;
drop policy if exists "heatmap_events_member_select" on public.heatmap_events;

create policy "heatmap_events_member_select" on public.heatmap_events
  for select using (
    public.project_edit_role(heatmap_events.project_id, auth.uid()) is not null
  );
-- INSERT remains service_role only.

-- ── page_snapshots ──────────────────────────────────────────────────────────
drop policy if exists "page_snapshots_owner_select" on public.page_snapshots;
drop policy if exists "page_snapshots_member_select" on public.page_snapshots;

create policy "page_snapshots_member_select" on public.page_snapshots
  for select using (
    public.project_edit_role(page_snapshots.project_id, auth.uid()) is not null
  );
-- INSERT remains service_role only.
