/**
 * Subset of the Vercel REST API surface that we consume. We only model the
 * fields we read; unknown fields are tolerated.
 */

/** Vercel deployment lifecycle states (from API v13). */
export type VercelReadyState =
  | 'QUEUED'
  | 'INITIALIZING'
  | 'BUILDING'
  | 'READY'
  | 'ERROR'
  | 'CANCELED';

/** Internal status enum mirroring the `deployments.status` check constraint. */
export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'ready'
  | 'error'
  | 'canceled';

export function mapReadyState(state: VercelReadyState | string): DeploymentStatus {
  switch (state) {
    case 'READY': return 'ready';
    case 'ERROR': return 'error';
    case 'CANCELED': return 'canceled';
    case 'QUEUED':
    case 'INITIALIZING':
    case 'BUILDING':
      return 'building';
    default:
      return 'building';
  }
}

export interface VercelDeploymentResponse {
  id: string;
  url?: string;
  readyState?: VercelReadyState;
  /** Newer responses use `status` instead of `readyState` for some endpoints. */
  status?: VercelReadyState;
  alias?: string[];
  errorMessage?: string;
  createdAt?: number;
}

export interface VercelDeploymentCreateRequest {
  name: string;
  files: Array<{ file: string; data: string }>;
  target?: 'production' | 'staging';
  projectSettings?: {
    framework?: string | null;
    buildCommand?: string | null;
    outputDirectory?: string | null;
    installCommand?: string | null;
    devCommand?: string | null;
  };
}
