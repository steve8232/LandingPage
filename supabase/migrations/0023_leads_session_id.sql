-- SparkPage — per-lead heatmap correlation (Phase A: Spark leads).
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Form submissions on published pages now carry the visitor's first-party
-- heatmap session id (__sp_hm_sid minted by /h.js) so the dashboard can
-- deep-link from a single lead to that visitor's filtered heatmap view.
-- The composer's renderLeadFormScript reads sessionStorage and POSTs the
-- value as `__sp_session_id` on the JSON body; /api/leads/[projectId]
-- strips it off the payload before persistence and writes it here.

alter table public.leads
  add column if not exists session_id text;

-- Composite index so the "view this lead's heatmap" query and the inverse
-- ("which leads came from this session?") both hit an index. Matches the
-- shape of heatmap_events' (project_id, session_id) reads.
create index if not exists leads_project_session_idx
  on public.leads (project_id, session_id, created_at desc)
  where session_id is not null;
