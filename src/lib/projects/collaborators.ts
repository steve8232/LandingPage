/**
 * Browser-side client for /api/projects/[id]/collaborators.
 * Mirrors remoteStorage.ts conventions.
 */

export interface CollaboratorDTO {
  userId: string;
  email: string | null;
  role: 'viewer' | 'editor';
  addedAt: string;
}

export interface CollaboratorOwnerDTO {
  userId: string;
  email: string | null;
}

export interface CollaboratorListResponse {
  owner: CollaboratorOwnerDTO;
  collaborators: CollaboratorDTO[];
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data && typeof data.error === 'string')
      ? data.error
      : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function listCollaborators(
  projectId: string
): Promise<CollaboratorListResponse> {
  const res = await fetch(`/api/projects/${projectId}/collaborators`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<CollaboratorListResponse>;
}

export async function addCollaborator(
  projectId: string,
  input: { email: string; role: 'viewer' | 'editor' }
): Promise<CollaboratorDTO> {
  const res = await fetch(`/api/projects/${projectId}/collaborators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { collaborator: CollaboratorDTO };
  return data.collaborator;
}

export async function removeCollaborator(
  projectId: string,
  userId: string
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/collaborators?userId=${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error(await parseError(res));
}
