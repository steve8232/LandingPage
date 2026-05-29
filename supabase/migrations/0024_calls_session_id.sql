-- SparkPage — per-call heatmap correlation (Phase B: CallRail).
-- Run once in Supabase SQL editor. Re-running is safe (idempotent).
--
-- /h.js stamps `?spk_sid=<sid>` onto the visitor's URL via history.replaceState
-- as soon as the heatmap session id is resolved. CallRail captures the URL
-- in `landing_page_url` on the post-call webhook (and on listCalls()), so
-- normalizeCallFromWebhook / shape() parses the param out and the webhook
-- upsert writes it here. Same shape as leads.session_id from migration 0023.

alter table public.calls
  add column if not exists session_id text;

create index if not exists calls_project_session_idx
  on public.calls (project_id, session_id, start_time desc)
  where session_id is not null;
