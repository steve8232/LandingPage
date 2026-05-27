/**
 * Shared helpers for the DataForSEO research creation method (Lane B).
 *
 * Centralizes the postback URL shape and the path-token verification so the
 * wizard route (POST /api/research) and the webhook receiver
 * (POST /api/webhooks/dataforseo/[token]) cannot drift apart.
 *
 * Server-only — never import from a Client Component (would expose the token
 * env var to the bundle).
 */

import { timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  postQuestionsAndAnswersTask,
  postReviewsTask,
} from './client';

/**
 * Reads DATAFORSEO_WEBHOOK_TOKEN. Throws if missing — both endpoints require
 * it, and starting without it would silently break the async loop.
 */
export function getWebhookToken(): string {
  const tok = process.env.DATAFORSEO_WEBHOOK_TOKEN;
  if (!tok) {
    throw new Error(
      '[dataforseo/research] Missing DATAFORSEO_WEBHOOK_TOKEN env var',
    );
  }
  return tok;
}

/**
 * Builds the absolute postback URL DataForSEO POSTs results to. The token is
 * embedded in the path so the webhook handler can verify a single secret
 * without juggling per-task signatures.
 *
 *   ${origin}/api/webhooks/dataforseo/${token}
 *
 * `origin` should be the public origin of the SparkPage app (e.g.
 * https://sparkpage.us). In a route handler the caller can pass
 * `new URL(request.url).origin` or `request.nextUrl.origin`.
 */
export function buildPostbackUrl(origin: string, token: string): string {
  const trimmed = origin.replace(/\/+$/, '');
  return `${trimmed}/api/webhooks/dataforseo/${encodeURIComponent(token)}`;
}

/**
 * Constant-time comparison of the path token against the configured secret.
 * Returns false (not throws) on any malformed input so the webhook handler
 * can map a false to a 401 without leaking which arm failed.
 */
export function verifyWebhookToken(received: string | undefined | null, expected: string): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ── Postback payload helpers ───────────────────────────────────────────────

/**
 * DataForSEO postbacks wrap results in the same envelope as the sync API:
 *
 *   { status_code: 20000, status_message: "Ok.",
 *     tasks: [{ id, status_code, status_message, result: [...] }] }
 *
 * Task-level status_code falls into ranges:
 *   2xxxx  — success
 *   4xxxx  — client error (bad request / no results)
 *   5xxxx  — server error
 *
 * We only persist `task_id` from the envelope; the rest of the body is stored
 * verbatim in `raw_payload` for the review screen.
 */
export interface PostbackTask {
  id?: string;
  status_code?: number;
  status_message?: string;
  result?: unknown;
}
export interface PostbackEnvelope {
  status_code?: number;
  status_message?: string;
  tasks?: PostbackTask[];
}

export interface ParsedPostback {
  taskId: string;
  /** 'ready' when the task succeeded, 'error' for any 4xxxx/5xxxx code. */
  status: 'ready' | 'error';
  errorMessage: string | null;
}

/**
 * Extracts the task id and resolves a SparkPage-side status from a postback
 * envelope. Returns null when the envelope is malformed (no first task or no
 * task id) — caller maps that to a 400.
 */
// ── Supplemental tasks (Reviews + Q&A) ─────────────────────────────────────

export interface QueueSupplementalInput {
  projectId: string;
  keyword: string;
  locationName: string | null;
  languageCode: string;
  postbackUrl: string;
}

/**
 * Best-effort queue of the Reviews and Questions & Answers tasks that
 * supplement the primary My Business Info lookup. Insert one row per kind in
 * `dataforseo_research` so the webhook + poll pipeline can settle them
 * independently. Failures are swallowed — supplementals are nice-to-have for
 * grounding generation; the project should still ship if DataForSEO rejects
 * one of these specific endpoints (e.g. no reviews on the listing).
 *
 * Callers pass an admin client (createAdminClient()) because the
 * dataforseo_research table has no INSERT RLS policy.
 */
export async function queueSupplementalResearchTasks(
  admin: SupabaseClient,
  input: QueueSupplementalInput,
): Promise<void> {
  const baseInput = {
    keyword: input.keyword,
    locationName: input.locationName || undefined,
    languageCode: input.languageCode || 'en',
    postbackUrl: input.postbackUrl,
  };
  const kinds: Array<{
    kind: 'reviews' | 'questions_and_answers';
    post: typeof postReviewsTask;
  }> = [
    { kind: 'reviews', post: postReviewsTask },
    { kind: 'questions_and_answers', post: postQuestionsAndAnswersTask },
  ];
  for (const { kind, post } of kinds) {
    try {
      const out = await post(baseInput);
      const { error } = await admin.from('dataforseo_research').insert({
        project_id: input.projectId,
        task_id: out.taskId,
        task_kind: kind,
        status: 'pending',
        keyword: input.keyword,
        location_name: input.locationName,
        language_code: input.languageCode || 'en',
      });
      if (error) {
        console.error(`[dataforseo/research] insert ${kind} row failed (non-fatal):`, error);
      }
    } catch (err) {
      console.error(`[dataforseo/research] post ${kind} task failed (non-fatal):`, err);
    }
  }
}

export function parsePostback(body: unknown): ParsedPostback | null {
  if (!body || typeof body !== 'object') return null;
  const env = body as PostbackEnvelope;
  const task = Array.isArray(env.tasks) ? env.tasks[0] : undefined;
  if (!task || typeof task.id !== 'string' || !task.id) return null;

  const code = typeof task.status_code === 'number' ? task.status_code : 20000;
  const ok = code >= 20000 && code < 30000;
  return {
    taskId: task.id,
    status: ok ? 'ready' : 'error',
    errorMessage: ok ? null : (task.status_message || `DataForSEO status ${code}`),
  };
}
