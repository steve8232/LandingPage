import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROJECT_COLS,
  rowToDTO,
  type ProjectRow,
  type CustomDomainStatus,
} from '@/lib/projects/types';
import {
  addProjectDomain,
  assignAlias,
  getDomainConfig,
  getDomainVerification,
  verifyProjectDomain,
  ProjectNotProvisionedError,
} from '@/lib/vercel/domains';
import { vercelProjectNameFor } from '@/lib/vercel/client';
import { verifySubdomainLive } from '@/lib/projects/subdomainHealth';

/**
 * GET /api/projects/[id]/custom-domain/status
 *   Re-polls Vercel for the current attach + verification + DNS state of the
 *   project's custom_domain, writes the result back to the row, and returns
 *   the refreshed project. Backs the Recheck / polling loop in
 *   CustomDomainPicker.
 *
 *   State machine:
 *     no domain      → no-op, return row as-is
 *     project not provisioned (pre-publish) → status='pending_dns'
 *     verify endpoint returns verified=false → 'pending_verification'
 *                                            (TXT name/value returned in body)
 *     config.misconfigured=true              → 'pending_dns'
 *     config.misconfigured=false             → 'ready' (also runs assignAlias
 *                                              against the latest ready deploy
 *                                              if one exists)
 *     HEAD <domain> 2xx/3xx as final fallback → 'ready' (covers the Vercel-
 *                                              poll-lag race)
 */
export async function GET(
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
  const domain = (ownerRow as { custom_domain: string | null }).custom_domain;

  const admin = createAdminClient();
  if (!domain) {
    const { data: row } = await admin
      .from('projects')
      .select(PROJECT_COLS)
      .eq('id', id)
      .single();
    return NextResponse.json({
      project: row ? rowToDTO(row as ProjectRow) : null,
      verification: null,
    });
  }

  const projectName = vercelProjectNameFor(id);

  let nextStatus: CustomDomainStatus = 'pending_dns';
  let nextError: string | null = null;
  let txtName: string | null = null;
  let txtValue: string | null = null;

  try {
    // 1. Verification first — if Vercel hasn't accepted ownership we can't
    //    even reach the config endpoint meaningfully. verifyProjectDomain
    //    triggers a fresh re-check on Vercel's side which is exactly what
    //    the "I added the TXT, recheck" button needs.
    const verified = await verifyProjectDomain(projectName, domain);
    if (!verified) {
      const v = await getDomainVerification(projectName, domain);
      nextStatus = 'pending_verification';
      txtName = v.txtName;
      txtValue = v.txtValue;
    } else {
      // 2. Ownership ok. Probe DNS config.
      const cfg = await getDomainConfig(projectName, domain);
      if (cfg.misconfigured) {
        nextStatus = 'pending_dns';
      } else {
        nextStatus = 'ready';
        // Best-effort: alias the latest ready deployment so the URL serves
        // current content without a fresh Publish. Vercel auto-aliases new
        // deploys, so a failure here is recoverable.
        const { data: latest } = await admin
          .from('deployments')
          .select('vercel_deployment_id')
          .eq('project_id', id)
          .eq('status', 'ready')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const dep = latest as { vercel_deployment_id: string | null } | null;
        if (dep?.vercel_deployment_id) {
          try { await assignAlias(dep.vercel_deployment_id, domain); }
          catch (err) { console.warn('[custom-domain/status] assignAlias failed:', err); }
        }
      }
    }
  } catch (err) {
    if (err instanceof ProjectNotProvisionedError) {
      // Pre-publish: leave the row pending_dns. First publish runs
      // addProjectDomain via the deploy route (added below).
      nextStatus = 'pending_dns';
    } else {
      // Try once more to attach in case the row is fresh but the deploy
      // route's attach failed. If even that errors, surface it.
      try {
        await addProjectDomain(projectName, domain);
        nextStatus = 'pending_dns';
      } catch (err2) {
        if (err2 instanceof ProjectNotProvisionedError) {
          nextStatus = 'pending_dns';
        } else {
          nextStatus = 'error';
          nextError = err2 instanceof Error ? err2.message : 'Vercel error';
        }
      }
    }
  }

  // 3. HEAD-reachability self-heal. Trust ground truth over API state — same
  //    pattern as the subdomain self-heal. If Vercel says misconfigured but
  //    the URL actually serves, the user is done and we shouldn't gate them.
  if (nextStatus !== 'ready') {
    const live = await verifySubdomainLive(domain);
    if (live) {
      nextStatus = 'ready';
      nextError = null;
    }
  }

  await admin
    .from('projects')
    .update({
      custom_domain_status: nextStatus,
      custom_domain_error: nextError,
    })
    .eq('id', id);

  const { data: refreshed } = await admin
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .single();

  return NextResponse.json({
    project: refreshed ? rowToDTO(refreshed as ProjectRow) : null,
    verification: txtName && txtValue ? { txtName, txtValue } : null,
  });
}
