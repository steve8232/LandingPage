-- SparkPage — record the websiteUrl an AudienceLab pixel was provisioned for.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- Background: pixels used to be auto-provisioned on first deploy against
-- the project's *.pages.sparkpage.us URL, which cluttered the AudienceLab
-- dashboard with platform URLs instead of the customer's brand.
--
-- We now gate provisioning + injection on a "ready" custom domain (see
-- src/app/api/projects/[id]/deploy/route.ts). This column lets the deploy
-- route detect three cases on every publish:
--
--   • value is NULL          → legacy row provisioned against sparkpage.us;
--                              re-provision against the custom domain.
--   • value != current URL   → user changed/attached a new custom domain;
--                              re-provision against the new URL.
--   • value == current URL   → no work to do, reuse the existing pixel.
--
-- We never delete the prior pixel in AudienceLab; we simply overwrite the
-- stored id/install_url with the fresh pair so the published page (and the
-- dashboard's SparkLeads lookup) cuts over cleanly.

alter table public.projects
  add column if not exists audiencelab_pixel_website_url text;
