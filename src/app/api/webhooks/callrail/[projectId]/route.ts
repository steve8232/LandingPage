import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCallRailWebhook } from '@/lib/callrail/webhook';
import { normalizeCallFromWebhook } from '@/lib/callrail/calls';

/**
 * POST /api/webhooks/callrail/[projectId]
 *
 * Receives CallRail post-call (and call-modified) webhooks. Verifies the
 * `Signature` header against the project's stored signing key, then upserts
 * the normalized CallDTO into public.calls. Idempotent by
 * (project_id, callrail_call_id).
 *
 * IMPORTANT: We must read the body as raw bytes for HMAC, so this handler
 * uses `await request.text()` and parses JSON itself — do not switch to
 * `request.json()`.
 */

interface ProjectSigRow {
  id: string;
  callrail_company_id: string | null;
  callrail_webhook_signing_key: string | null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  // Raw body MUST come before any parsing — see file header.
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('signature');

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('projects')
    .select('id, callrail_company_id, callrail_webhook_signing_key')
    .eq('id', projectId)
    .maybeSingle<ProjectSigRow>();

  if (!row) {
    // 404 on unknown projects so attackers can't probe valid ids vs invalid
    // bindings differently.
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!row.callrail_company_id || !row.callrail_webhook_signing_key) {
    return NextResponse.json({ error: 'Project not bound to CallRail' }, { status: 404 });
  }

  const ok = verifyCallRailWebhook({
    rawBody,
    signatureHeader,
    signingKey: row.callrail_webhook_signing_key,
  });
  if (!ok) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Optional defence-in-depth: reject if the event's company_id doesn't match
  // the project's binding. Prevents a leaked signing key from being used to
  // inject calls from a different company.
  const eventCompanyId = String((parsed as { company_id?: unknown }).company_id ?? '');
  if (eventCompanyId && eventCompanyId !== row.callrail_company_id) {
    return NextResponse.json({ error: 'Company mismatch' }, { status: 409 });
  }

  const dto = normalizeCallFromWebhook(parsed, projectId);
  if (!dto) {
    return NextResponse.json({ error: 'Missing call id' }, { status: 400 });
  }

  const { error: upsertErr } = await admin
    .from('calls')
    .upsert(
      {
        project_id: projectId,
        callrail_call_id: dto.id,
        start_time: dto.startTime || null,
        direction: dto.direction,
        answered: dto.answered,
        duration: dto.duration,
        customer_name: dto.customerName,
        customer_phone: dto.customerPhone,
        customer_city: dto.customerCity,
        customer_state: dto.customerState,
        tracking_phone: dto.trackingPhone,
        source: dto.source,
        campaign: dto.campaign,
        landing_page_url: dto.landingPageUrl,
        recording_url: dto.recordingUrl,
        transcription: dto.transcription,
        payload: parsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,callrail_call_id' }
    );
  if (upsertErr) {
    console.error('[webhooks/callrail.POST] upsert failed:', upsertErr);
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
