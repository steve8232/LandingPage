-- SparkPage — Bring-Your-Own custom domain (BYO)
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- The custom_domain columns live alongside the existing subdomain columns so
-- a project can have BOTH a SparkPage URL and a customer-owned domain. Either
-- one independently routes to the same Vercel project via addProjectDomain.

alter table public.projects
  add column if not exists custom_domain text;

-- custom_domain_status reflects DNS + verification progress at Vercel:
--   null                    → no custom domain set
--   'pending_verification'  → domain attached but Vercel needs the TXT challenge
--                             (typically because the domain is on another team)
--   'pending_dns'           → ownership ok; DNS A/CNAME not yet pointing at Vercel
--   'ready'                 → DNS resolves + cert issued + URL is reachable
--   'error'                 → last attach/verify attempt failed (see custom_domain_error)
alter table public.projects
  add column if not exists custom_domain_status text;

alter table public.projects
  add column if not exists custom_domain_error text;

-- Apex (acme.com) vs subdomain (www.acme.com) — drives whether the DNS
-- instructions panel shows an A record or a CNAME. Stored once at claim time
-- to avoid re-parsing the host on every UI render.
alter table public.projects
  add column if not exists custom_domain_apex boolean not null default false;

-- Drop & re-add the check so re-runs converge on the current rule set.
alter table public.projects
  drop constraint if exists projects_custom_domain_status_check;
alter table public.projects
  add constraint projects_custom_domain_status_check
  check (
    custom_domain_status is null
    or custom_domain_status in ('pending_verification','pending_dns','ready','error')
  );

-- Global uniqueness on custom_domain (lowercased at app layer). Partial index
-- so multiple NULLs are allowed.
create unique index if not exists projects_custom_domain_unique_idx
  on public.projects (custom_domain)
  where custom_domain is not null;
