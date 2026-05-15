'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Plus, Pencil, Trash2, ExternalLink, LogOut, Loader2 } from 'lucide-react';
import type { ProjectDTO } from '@/lib/projects/types';
import type { DeploymentDTO } from '@/lib/deployments/types';
import { deleteProject, updateProject } from '@/lib/projects/remoteStorage';
import { v1Templates } from '@/lib/v1Templates';
import { createClient } from '@/lib/supabase/client';

const STATUS_PILL: Record<DeploymentDTO['status'], { label: string; cls: string }> = {
  pending:  { label: 'Queued',    cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  building: { label: 'Building…', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready:    { label: 'Live',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  error:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200' },
  canceled: { label: 'Canceled',  cls: 'bg-gray-100 text-gray-700 border-gray-200' },
};

function templateName(templateId: string): string {
  return v1Templates.find((t) => t.id === templateId)?.name ?? templateId;
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

interface DashboardClientProps {
  initialProjects: ProjectDTO[];
  initialLatestDeployments: Record<string, DeploymentDTO>;
  userEmail: string;
  loadError: string;
}

export default function DashboardClient({
  initialProjects,
  initialLatestDeployments,
  userEmail,
  loadError,
}: DashboardClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[]>(initialProjects);
  const [latestDeployments] = useState<Record<string, DeploymentDTO>>(initialLatestDeployments);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [, startTransition] = useTransition();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function handleRenameSubmit(p: ProjectDTO) {
    const next = renameValue.trim();
    if (!next || next === p.title) {
      setRenamingId(null);
      return;
    }
    setBusyId(p.id);
    setActionError('');
    try {
      const updated = await updateProject(p.id, { title: next });
      setProjects((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      setRenamingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p: ProjectDTO) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    setActionError('');
    try {
      await deleteProject(p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  function openInEditor(p: ProjectDTO) {
    startTransition(() => router.push(`/?project=${p.id}`));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-orange-600">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">SparkPage</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My SparkPages</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 shadow-md shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            New page
          </Link>
        </div>

        {(loadError || actionError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {loadError || actionError}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No saved pages yet</h2>
            <p className="text-sm text-gray-600 mb-6">
              Build a landing page and click <span className="font-medium">Save changes</span> in the editor to add it here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600"
            >
              <Plus className="w-4 h-4" />
              Create your first page
            </Link>
          </div>
        ) : (
          <ProjectList
            projects={projects}
            latestDeployments={latestDeployments}
            renamingId={renamingId}
            renameValue={renameValue}
            busyId={busyId}
            onOpen={openInEditor}
            onStartRename={(p) => { setRenamingId(p.id); setRenameValue(p.title); }}
            onRenameChange={setRenameValue}
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenamingId(null)}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

interface ProjectListProps {
  projects: ProjectDTO[];
  latestDeployments: Record<string, DeploymentDTO>;
  renamingId: string | null;
  renameValue: string;
  busyId: string | null;
  onOpen: (p: ProjectDTO) => void;
  onStartRename: (p: ProjectDTO) => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: (p: ProjectDTO) => void;
  onRenameCancel: () => void;
  onDelete: (p: ProjectDTO) => void;
}

function ProjectList({
  projects, latestDeployments, renamingId, renameValue, busyId,
  onOpen, onStartRename, onRenameChange, onRenameSubmit, onRenameCancel, onDelete,
}: ProjectListProps) {
  return (
    <ul className="space-y-3">
      {projects.map((p) => {
        const isRenaming = renamingId === p.id;
        const isBusy = busyId === p.id;
        const dep = latestDeployments[p.id];
        const pill = dep ? STATUS_PILL[dep.status] : { label: 'Draft', cls: 'bg-gray-50 text-gray-600 border-gray-200' };
        return (
          <li
            key={p.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              {isRenaming ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); onRenameSubmit(p); }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => onRenameChange(e.target.value)}
                    onBlur={() => onRenameSubmit(p)}
                    onKeyDown={(e) => { if (e.key === 'Escape') onRenameCancel(); }}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </form>
              ) : (
                <button
                  onClick={() => onOpen(p)}
                  className="text-left w-full"
                  title="Open in editor"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-gray-900 truncate">{p.title}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${pill.cls}`}
                      title={dep?.errorMessage || pill.label}
                    >
                      {pill.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 min-w-0">
                    <span className="truncate">
                      {templateName(p.templateId)} · updated {formatRelative(p.updatedAt)}
                    </span>
                  </div>
                  {dep?.status === 'ready' && dep.url && (
                    <a
                      href={dep.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-orange-700 hover:text-orange-800 inline-flex items-center gap-1 mt-1 max-w-full truncate"
                      title={dep.url}
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {dep.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onOpen(p)}
                disabled={isBusy}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                title="Open in editor"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartRename(p)}
                disabled={isBusy}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                title="Rename"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(p)}
                disabled={isBusy}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                title="Delete"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
