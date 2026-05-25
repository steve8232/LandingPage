-- SparkPage — Snapshots storage bucket
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Stores the full-page PNG screenshot captured by /api/internal/snapshot
-- after a deployment transitions to status='ready'. Object keys follow
--   <project_id>/<deployment_id>/<device>.png
-- and are referenced by `public.page_snapshots.storage_path` (see
-- 0010_heatmap.sql).
--
-- The bucket is private. The dashboard reads via short-lived signed URLs
-- minted server-side by the heatmap read API; nothing is ever served
-- directly from the bucket. Writes happen via the service-role admin client
-- only (service_role bypasses storage RLS), so no INSERT/UPDATE/DELETE
-- policies are declared for end users.

insert into storage.buckets (id, name, public)
values ('snapshots', 'snapshots', false)
on conflict (id) do nothing;
