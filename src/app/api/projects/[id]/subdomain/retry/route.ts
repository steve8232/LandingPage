import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROJECT_COLS,
  rowToDTO,
  type ProjectRow,
} from '@/lib/projects/types';
import { buildPagesHost } from '@/lib/projects/subdomain';
import { addProjectDomain, assignAlias } from '@/lib/vercel/domains';
import { vercelProjectNameFor } from '@/lib/vercel/client';
import { selfHealSubdomainStatus } from '@/lib/projects/subdomainHealth';

/**
 * POST /api/projects/[id]/subdomain/retry
 *   Re-runs the domain-attach + (best-effort) alias path for a project whose
 *   subdomain landed in the `'error'` state. Surfaced as the "Retry" button in
 *   the SubdomainPicker error UI. Returns the refreshed project row.
 *
 *   Idempotent: safe to call repeatedly. The HEAD self-heal at the end will
 *   flip status to 'ready' the moment the URL becomes reachable, regardless of
 *   whether Vercel itself reported success.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Owner-scoped read (RLS) — proves ownership and gives us the current state.
  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id, subdomain')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const subdomain = (ownerRow as { subdomain: string | null }).subdomain;
  if (!subdomain) {
    return NextResponse.json(
      { error: 'No subdomain claimed for this project.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const host = buildPagesHost(subdomain);
  const projectName = vercelProjectNameFor(id);

  // Reset transient error fields before retrying so the UI can show "Retrying…"
  // without leaving the previous failure message dangling.
  await admin
    .from('projects')
    .update({ subdomain_status: 'pending', subdomain_error: null })
    .eq('id', id);

  let attachError: string | null = null;
  try {
    await addProjectDomain(projectName, host);
  } catch (err) {
    attachError = err instanceof Error ? err.message : 'Failed to attach domain';
  }

  // If a previous deployment is already ready, alias it now so the URL works
  // without a fresh Publish. Best-effort — Vercel auto-aliases new deploys
  // anyway, so a failure here is recoverable on next publish.
  if (!attachError) {
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
      try {
        await assignAlias(dep.vercel_deployment_id, host);
      } catch (err) {
        attachError = err instanceof Error ? err.message : 'Failed to assign alias';
      }
    }
  }

  if (attachError) {
    await admin
      .from('projects')
      .update({ subdomain_status: 'error', subdomain_error: attachError })
      .eq('id', id);
  } else {
    await admin
      .from('projects')
      .update({ subdomain_status: 'ready', subdomain_error: null })
      .eq('id', id);
  }

  // Final HEAD self-heal: even if Vercel returned an error above, the URL may
  // actually be live (Vercel's auto-alias is transparent). Treat reachability
  // as ground truth.
  const { data: refreshed } = await admin
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .single();
  const row = refreshed as ProjectRow | null;
  if (row) {
    const healedStatus = await selfHealSubdomainStatus(
      admin,
      row.id,
      row.subdomain,
      row.subdomain_status
    );
    row.subdomain_status = healedStatus;
    if (healedStatus === 'ready') row.subdomain_error = null;
  }

  return NextResponse.json({ project: row ? rowToDTO(row) : null });
}
