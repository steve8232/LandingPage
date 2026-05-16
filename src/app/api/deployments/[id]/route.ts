import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDeployment, toFullUrl } from '@/lib/vercel/client';
import { mapReadyState } from '@/lib/vercel/types';
import {
  isTerminalStatus,
  rowToDTO,
  type DeploymentRow,
} from '@/lib/deployments/types';
import { selfHealSubdomainStatus } from '@/lib/projects/subdomainHealth';

/**
 * GET /api/deployments/[id]
 *   Polled by the editor / dashboard. Returns the current DB row; if the row
 *   is still non-terminal, refreshes status from Vercel and persists the new
 *   state with the service-role admin client before returning.
 *
 *   RLS on the SELECT side scopes this row to project owners via the
 *   `deployments_owner_select` policy (deployment -> project -> user_id).
 */

const SELECT_COLS =
  'id, project_id, revision_id, vercel_deployment_id, url, status, error_message, created_at, updated_at';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Owner-scoped read.
  const { data: row, error } = await supabase
    .from('deployments')
    .select(SELECT_COLS)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const current = row as DeploymentRow;

  // Terminal states are returned as-is — no need to call Vercel again.
  if (isTerminalStatus(current.status) || !current.vercel_deployment_id) {
    return NextResponse.json({ deployment: rowToDTO(current) });
  }

  // Refresh from Vercel. Failures here are non-fatal — we still return the
  // last-known row so the UI can keep polling.
  try {
    const vercel = await getDeployment(current.vercel_deployment_id);
    const nextStatus = mapReadyState(vercel.readyState ?? vercel.status ?? 'BUILDING');
    const nextUrl = toFullUrl(vercel.url) || current.url;
    const nextError = vercel.errorMessage || null;

    const changed =
      nextStatus !== current.status ||
      nextUrl !== current.url ||
      nextError !== current.error_message;

    if (changed) {
      const admin = createAdminClient();
      const { data: updated, error: upErr } = await admin
        .from('deployments')
        .update({
          status: nextStatus,
          url: nextUrl,
          error_message: nextError,
        })
        .eq('id', current.id)
        .select(SELECT_COLS)
        .single();

      if (!upErr && updated) {
        // Phase 4: when the deployment reaches `ready` and the project has a
        // subdomain claimed, mark `subdomain_status='ready'`. Vercel auto-
        // aliases production deployments to project-level custom domains, so
        // no explicit `assignAlias` call is needed in the publish flow — that
        // call was the most common source of false-positive `error` rows.
        // For projects already flagged 'error' (e.g. from an earlier transient
        // failure), trust HEAD-reachability as the source of truth.
        if (nextStatus === 'ready') {
          await markSubdomainReadyIfClaimed(admin, current.project_id);
        }
        return NextResponse.json({ deployment: rowToDTO(updated as DeploymentRow) });
      }
    }
  } catch (err) {
    console.warn('[api/deployments] Vercel refresh failed:', err);
  }

  return NextResponse.json({ deployment: rowToDTO(current) });
}

/**
 * Promote `subdomain_status` to `'ready'` when a deployment finishes building
 * and the project has a subdomain claimed. If the row is currently in 'error',
 * fall back to the HEAD self-heal so we only flip it once the URL actually
 * resolves. Never throws — caller is in a polling hot path.
 */
async function markSubdomainReadyIfClaimed(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string
): Promise<void> {
  try {
    const { data: proj } = await admin
      .from('projects')
      .select('id, subdomain, subdomain_status')
      .eq('id', projectId)
      .maybeSingle();
    const row = proj as {
      subdomain: string | null;
      subdomain_status: 'pending' | 'ready' | 'error' | null;
    } | null;
    if (!row || !row.subdomain) return;
    if (row.subdomain_status === 'ready') return;

    if (row.subdomain_status === 'error') {
      // Don't blindly flip a known-bad row green — only when the URL actually
      // responds. selfHealSubdomainStatus handles the HEAD + DB update.
      await selfHealSubdomainStatus(admin, projectId, row.subdomain, 'error');
      return;
    }

    // 'pending' (or null) → ready: deploy finished and Vercel auto-aliases
    // production builds, so the URL is live as soon as the build is ready.
    await admin
      .from('projects')
      .update({ subdomain_status: 'ready', subdomain_error: null })
      .eq('id', projectId);
  } catch (err) {
    console.warn('[api/deployments] markSubdomainReadyIfClaimed failed:', err);
  }
}
