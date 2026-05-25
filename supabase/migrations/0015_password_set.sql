-- SparkPage — track whether a user has chosen their own password.
--
-- Used by /auth/callback to send first-time / invited users to
-- /auth/set-password before they reach the app, and by /login to
-- decide which authentication tab to highlight.
--
-- Flag flips to true in two places:
--   * /api/auth/password-set                — after /auth/set-password
--   * /auth/reset-password                  — after a recovery flow
--
-- Both writes go through the service-role client because the
-- profiles UPDATE policy from 0012_rbac.sql is admin-only.

alter table public.profiles
  add column if not exists password_set boolean not null default false;
