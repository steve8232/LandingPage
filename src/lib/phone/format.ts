/**
 * Phone-number helpers shared by entry surfaces (research wizard, chat
 * wizard, PublishIntegrationsMenu CallRail input).
 *
 * Storage contract is raw 10-digit (no `+1`, no separators) — matches
 * `projects.business_phone` and `overrides.meta.businessPhone`. CallRail
 * promotes to E.164 at the API boundary (`toE164US`); the page composer
 * formats for display (`formatBusinessPhone`).
 *
 * Display is conventional US: `(NPA) NXX-XXXX`.
 */

/** Strip non-digits, drop a leading `1`, and cap at 10 digits. */
export function normalizePhoneToTen(input: string): string {
  const d = input.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d.slice(0, 10);
  return ten;
}

/**
 * Live formatter for a `<input type="tel">`. Accepts any input (partial,
 * already-formatted, with country code) and returns the display form.
 * Partial inputs get partial formatting so the cursor stays predictable.
 */
export function formatPhoneDisplay(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
