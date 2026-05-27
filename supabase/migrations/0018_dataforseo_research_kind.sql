-- SparkPage — DataForSEO research: support multiple task kinds per project.
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- The research wizard now queues THREE DataForSEO tasks per project so the
-- generation step is grounded in real customer data:
--   1. my_business_info       — name, phone, website, address, aggregate
--                                rating + review count, hours, photos
--   2. reviews                 — recent review text excerpts used as raw
--                                material for testimonial copy
--   3. questions_and_answers   — Google Q&A pairs used as raw material for
--                                FAQ section copy
--
-- Each task results in its own postback (and its own row in
-- dataforseo_research, since task_id is globally unique on DataForSEO's side
-- and our PRIMARY KEY here keys off task_id-via-update). We add a
-- discriminator column so the GET endpoint and review screen can scope to
-- the primary My Business Info row while the apply / generate steps can
-- aggregate all three kinds for the AI prompt.

alter table public.dataforseo_research
  add column if not exists task_kind text not null default 'my_business_info';

-- Constrain to the three supported kinds. Dropping & recreating is safe even
-- when the constraint already exists.
alter table public.dataforseo_research
  drop constraint if exists dataforseo_research_task_kind_check;
alter table public.dataforseo_research
  add  constraint dataforseo_research_task_kind_check
       check (task_kind in ('my_business_info', 'reviews', 'questions_and_answers'));

-- Existing rows pre-date the supplemental queueing, so they're all primary
-- business-info lookups. The DEFAULT above already covers that, but be
-- explicit for any rows inserted in flight during deploy.
update public.dataforseo_research
   set task_kind = 'my_business_info'
 where task_kind is null;

-- Composite index for "latest row of a given kind for a project" — used by
-- the GET /research endpoint (kind = my_business_info) and by the apply /
-- generate steps (kind = reviews / questions_and_answers).
create index if not exists dataforseo_research_project_kind_created_idx
  on public.dataforseo_research (project_id, task_kind, created_at desc);
