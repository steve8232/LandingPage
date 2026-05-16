/**
 * Row shape for `public.leads` (supabase/migrations/0003_leads.sql).
 * Writes go through the service-role admin client (the route accepts
 * unauthenticated POSTs from published landing pages); reads are RLS-scoped
 * to project owners via the leads_owner_select policy.
 */
export interface LeadRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
  user_agent: string | null;
  referer: string | null;
  ip: string | null;
  created_at: string;
}

export interface LeadDTO {
  id: string;
  projectId: string;
  payload: Record<string, unknown>;
  userAgent: string | null;
  referer: string | null;
  createdAt: string;
}

export function leadRowToDTO(row: LeadRow): LeadDTO {
  return {
    id: row.id,
    projectId: row.project_id,
    payload: row.payload ?? {},
    userAgent: row.user_agent,
    referer: row.referer,
    createdAt: row.created_at,
  };
}
