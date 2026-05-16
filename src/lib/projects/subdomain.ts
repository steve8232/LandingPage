/**
 * Subdomain validation + URL helpers shared by the API route and client UI.
 * Rules (Phase 4):
 *   - 3..32 chars
 *   - [a-z0-9-]+
 *   - cannot start or end with '-'
 *   - cannot be in the reserved list (system routes / brand-critical names)
 */

const RESERVED: ReadonlySet<string> = new Set([
  'www', 'app', 'api', 'admin', 'mail', 'send', 'static', 'assets', 'pages',
  'auth', 'dashboard', 'login', 'signup', 'signin', 'help', 'support', 'docs',
  'blog', 'about', 'pricing',
]);

export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 32;

export type SubdomainValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateSubdomain(input: unknown): SubdomainValidation {
  if (typeof input !== 'string') {
    return { ok: false, error: 'Subdomain must be a string.' };
  }
  const v = input.trim().toLowerCase();
  if (v.length < SUBDOMAIN_MIN) {
    return { ok: false, error: `Must be at least ${SUBDOMAIN_MIN} characters.` };
  }
  if (v.length > SUBDOMAIN_MAX) {
    return { ok: false, error: `Must be at most ${SUBDOMAIN_MAX} characters.` };
  }
  if (!/^[a-z0-9-]+$/.test(v)) {
    return { ok: false, error: 'Only lowercase letters, numbers, and hyphens.' };
  }
  if (v.startsWith('-') || v.endsWith('-')) {
    return { ok: false, error: 'Cannot start or end with a hyphen.' };
  }
  if (RESERVED.has(v)) {
    return { ok: false, error: 'This subdomain is reserved.' };
  }
  return { ok: true, value: v };
}

/**
 * Parent domain for published pages. Configurable via env so dev / staging /
 * prod can each route to their own DNS zone. Defaults to the prod value.
 */
export const PAGES_PARENT_DOMAIN: string =
  process.env.NEXT_PUBLIC_PAGES_PARENT_DOMAIN || 'pages.sparkpage.us';

export function buildPagesHost(subdomain: string): string {
  return `${subdomain}.${PAGES_PARENT_DOMAIN}`;
}

export function buildPagesUrl(subdomain: string): string {
  return `https://${buildPagesHost(subdomain)}`;
}

/** Best-effort suggestion derived from a free-form title. */
export function suggestSubdomain(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SUBDOMAIN_MAX);
  if (!base || base.length < SUBDOMAIN_MIN) return '';
  if (RESERVED.has(base)) return '';
  return base;
}
