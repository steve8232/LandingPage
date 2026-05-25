'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2, Loader2, Search } from 'lucide-react';

export interface AdminCollabRowDTO {
  projectId: string;
  projectTitle: string;
  userId: string;
  userEmail: string | null;
  role: 'viewer' | 'editor';
  addedBy: string | null;
  addedByEmail: string | null;
  addedAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export default function CollaboratorsClient({
  initialRows,
}: {
  initialRows: AdminCollabRowDTO[];
}) {
  const [rows, setRows] = useState<AdminCollabRowDTO[]>(initialRows);
  const [query, setQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.projectTitle.toLowerCase().includes(q)
      || (r.userEmail ?? '').toLowerCase().includes(q)
      || (r.addedByEmail ?? '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  async function handleRemove(r: AdminCollabRowDTO) {
    if (!confirm(`Remove ${r.userEmail ?? 'this user'} from "${r.projectTitle}"?`)) return;
    const key = `${r.projectId}:${r.userId}`;
    setBusyKey(key);
    setError('');
    setInfo('');
    try {
      const url = `/api/projects/${r.projectId}/collaborators?userId=${encodeURIComponent(r.userId)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Remove failed (${res.status})`);
      setRows((prev) => prev.filter((x) => !(x.projectId === r.projectId && x.userId === r.userId)));
      setInfo(`Removed ${r.userEmail ?? r.userId} from "${r.projectTitle}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-4">
      {(error || info) && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            error
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {error || info}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search page or user…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} of {rows.length}</span>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Added by</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No collaborators yet.
                  </td>
                </tr>
              ) : filtered.map((r) => {
                const key = `${r.projectId}:${r.userId}`;
                const isBusy = busyKey === key;
                return (
                  <tr key={key} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/projects/${r.projectId}`}
                        className="font-medium text-gray-900 hover:text-orange-700 truncate inline-block max-w-[18rem]"
                        title={r.projectTitle}
                      >
                        {r.projectTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[14rem]" title={r.userEmail ?? ''}>
                      {r.userEmail ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-wide">
                        {r.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[14rem]" title={r.addedByEmail ?? ''}>
                      {r.addedByEmail ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(r.addedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(r)}
                        disabled={isBusy}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Remove collaborator"
                      >
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
