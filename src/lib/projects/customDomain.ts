/**
 * Custom-domain (BYO) validation + DNS-hint helpers shared by the API route
 * and client UI. Companion to ./subdomain.ts which handles the SparkPage URL
 * (*.pages.sparkpage.us) flow.
 *
 * Rules:
 *   - 2+ labels, each [a-z0-9-]{1,63}, no leading/trailing hyphen.
 *   - TLD must be 2+ alpha chars.
 *   - We reject anything inside sparkpage.us — those go through the subdomain
 *     picker so users don't accidentally claim something they don't own.
 *   - Apex = exactly two labels (acme.com). Anything deeper (www.acme.com) is
 *     a subdomain. This is the right call for 99%+ of TLDs; multi-part TLDs
 *     like .co.uk are a documented limitation and only affect the DNS hint
 *     UI, not the actual attach (Vercel resolves it correctly either way).
 */

export type CustomDomainValidation =
  | { ok: true; value: string; apex: boolean }
  | { ok: false; error: string };

/** Single DNS label: letters/digits/hyphens, no edge hyphens, 1..63 chars. */
const LABEL = '[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?';
const DOMAIN_RE = new RegExp(`^(${LABEL}\\.)+[a-z]{2,}$`);

export function validateCustomDomain(input: unknown): CustomDomainValidation {
  if (typeof input !== 'string') {
    return { ok: false, error: 'Domain must be a string.' };
  }
  // Tolerate users pasting "https://www.acme.com/" or "www.acme.com/path".
  let v = input.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, '');
  v = v.replace(/\/.*$/, '');
  v = v.replace(/^\.+|\.+$/g, '');

  if (!v) {
    return { ok: false, error: 'Enter a domain like www.acme.com.' };
  }
  if (v.length > 253) {
    return { ok: false, error: 'Domain is too long.' };
  }
  if (!DOMAIN_RE.test(v)) {
    return { ok: false, error: 'Enter a valid domain like www.acme.com.' };
  }
  if (v === 'sparkpage.us' || v.endsWith('.sparkpage.us')) {
    return {
      ok: false,
      error: 'Use the SparkPage URL field for sparkpage.us domains.',
    };
  }

  // Apex = exactly two labels (acme.com). Anything deeper is a subdomain
  // even on multi-part TLDs — only affects which DNS hint we render, not
  // whether Vercel will accept the attach.
  const apex = v.split('.').length === 2;
  return { ok: true, value: v, apex };
}

/**
 * Vercel's published DNS targets for custom domains. These are public values
 * (see https://vercel.com/docs/projects/domains/working-with-domains) so safe
 * to hard-code; we expose them through helpers so the UI doesn't repeat them.
 */
export const VERCEL_APEX_A_RECORD = '76.76.21.21';
export const VERCEL_CNAME_TARGET = 'cname.vercel-dns.com';

/** Hint shown alongside the input. Pure function — no I/O. */
export function dnsInstructionFor(domain: string, apex: boolean): {
  recordType: 'A' | 'CNAME';
  host: string;
  value: string;
} {
  if (apex) {
    return { recordType: 'A', host: '@', value: VERCEL_APEX_A_RECORD };
  }
  // For subdomains the "host" portion of the DNS record is everything left
  // of the apex. e.g. www.acme.com → host="www".
  const parts = domain.split('.');
  const host = parts.slice(0, parts.length - 2).join('.') || '@';
  return { recordType: 'CNAME', host, value: VERCEL_CNAME_TARGET };
}
