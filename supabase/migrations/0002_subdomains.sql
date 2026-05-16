-- SparkPage — Phase 4: stable subdomains for published pages
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).

-- ── projects.subdomain ──────────────────────────────────────────────────────
-- Globally-unique DNS label that maps to `<subdomain>.pages.sparkpage.us` via
-- a Vercel alias. Nullable: projects without a subdomain still publish to the
-- per-deployment *.vercel.app URL (Phase 3 behaviour).
alter table public.projects
  add column if not exists subdomain text;

-- subdomain_status reflects whether the alias is wired up at Vercel:
--   null      → no subdomain set
--   'pending' → set in DB; Vercel domain attach / alias still pending
--   'ready'   → alias points at the latest ready deployment
--   'error'   → last attempt to attach/alias failed (see subdomain_error)
alter table public.projects
  add column if not exists subdomain_status text;

alter table public.projects
  add column if not exists subdomain_error text;

-- Drop & re-add the check so re-runs converge on the current rule set.
alter table public.projects
  drop constraint if exists projects_subdomain_status_check;
alter table public.projects
  add constraint projects_subdomain_status_check
  check (subdomain_status is null or subdomain_status in ('pending','ready','error'));

-- Global uniqueness on subdomain (case-insensitive enforced at app layer by
-- storing lowercase only). Partial index so multiple NULLs are allowed.
create unique index if not exists projects_subdomain_unique_idx
  on public.projects (subdomain)
  where subdomain is not null;
