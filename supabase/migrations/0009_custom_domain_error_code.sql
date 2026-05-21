-- SparkPage — machine-readable error code for BYO custom domain failures.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- `custom_domain_error` is a free-form Vercel string used for the picker
-- tooltip; `custom_domain_error_code` is a stable enum-ish value the picker
-- branches on to render an actionable panel. Currently emitted:
--
--   'domain_claimed_other_account' — domain is verified by another Vercel
--                                    account (cross-team). Resolvable only
--                                    via TXT-proof challenge or the user
--                                    detaching it from the other account.
--   'domain_claimed_same_team'     — attached to another project in our
--                                    team (auto-release skipped because the
--                                    other project doesn't have the
--                                    sparkpage- prefix, or release failed).
--   'domain_claimed_unknown'       — fallback when we couldn't classify.
--   'domain_taken_internal'        — another SparkPage row already claims
--                                    this domain (Postgres unique index).
--
-- NULL means: either the row has no error, or the error is an opaque Vercel
-- message that doesn't fit any of the above buckets.

alter table public.projects
  add column if not exists custom_domain_error_code text;
