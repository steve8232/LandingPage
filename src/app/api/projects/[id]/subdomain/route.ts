import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  rowToDTO,
  PROJECT_COLS,
  type ProjectRow,
} from '@/lib/projects/types';
import { buildPagesHost, validateSubdomain } from '@/lib/projects/subdomain';
import {
  addProjectDomain,
  removeProjectDomain,
  assignAlias,
} from '@/lib/vercel/domains';
import { vercelProjectNameFor } from '@/lib/vercel/client';

/**
 * GET    /api/projects/[id]/subdomain?candidate=foo  — availability check
 * PUT    /api/projects/[id]/subdomain                — claim / change
 * DELETE /api/projects/[id]/subdomain                — release
 *
 * Auth: owner only (RLS on projects + explicit getUser check). Writes use the
 * service-role admin client so subdomain_status / error fields stay consistent.
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const candidate = request.nextUrl.searchParams.get('candidate') ?? '';
  const result = validateSubdomain(candidate);
  if (!result.ok) return NextResponse.json({ available: false, error: result.error });

  // Owner check on the requesting project (also rejects unknown ids).
  const { data: own } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!own) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Availability: any other project that already holds this subdomain.
  // RLS would hide foreign rows from a normal client, so use the admin client
  // for a true global check.
  const admin = createAdminClient();
  const { data: clash } = await admin
    .from('projects')
    .select('id')
    .eq('subdomain', result.value)
    .neq('id', id)
    .maybeSingle();

  return NextResponse.json({
    available: !clash,
    value: result.value,
    error: clash ? 'Already taken.' : undefined,
  });
}

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
  const raw = (body as { subdomain?: unknown })?.subdomain;
  const result = validateSubdomain(raw);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const value = result.value;

  // Owner-scoped read (RLS) to fetch the current subdomain and prove ownership.
  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id, subdomain')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const previousSubdomain = (ownerRow as { subdomain: string | null }).subdomain;

  const admin = createAdminClient();

  // Apply DB change first so the unique index is the source of truth.
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({ subdomain: value, subdomain_status: 'pending', subdomain_error: null })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();

  if (updateErr) {
    // 23505 = unique_violation
    if ((updateErr as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Already taken.' }, { status: 409 });
    }
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Best-effort: detach old, attach new, and alias the latest ready deploy if
  // one exists. Any failure flips subdomain_status to 'error' — the DB row
  // change still succeeds so the user sees their new claim.
  const projectName = vercelProjectNameFor(id);
  const newHost = buildPagesHost(value);
  try {
    if (previousSubdomain && previousSubdomain !== value) {
      await removeProjectDomain(projectName, buildPagesHost(previousSubdomain));
    }
    await addProjectDomain(projectName, newHost);

    // If a previous deployment is already ready, alias it now so the URL
    // works without the user re-clicking Publish.
    const { data: latest } = await admin
      .from('deployments')
      .select('vercel_deployment_id, status')
      .eq('project_id', id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const dep = latest as { vercel_deployment_id: string | null } | null;
    if (dep?.vercel_deployment_id) {
      await assignAlias(dep.vercel_deployment_id, newHost);
      await admin
        .from('projects')
        .update({ subdomain_status: 'ready' })
        .eq('id', id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to attach domain';
    await admin
      .from('projects')
      .update({ subdomain_status: 'error', subdomain_error: message })
      .eq('id', id);
  }

  // Re-read so the response reflects the final subdomain_status.
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
    .select('id, subdomain')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const previous = (ownerRow as { subdomain: string | null }).subdomain;

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({ subdomain: null, subdomain_status: null, subdomain_error: null })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (previous) {
    try {
      await removeProjectDomain(vercelProjectNameFor(id), buildPagesHost(previous));
    } catch (err) {
      console.warn('[subdomain.DELETE] removeProjectDomain failed:', err);
    }
  }

  return NextResponse.json({ project: rowToDTO(updated as ProjectRow) });
}
