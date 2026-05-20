-- SparkPage — drop the now-unused user_integrations table.
--
-- The original 0006_callrail.sql created public.user_integrations to hold a
-- per-user CallRail API key. We've since moved to a single global key on the
-- server (CALLRAIL_API_KEY env var), mirroring AUDIENCELAB_API_KEY, and the
-- table is no longer read or written by any code path.
--
-- Run once on environments that applied the original 0006. Fresh environments
-- pick up the new (slimmer) 0006 directly and skip this no-op.

drop table if exists public.user_integrations;
