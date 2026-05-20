-- SparkPage — Phase 2 CallRail auto-provisioning columns.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- These columns let the editor create a CallRail Company and provision a
-- tracking number directly from the wizard. The destination phone comes from
-- the wizard's contact step, and swap.js (loaded from callrail_script_url) is
-- injected into the published page <head> to replace it with the tracking
-- number for source-attributed visits.

-- Destination phone (E.164-ish digits) captured from the wizard. Source of
-- truth for both DNI swap_targets and the tracker's destination_number.
alter table public.projects
  add column if not exists business_phone text;

-- CallRail tracker id ("TRK..."). One-to-one with a SparkPage once provisioned.
alter table public.projects
  add column if not exists callrail_tracker_id text;

-- The issued tracking number (formatted as CallRail returns it).
alter table public.projects
  add column if not exists callrail_tracking_phone text;

-- swap.js URL returned by CallRail for the company. Injected into the
-- published page <head> to enable Dynamic Number Insertion.
alter table public.projects
  add column if not exists callrail_script_url text;
