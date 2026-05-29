import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  createLocation,
  inviteLocationAdmin,
  isGhlConfigured,
  readSnapshotId,
} from '@/lib/ghl/client';

/**
 * POST /api/admin/projects/[id]/ghl/provision
 *   { email, password, firstName?, lastName? }
 *
 * Admin-only. Manually provisions a GoHighLevel sub-account for the
 * project and attaches the supplied email as a location admin with the
 * supplied password (GHL skips its "set password" email when a password
 * is provided, so the credential becomes the immediate sign-in).
 *
 * Idempotent: returns 409 with the existing locationId when
 * projects.ghl_location_id is already set. The password is read from the
 * request body, forwarded once to GHL, and never logged or persisted.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!isGhlConfigured()) {
    return NextResponse.json(
      { error: 'GHL is not configured. Set GHL_AGENCY_PIT and GHL_COMPANY_ID.' },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Project id required' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const b = (body || {}) as Record<string, unknown>;

  const email = typeof b.email === 'string' ? b.email.trim() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  const firstName = typeof b.firstName === 'string' && b.firstName.trim()
    ? b.firstName.trim()
    : '';
  const lastName = typeof b.lastName === 'string' && b.lastName.trim()
    ? b.lastName.trim()
    : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: project, error: projErr } = await admin
    .from('projects')
    .select('id, title, business_phone, ghl_location_id')
    .eq('id', id)
    .maybeSingle<{
      id: string;
      title: string | null;
      business_phone: string | null;
      ghl_location_id: string | null;
    }>();
  if (projErr) {
    return NextResponse.json({ error: projErr.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  if (project.ghl_location_id) {
    return NextResponse.json(
      {
        error: 'GHL sub-account already provisioned for this project.',
        locationId: project.ghl_location_id,
      },
      { status: 409 },
    );
  }

  // Derive sensible default names from the email local part when the admin
  // did not supply them. GHL requires firstName/lastName to be non-empty.
  const localPart = email.split('@')[0] || 'SparkPage';
  const resolvedFirst = firstName || localPart;
  const resolvedLast = lastName || 'User';

  let locationId: string;
  try {
    const loc = await createLocation({
      name: project.title || 'SparkPage',
      email,
      snapshotId: readSnapshotId() ?? undefined,
      phone: project.business_phone || undefined,
    });
    locationId = loc.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'createLocation failed';
    console.warn('[admin/ghl/provision] createLocation failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let invitedUserId: string | null = null;
  try {
    const invited = await inviteLocationAdmin({
      locationId,
      email,
      firstName: resolvedFirst,
      lastName: resolvedLast,
      phone: project.business_phone || undefined,
      password,
    });
    invitedUserId = invited.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'inviteLocationAdmin failed';
    // Sub-account is already created at this point; surface a partial-success
    // status so the admin can manually finish the user invite in GHL if
    // needed. We still persist the location so a future re-invite can target it.
    console.warn('[admin/ghl/provision] inviteLocationAdmin failed:', message);
    await admin
      .from('projects')
      .update({
        ghl_location_id: locationId,
        ghl_provisioned_at: new Date().toISOString(),
      })
      .eq('id', id);
    return NextResponse.json(
      { error: `Location created (${locationId}) but user invite failed: ${message}`, locationId },
      { status: 502 },
    );
  }

  const provisionedAt = new Date().toISOString();
  const { error: updErr } = await admin
    .from('projects')
    .update({
      ghl_location_id: locationId,
      ghl_user_id: invitedUserId,
      ghl_provisioned_at: provisionedAt,
    })
    .eq('id', id);
  if (updErr) {
    console.warn('[admin/ghl/provision] persist failed:', updErr.message);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    locationId,
    userId: invitedUserId,
    provisionedAt,
  });
}
