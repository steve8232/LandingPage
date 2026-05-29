-- 0021_research_applied_at.sql
-- Stamps the timestamp of the most recent successful POST
-- /api/projects/[id]/research/apply on each dataforseo_research row.
--
-- Needed so the review screen can distinguish three states that previously
-- collapsed into one (`updated_at`):
--   • Postback landed, nothing reviewed → applied_at IS NULL, reviewed_overrides IS NULL
--   • Reviewer edited + saved, not applied → applied_at IS NULL, reviewed_overrides NOT NULL
--   • Reviewer applied to the page → applied_at NOT NULL
--
-- Nullable + no default; backfilling existing rows is unnecessary because
-- the UI treats NULL as "not yet applied" — operators on freshly-migrated
-- rows just see the Apply button as if it had never been clicked.

alter table public.dataforseo_research
  add column if not exists applied_at timestamptz;
