import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { composeV1Template } from '../../../../../../v1/composer/composeV1Template';
import { composeV1ThankYou } from '../../../../../../v1/composer/composeV1ThankYou';
import { isV1Template } from '../../../../../../v1/specs';
import {
  createDeployment,
  toFullUrl,
  vercelProjectNameFor,
} from '@/lib/vercel/client';
import { mapReadyState } from '@/lib/vercel/types';
import { rowToDTO, type DeploymentRow } from '@/lib/deployments/types';
import { PROJECT_COLS, type ProjectRow } from '@/lib/projects/types';
import { buildPagesHost } from '@/lib/projects/subdomain';
import { addProjectDomain } from '@/lib/vercel/domains';

/**
 * POST /api/projects/[id]/deploy
 *   Compose HTML from the project's latest overrides, ship it to Vercel as a
 *   static deployment, persist a `deployments` row (service-role write), and
 *   return the new deployment for the client to poll.
 *
 * GET /api/projects/[id]/deploy
 *   List deployments for this project (RLS-scoped to the owner).
 */

const SELECT_COLS =
  'id, project_id, revision_id, vercel_deployment_id, url, status, error_message, created_at, updated_at';

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveAppBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
  if (configured) return stripTrailingSlashes(configured);

  // Prefer the origin that received the authenticated publish request. It is
  // usually the public app URL the user is actively using. `VERCEL_URL` can be
  // a deployment-specific hostname with Deployment Protection enabled, which
  // makes public form preflights fail with 401.
  const requestOrigin = request.nextUrl.origin;
  if (requestOrigin) return stripTrailingSlashes(requestOrigin);

  // Last-resort Vercel fallbacks. Prefer the stable project production URL over
  // a deployment URL when available.
  const vercelProjectProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || '';
  if (vercelProjectProductionUrl) {
    const withScheme = /^https?:\/\//i.test(vercelProjectProductionUrl)
      ? vercelProjectProductionUrl
      : `https://${vercelProjectProductionUrl}`;
    return stripTrailingSlashes(withScheme);
  }

  const vercelUrl = process.env.VERCEL_URL || '';
  const withScheme = /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
  return stripTrailingSlashes(withScheme);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('deployments')
    .select(SELECT_COLS)
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as DeploymentRow[];
  return NextResponse.json({ deployments: rows.map(rowToDTO) });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ownership check + load latest overrides (RLS scopes this row to owner).
  const { data: projectRow, error: projectErr } = await supabase
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .maybeSingle();

  if (projectErr) return NextResponse.json({ error: projectErr.message }, { status: 500 });
  if (!projectRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const project = projectRow as ProjectRow;
  if (!isV1Template(project.template_id)) {
    return NextResponse.json({ error: 'Unknown templateId on project' }, { status: 400 });
  }

  // Compose server-side — the server is the source of truth for HTML.
  // The lead-capture endpoint is absolute so submissions from the
  // *.pages.sparkpage.us / *.vercel.app hosts reach the SparkPage API.
  const appBase = resolveAppBaseUrl(request);
  const submitUrl = `${appBase}/api/leads/${project.id}`;

  let indexHtml: string;
  let thankYouHtml: string;
  try {
    const composed = composeV1Template(project.template_id, project.overrides, {
      allowRemoteDemoImages: true,
      submitUrl,
      redirectTo: '/thank-you',
    });
    indexHtml = composed.html;
    // Thank-you page is always shipped; copy falls back to niche defaults
    // when overrides.thankYou is unset.
    thankYouHtml = composeV1ThankYou(project.template_id, project.overrides).html;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Compose failed' },
      { status: 500 }
    );
  }

  // Fire the Vercel deployment.
  const projectName = vercelProjectNameFor(project.id);
  let vercel;
  try {
    vercel = await createDeployment({ projectName, indexHtml, thankYouHtml });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vercel deploy failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const status = mapReadyState(vercel.readyState ?? vercel.status ?? 'QUEUED');
  const url = toFullUrl(vercel.url) || null;

  // deployments table is service-role write per migration RLS.
  const admin = createAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .from('deployments')
    .insert({
      project_id: project.id,
      vercel_deployment_id: vercel.id,
      url,
      status,
    })
    .select(SELECT_COLS)
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message || 'Failed to record deployment' },
      { status: 500 }
    );
  }

  // Phase 4: if the project has claimed a subdomain, attach the matching
  // custom domain to the freshly-touched Vercel project. The actual alias
  // assignment happens once the deployment reaches `ready` (handled by the
  // deployments GET poll route). Failures here flip subdomain_status to
  // 'error' but do not break the publish — the *.vercel.app URL still works.
  if (project.subdomain) {
    const host = buildPagesHost(project.subdomain);
    try {
      await addProjectDomain(projectName, host);
      await admin
        .from('projects')
        .update({ subdomain_status: 'pending', subdomain_error: null })
        .eq('id', project.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to attach domain';
      await admin
        .from('projects')
        .update({ subdomain_status: 'error', subdomain_error: message })
        .eq('id', project.id);
      console.warn('[deploy] addProjectDomain failed:', message);
    }
  }

  return NextResponse.json(
    { deployment: rowToDTO(inserted as DeploymentRow) },
    { status: 202 }
  );
}
