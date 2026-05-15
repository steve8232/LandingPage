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
        return NextResponse.json({ deployment: rowToDTO(updated as DeploymentRow) });
      }
    }
  } catch (err) {
    console.warn('[api/deployments] Vercel refresh failed:', err);
  }

  return NextResponse.json({ deployment: rowToDTO(current) });
}
