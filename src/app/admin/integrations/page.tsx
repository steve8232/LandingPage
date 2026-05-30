import { createAdminClient } from '@/lib/supabase/admin';
import { findCleanupCandidates } from '@/lib/audiencelab/cleanup';
import IntegrationsClient, {
  type AudienceLabCleanupSnapshot,
} from './IntegrationsClient';

export const dynamic = 'force-dynamic';

/**
 * /admin/integrations — surface for cross-tenant integration housekeeping.
 *
 * v1 ships the AudienceLab pixel-cleanup tool (UI port of
 * `scripts/cleanup-audiencelab-pixels.ts`). Both surfaces share
 * src/lib/audiencelab/cleanup.ts as the source of truth.
 *
 * Initial paint runs the dry-run scan inline so the admin sees the
 * candidate list immediately; the client can re-scan and apply via the
 * paired /api/admin/maintenance/audiencelab-cleanup route.
 */
export default async function AdminIntegrationsPage() {
  const admin = createAdminClient();
  let initial: AudienceLabCleanupSnapshot;
  try {
    const { scanned, candidates } = await findCleanupCandidates(admin);
    initial = { scanned, candidates, error: null };
  } catch (err) {
    initial = {
      scanned: 0,
      candidates: [],
      error: err instanceof Error ? err.message : 'Scan failed',
    };
  }

  return <IntegrationsClient initialAudienceLab={initial} />;
}
