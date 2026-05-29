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
import { buildPagesHost, buildPagesUrl } from '@/lib/projects/subdomain';
import { addProjectDomain, DomainClaimedError } from '@/lib/vercel/domains';
import { createPixel } from '@/lib/audiencelab/client';
import {
  createLocation,
  inviteLocationAdmin,
  isGhlConfigured,
  readSnapshotId,
} from '@/lib/ghl/client';

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
  const projectName = vercelProjectNameFor(project.id);

  // Auto-provision an AudienceLab pixel on first deploy (Angle A). Reuses the
  // stored pixel on subsequent deploys so we never create duplicates. Failures
  // here are non-fatal: the page still ships without a tracking script.
  const admin = createAdminClient();
  let pixelInstallUrl = project.audiencelab_install_url ?? null;
  if (!pixelInstallUrl && process.env.AUDIENCELAB_API_KEY) {
    const publishedUrl = project.subdomain
      ? buildPagesUrl(project.subdomain)
      : `https://${projectName}.vercel.app`;
    try {
      const pixel = await createPixel({
        websiteName: project.title || projectName,
        websiteUrl: publishedUrl,
      });
      pixelInstallUrl = pixel.install_url;
      const { error: updateErr } = await admin
        .from('projects')
        .update({
          audiencelab_pixel_id: pixel.pixel_id,
          audiencelab_install_url: pixel.install_url,
        })
        .eq('id', project.id);
      if (updateErr) {
        console.warn('[deploy] persist audiencelab pixel failed:', updateErr.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[deploy] createPixel failed:', message);
    }
  }

  // Auto-provision a GoHighLevel sub-account on first deploy. Mirrors the
  // AudienceLab block above: skipped when env is not wired, idempotent on
  // projects.ghl_location_id, non-fatal on any error so the publish still
  // ships. The owner is invited as a location admin so they can sign into
  // app.gohighlevel.com with their existing SparkPage email.
  if (!project.ghl_location_id && isGhlConfigured()) {
    try {
      const ownerEmail = user.email || '';
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        '';
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || ownerEmail.split('@')[0] || 'SparkPage';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const loc = await createLocation({
        name: project.title || projectName,
        email: ownerEmail,
        snapshotId: readSnapshotId() ?? undefined,
        phone: project.business_phone || undefined,
      });

      let invitedUserId: string | null = null;
      if (ownerEmail) {
        try {
          const invited = await inviteLocationAdmin({
            locationId: loc.id,
            email: ownerEmail,
            firstName,
            lastName,
            phone: project.business_phone || undefined,
          });
          invitedUserId = invited.id;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn('[deploy] inviteLocationAdmin failed:', message);
        }
      }

      const { error: updateErr } = await admin
        .from('projects')
        .update({
          ghl_location_id: loc.id,
          ghl_user_id: invitedUserId,
          ghl_provisioned_at: new Date().toISOString(),
        })
        .eq('id', project.id);
      if (updateErr) {
        console.warn('[deploy] persist ghl location failed:', updateErr.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[deploy] createLocation failed:', message);
    }
  }

  // CallRail swap.js URL — provisioned out-of-band via the editor toolbar.
  // Inject only when the project actually has a tracker bound; otherwise the
  // published page stays inert (same posture as the AudienceLab pixel).
  const callrailScriptUrl = project.callrail_script_url || undefined;

  // First-party heatmap tracker URL. Baked with the projectId in the query
  // string so /h.js self-configures and POSTs back to the matching ingest
  // route. The composer skips injection when meta.heatmapEnabled === false.
  const heatmapTrackerUrl = `${appBase}/h.js?p=${encodeURIComponent(project.id)}`;

  let indexHtml: string;
  let thankYouHtml: string;
  try {
    const composed = composeV1Template(project.template_id, project.overrides, {
      allowRemoteDemoImages: true,
      submitUrl,
      redirectTo: '/thank-you',
      pixelUrl: pixelInstallUrl || undefined,
      callrailScriptUrl,
      heatmapTrackerUrl,
      isPublished: true,
    });
    indexHtml = composed.html;
    // Thank-you page is always shipped; copy falls back to niche defaults
    // when overrides.thankYou is unset.
    thankYouHtml = composeV1ThankYou(project.template_id, project.overrides, {
      pixelUrl: pixelInstallUrl || undefined,
      callrailScriptUrl,
      isPublished: true,
    }).html;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Compose failed' },
      { status: 500 }
    );
  }

  // Fire the Vercel deployment.
  let vercel;
  try {
    vercel = await createDeployment({ projectName, indexHtml, thankYouHtml });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vercel deploy failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const status = mapReadyState(vercel.readyState ?? vercel.status ?? 'QUEUED');
  const url = toFullUrl(vercel.url) || null;

  // deployments table is service-role write per migration RLS. `admin` was
  // already created above for the audiencelab provisioning step.
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

  // BYO custom domain — same idea as the subdomain attach above. Status is
  // left as 'pending_dns' (or 'pending_verification' if Vercel still needs
  // the TXT challenge); the /status endpoint flips it to 'ready' once the
  // user's DNS resolves. releaseOrphan lets us auto-clean a stale sparkpage-*
  // attach left over from a deleted project that used this domain.
  if (project.custom_domain) {
    try {
      await addProjectDomain(projectName, project.custom_domain, { releaseOrphan: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to attach custom domain';
      const errorCode = err instanceof DomainClaimedError ? err.errorCode : null;
      await admin
        .from('projects')
        .update({
          custom_domain_status: 'error',
          custom_domain_error: message,
          custom_domain_error_code: errorCode,
        })
        .eq('id', project.id);
      console.warn('[deploy] addProjectDomain (custom) failed:', message);
    }
  }

  return NextResponse.json(
    { deployment: rowToDTO(inserted as DeploymentRow) },
    { status: 202 }
  );
}
