import type { V1ContentOverrides } from '../../../v1/composer/composeV1Template';

/**
 * Row shape for `public.projects` (see supabase/migrations/0001_init.sql).
 * `overrides` is stored as jsonb; we treat it as V1ContentOverrides here for
 * the editor round-trip. New columns added to the SQL schema must be mirrored
 * here.
 */
export type SubdomainStatus = 'pending' | 'ready' | 'error';

export interface ProjectRow {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  slug: string;
  overrides: V1ContentOverrides;
  subdomain: string | null;
  subdomain_status: SubdomainStatus | null;
  subdomain_error: string | null;
  created_at: string;
  updated_at: string;
}

/** Public-facing project payload returned by the API routes. */
export interface ProjectDTO {
  id: string;
  templateId: string;
  title: string;
  slug: string;
  overrides: V1ContentOverrides;
  subdomain: string | null;
  subdomainStatus: SubdomainStatus | null;
  subdomainError: string | null;
  createdAt: string;
  updatedAt: string;
}

export function rowToDTO(row: ProjectRow): ProjectDTO {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    slug: row.slug,
    overrides: (row.overrides || {}) as V1ContentOverrides,
    subdomain: row.subdomain ?? null,
    subdomainStatus: row.subdomain_status ?? null,
    subdomainError: row.subdomain_error ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Column list shared by `/api/projects` queries — keep in sync with ProjectRow. */
export const PROJECT_COLS =
  'id, user_id, template_id, title, slug, overrides, subdomain, subdomain_status, subdomain_error, created_at, updated_at';

/**
 * Slug from a free-form title plus a short random suffix so two projects with
 * the same title don't collide on the (user_id, slug) unique index.
 */
export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'sparkpage';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
