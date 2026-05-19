import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROJECT_COLS,
  rowToDTO,
  type ProjectRow,
} from '@/lib/projects/types';
import { validateCustomDomain } from '@/lib/projects/customDomain';
import {
  addProjectDomain,
  removeProjectDomain,
  getDomainVerification,
  ProjectNotProvisionedError,
} from '@/lib/vercel/domains';
import { vercelProjectNameFor } from '@/lib/vercel/client';

/**
 * PUT /api/projects/[id]/custom-domain   { domain: "www.acme.com" }
 *   Claim or replace a customer-owned domain on this project. Mirrors the
 *   subdomain PUT route but writes `custom_domain*` columns and runs the
 *   Vercel attach immediately so we can report back whether a TXT challenge
 *   is needed.
 *
 * DELETE /api/projects/[id]/custom-domain
 *   Remove the custom domain (best-effort detach on Vercel; DB cleared
 *   regardless).
 */

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const raw = (body as { domain?: unknown })?.domain;
  const result = validateCustomDomain(raw);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const { value: domain, apex } = result;

  // Ownership check + previous value (so we can detach the old domain).
  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id, custom_domain')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const previousDomain = (ownerRow as { custom_domain: string | null }).custom_domain;

  const admin = createAdminClient();

  // DB-first so the unique index is authoritative. We optimistically set
  // status='pending_dns'; the attach call below may downgrade to
  // 'pending_verification' if Vercel needs a TXT challenge.
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({
      custom_domain: domain,
      custom_domain_apex: apex,
      custom_domain_status: 'pending_dns',
      custom_domain_error: null,
    })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();

  if (updateErr) {
    if ((updateErr as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Domain is already claimed by another project.' }, { status: 409 });
    }
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Detach the previous custom domain in the background — failures here are
  // harmless (the row already reflects the new claim).
  const projectName = vercelProjectNameFor(id);
  if (previousDomain && previousDomain !== domain) {
    try { await removeProjectDomain(projectName, previousDomain); }
    catch (err) { console.warn('[custom-domain.PUT] detach old failed:', err); }
  }

  // Same pre-publish guard as the subdomain route: skip the Vercel attach if
  // the project hasn't been deployed yet. We still keep custom_domain_status
  // as 'pending_dns' — first publish will trigger addProjectDomain, and the
  // user can hit /status to refresh after they wire up DNS.
  const { count: deploymentCount } = await admin
    .from('deployments')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id);
  const projectExistsOnVercel = (deploymentCount ?? 0) > 0;

  if (projectExistsOnVercel) {
    try {
      await addProjectDomain(projectName, domain);
      // Vercel accepted the attach. If it requires a TXT challenge, flip
      // status to 'pending_verification' so the UI shows the challenge panel
      // instead of the DNS panel.
      try {
        const v = await getDomainVerification(projectName, domain);
        if (!v.verified) {
          await admin
            .from('projects')
            .update({ custom_domain_status: 'pending_verification' })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('[custom-domain.PUT] getDomainVerification failed:', err);
      }
    } catch (err) {
      if (err instanceof ProjectNotProvisionedError) {
        // Race with project GC — leave row pending_dns; first publish reattaches.
      } else {
        const message = err instanceof Error ? err.message : 'Failed to attach domain';
        await admin
          .from('projects')
          .update({ custom_domain_status: 'error', custom_domain_error: message })
          .eq('id', id);
      }
    }
  }

  const { data: final } = await admin
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .single();
  return NextResponse.json({ project: rowToDTO((final ?? updated) as ProjectRow) });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id, custom_domain')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const previous = (ownerRow as { custom_domain: string | null }).custom_domain;

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({
      custom_domain: null,
      custom_domain_status: null,
      custom_domain_error: null,
      custom_domain_apex: false,
    })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (previous) {
    try { await removeProjectDomain(vercelProjectNameFor(id), previous); }
    catch (err) { console.warn('[custom-domain.DELETE] removeProjectDomain failed:', err); }
  }

  return NextResponse.json({ project: rowToDTO(updated as ProjectRow) });
}
