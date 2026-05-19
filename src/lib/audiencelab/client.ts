/**
 * Minimal typed wrapper around the AudienceLab REST API.
 *
 * Auth: a single global `AUDIENCELAB_API_KEY` env var shared across all
 * SparkPage accounts (Angle A — Option 1). Server-only; never imported
 * from the client.
 *
 * Docs:
 *   https://audiencelab.mintlify.app/api-reference/pixel/create-pixel
 *   https://audiencelab.mintlify.app/api-reference/pixel/get-pixels
 */

const AUDIENCELAB_API = 'https://api.audiencelab.io';

export interface CreatePixelInput {
  /** Display name for the pixel inside AudienceLab. */
  websiteName: string;
  /** Canonical URL where the pixel will be installed (the published page). */
  websiteUrl: string;
  /** Optional webhook for pixel events. */
  webhookUrl?: string;
  /** Defaults to 'v4' (latest). */
  version?: 'v3' | 'v4';
}

export interface CreatePixelResponse {
  pixel_id: string;
  install_url: string;
}

function readApiKey(): string {
  const key = process.env.AUDIENCELAB_API_KEY;
  if (!key) {
    throw new Error('[audiencelab/client] Missing AUDIENCELAB_API_KEY env var');
  }
  return key;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.message || data?.error?.message || data?.error;
    return typeof msg === 'string' ? msg : `AudienceLab API ${res.status}`;
  } catch {
    return `AudienceLab API ${res.status}`;
  }
}

/**
 * Create a new pixel pointing at `websiteUrl`. Returns the pixel id and the
 * `install_url` — a JS file that gets injected into the published HTML.
 */
export async function createPixel(input: CreatePixelInput): Promise<CreatePixelResponse> {
  const apiKey = readApiKey();
  const body = {
    websiteName: input.websiteName,
    websiteUrl: input.websiteUrl,
    webhookUrl: input.webhookUrl,
    version: input.version ?? 'v4',
  };

  const res = await fetch(`${AUDIENCELAB_API}/pixels`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`createPixel failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as CreatePixelResponse;
  if (!data?.pixel_id || !data?.install_url) {
    throw new Error('createPixel: response missing pixel_id / install_url');
  }
  return data;
}
