-- SparkPage — GoHighLevel sub-account auto-provisioning.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- On every deploy, the deploy route checks ghl_location_id. When unset
-- (and GHL_AGENCY_PIT + GHL_COMPANY_ID env vars are present), it:
--   1. POST /locations/ to create a sub-account from the snapshot.
--   2. POST /users/ to invite the SparkPage project owner as a
--      location admin so they can log into GHL with their existing
--      SparkPage email + a password they set from the GHL invite.
--   3. Persists ghl_location_id + ghl_user_id + ghl_provisioned_at
--      so subsequent deploys skip the work.
--
-- ghl_field_map caches { sparkpageLeadKey: ghlCustomFieldId } so the
-- lazy custom-field creation in Phase B (lead/call push) does not
-- re-query /customFields on every contact upsert.

alter table public.projects
  add column if not exists ghl_location_id text;

alter table public.projects
  add column if not exists ghl_user_id text;

alter table public.projects
  add column if not exists ghl_provisioned_at timestamptz;

alter table public.projects
  add column if not exists ghl_field_map jsonb not null default '{}'::jsonb;
