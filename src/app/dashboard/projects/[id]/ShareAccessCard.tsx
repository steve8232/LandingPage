'use client';

import { useState } from 'react';
import { Loader2, UserPlus, Trash2, ShieldCheck, Users } from 'lucide-react';
import {
  addCollaborator,
  removeCollaborator,
  type CollaboratorDTO,
  type CollaboratorOwnerDTO,
} from '@/lib/projects/collaborators';

interface Props {
  projectId: string;
  /** Role of the *viewer* of this card (controls write affordances). */
  viewerRole: 'admin' | 'user';
  initialOwner: CollaboratorOwnerDTO;
  initialCollaborators: CollaboratorDTO[];
}

/**
 * Per-project access management card. Admins can add/remove collaborators by
 * email; non-admins see a read-only list of who currently has access.
 */
export default function ShareAccessCard({
  projectId,
  viewerRole,
  initialOwner,
  initialCollaborators,
}: Props) {
  const [collaborators, setCollaborators] =
    useState<CollaboratorDTO[]>(initialCollaborators);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isAdmin = viewerRole === 'admin';

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setError('');
    setBusy(true);
    try {
      const next = await addCollaborator(projectId, {
        email: email.trim(),
        role,
      });
      setCollaborators((cs) => {
        const without = cs.filter((c) => c.userId !== next.userId);
        return [next, ...without];
      });
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: string) {
    if (removingId) return;
    setError('');
    setRemovingId(userId);
    try {
      await removeCollaborator(projectId, userId);
      setCollaborators((cs) => cs.filter((c) => c.userId !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <header className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-orange-600" />
        <h2 className="text-sm font-semibold text-gray-900">Access</h2>
        <span className="text-xs text-gray-500">
          {collaborators.length + 1} {collaborators.length === 0 ? 'person' : 'people'}
        </span>
      </header>

      <ul className="divide-y divide-gray-100 mb-3">
        <li className="py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-900 truncate">
              {initialOwner.email || initialOwner.userId.slice(0, 8)}
            </div>
            <div className="text-xs text-gray-500 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Owner
            </div>
          </div>
        </li>
        {collaborators.map((c) => (
          <li key={c.userId} className="py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-gray-900 truncate">
                {c.email || c.userId.slice(0, 8)}
              </div>
              <div className="text-xs text-gray-500 capitalize">{c.role}</div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleRemove(c.userId)}
                disabled={removingId === c.userId}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50"
                title="Remove access"
              >
                {removingId === c.userId
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add
          </button>
        </form>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
          {error}
        </div>
      )}
    </section>
  );
}
