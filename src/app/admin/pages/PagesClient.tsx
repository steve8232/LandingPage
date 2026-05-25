'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink, LayoutDashboard, Trash2, ArrowRightLeft, Loader2, Search,
} from 'lucide-react';
import type { ProjectDTO } from '@/lib/projects/types';
import type { DeploymentDTO } from '@/lib/deployments/types';
import { PAGES_PARENT_DOMAIN } from '@/lib/projects/subdomain';
import { resolveProjectDisplayUrls } from '@/lib/projects/displayUrl';
import { v1Templates } from '@/lib/v1Templates';
import { deleteProject } from '@/lib/projects/remoteStorage';

export interface AdminPageRowDTO {
  project: ProjectDTO;
  ownerId: string;
  ownerEmail: string | null;
  collaboratorCount: number;
  latestDeployment: DeploymentDTO | null;
}

export interface OwnerOptionDTO {
  userId: string;
  email: string | null;
  role: 'admin' | 'user';
}

const STATUS_PILL: Record<DeploymentDTO['status'], { label: string; cls: string }> = {
  pending:  { label: 'Queued',    cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  building: { label: 'Building…', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready:    { label: 'Live',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  error:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200' },
  canceled: { label: 'Canceled',  cls: 'bg-gray-100 text-gray-700 border-gray-200' },
};

function templateName(id: string): string {
  return v1Templates.find((t) => t.id === id)?.name ?? id;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PagesClient({
  initialPages,
  owners,
}: {
  initialPages: AdminPageRowDTO[];
  owners: OwnerOptionDTO[];
}) {
  const [pages, setPages] = useState<AdminPageRowDTO[]>(initialPages);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [transferOpenId, setTransferOpenId] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const ownerById = useMemo(
    () => new Map(owners.map((o) => [o.userId, o])),
    [owners]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => {
      const title = p.project.title.toLowerCase();
      const slug = (p.project.slug || '').toLowerCase();
      const subdomain = (p.project.subdomain || '').toLowerCase();
      const owner = (p.ownerEmail || '').toLowerCase();
      return (
        title.includes(q) || slug.includes(q) || subdomain.includes(q) || owner.includes(q)
      );
    });
  }, [pages, query]);

  async function handleDelete(p: AdminPageRowDTO) {
    if (!confirm(`Delete "${p.project.title}"? This permanently removes the page and all its data.`)) return;
    setBusyId(p.project.id);
    setError('');
    setInfo('');
    try {
      await deleteProject(p.project.id);
      setPages((prev) => prev.filter((x) => x.project.id !== p.project.id));
      setInfo(`Deleted "${p.project.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleTransfer(p: AdminPageRowDTO) {
    const ownerId = transferTarget;
    if (!ownerId || ownerId === p.ownerId) {
      setTransferOpenId(null);
      return;
    }
    setBusyId(p.project.id);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`/api/admin/projects/${p.project.id}/owner`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ownerId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Transfer failed (${res.status})`);
      const nextOwner = ownerById.get(ownerId);
      setPages((prev) =>
        prev.map((x) =>
          x.project.id === p.project.id
            ? {
                ...x,
                ownerId,
                ownerEmail: nextOwner?.email ?? json.ownerEmail ?? null,
              }
            : x
        )
      );
      setInfo(`Ownership transferred to ${nextOwner?.email ?? 'new owner'}.`);
      setTransferOpenId(null);
      setTransferTarget('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setBusyId(null);
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
            placeholder="Search title, slug, subdomain, owner…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} of {pages.length}</span>
      </div>

      <PagesTable
        pages={filtered}
        owners={owners}
        busyId={busyId}
        transferOpenId={transferOpenId}
        transferTarget={transferTarget}
        onTransferOpen={(id, currentOwnerId) => {
          setTransferOpenId(id);
          setTransferTarget(currentOwnerId);
        }}
        onTransferCancel={() => { setTransferOpenId(null); setTransferTarget(''); }}
        onTransferTargetChange={setTransferTarget}
        onTransferSubmit={handleTransfer}
        onDelete={handleDelete}
      />
    </div>
  );
}

interface PagesTableProps {
  pages: AdminPageRowDTO[];
  owners: OwnerOptionDTO[];
  busyId: string | null;
  transferOpenId: string | null;
  transferTarget: string;
  onTransferOpen: (projectId: string, currentOwnerId: string) => void;
  onTransferCancel: () => void;
  onTransferTargetChange: (id: string) => void;
  onTransferSubmit: (p: AdminPageRowDTO) => void;
  onDelete: (p: AdminPageRowDTO) => void;
}

function PagesTable({
  pages, owners, busyId, transferOpenId, transferTarget,
  onTransferOpen, onTransferCancel, onTransferTargetChange, onTransferSubmit, onDelete,
}: PagesTableProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Page</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Collab.</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No pages match your filter.
                </td>
              </tr>
            ) : pages.map((p) => (
              <PageRow
                key={p.project.id}
                page={p}
                owners={owners}
                isBusy={busyId === p.project.id}
                transferOpen={transferOpenId === p.project.id}
                transferTarget={transferTarget}
                onTransferOpen={() => onTransferOpen(p.project.id, p.ownerId)}
                onTransferCancel={onTransferCancel}
                onTransferTargetChange={onTransferTargetChange}
                onTransferSubmit={() => onTransferSubmit(p)}
                onDelete={() => onDelete(p)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface PageRowProps {
  page: AdminPageRowDTO;
  owners: OwnerOptionDTO[];
  isBusy: boolean;
  transferOpen: boolean;
  transferTarget: string;
  onTransferOpen: () => void;
  onTransferCancel: () => void;
  onTransferTargetChange: (id: string) => void;
  onTransferSubmit: () => void;
  onDelete: () => void;
}

function PageRow({
  page, owners, isBusy, transferOpen, transferTarget,
  onTransferOpen, onTransferCancel, onTransferTargetChange, onTransferSubmit, onDelete,
}: PageRowProps) {
  const dep = page.latestDeployment;
  const pill = dep
    ? STATUS_PILL[dep.status]
    : { label: 'Draft', cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  const urls = resolveProjectDisplayUrls(page.project, dep ?? undefined, PAGES_PARENT_DOMAIN);
  return (
    <tr className="border-b border-gray-50 last:border-0 align-top">
      <td className="px-4 py-3 max-w-xs">
        <Link
          href={`/dashboard/projects/${page.project.id}`}
          className="font-medium text-gray-900 hover:text-orange-700 truncate block"
          title={page.project.title}
        >
          {page.project.title}
        </Link>
        <div className="text-xs text-gray-500 mt-0.5 truncate">
          {templateName(page.project.templateId)} · /{page.project.slug}
        </div>
        {urls.primaryUrl && (
          <a
            href={urls.primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-700 hover:text-orange-800 inline-flex items-center gap-1 mt-1 max-w-full truncate"
            title={urls.primaryUrl}
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            {urls.primaryHost ?? urls.primaryUrl.replace(/^https?:\/\//, '')}
          </a>
        )}
      </td>
      <td className="px-4 py-3 text-gray-700">
        {transferOpen ? (
          <div className="flex items-center gap-1.5">
            <select
              value={transferTarget}
              onChange={(e) => onTransferTargetChange(e.target.value)}
              disabled={isBusy}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {owners.map((o) => (
                <option key={o.userId} value={o.userId}>
                  {o.email ?? o.userId} {o.role === 'admin' ? '(admin)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={onTransferSubmit}
              disabled={isBusy}
              className="px-2 py-1 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
            <button
              onClick={onTransferCancel}
              disabled={isBusy}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <span className="text-gray-700 truncate inline-block max-w-[14rem]" title={page.ownerEmail ?? ''}>
            {page.ownerEmail ?? '—'}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${pill.cls}`}>
          {pill.label}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-700">{page.collaboratorCount}</td>
      <td className="px-4 py-3 text-gray-500">{formatRelative(page.project.updatedAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/dashboard/projects/${page.project.id}`}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            title="Open dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Link>
          <button
            onClick={onTransferOpen}
            disabled={isBusy || transferOpen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-40"
            title="Transfer ownership"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isBusy}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
            title="Delete"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}
