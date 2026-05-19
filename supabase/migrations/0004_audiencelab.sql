-- SparkPage — AudienceLab pixel auto-provisioning
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- On first deploy of a project, the deploy route creates a new AudienceLab
-- pixel via POST /pixels and persists the returned identifiers here so
-- subsequent deploys reuse the same pixel (no duplicates per project).

alter table public.projects
  add column if not exists audiencelab_pixel_id text;

alter table public.projects
  add column if not exists audiencelab_install_url text;
