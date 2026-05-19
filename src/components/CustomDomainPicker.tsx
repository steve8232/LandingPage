'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { validateCustomDomain } from '@/lib/projects/customDomain';
import {
  clearProjectCustomDomain,
  pollProjectCustomDomainStatus,
  setProjectCustomDomain,
} from '@/lib/projects/remoteStorage';
import type { CustomDomainStatus, ProjectDTO } from '@/lib/projects/types';
import CustomDomainPickerView from './CustomDomainPickerView';

interface CustomDomainPickerProps {
  projectId: string;
  initialDomain: string | null;
  initialStatus: CustomDomainStatus | null;
  initialError: string | null;
  initialApex: boolean;
  onChange?: (project: ProjectDTO) => void;
}

const POLL_INTERVAL_MS = 8_000;

export default function CustomDomainPicker({
  projectId,
  initialDomain,
  initialStatus,
  initialError,
  initialApex,
  onChange,
}: CustomDomainPickerProps) {
  const [domain, setDomain] = useState<string | null>(initialDomain);
  const [apex, setApex] = useState<boolean>(initialApex);
  const [status, setStatus] = useState<CustomDomainStatus | null>(initialStatus);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [txt, setTxt] = useState<{ name: string; value: string } | null>(null);
  const pollRef = useRef<number | null>(null);

  const startEdit = useCallback(() => {
    setDraft(domain ?? '');
    setDraftError('');
    setEditing(true);
  }, [domain]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft('');
    setDraftError('');
  }, []);

  const save = useCallback(async () => {
    const v = validateCustomDomain(draft);
    if (!v.ok) {
      setDraftError(v.error);
      return;
    }
    setSaving(true);
    setDraftError('');
    try {
      const project = await setProjectCustomDomain(projectId, v.value);
      setDomain(project.customDomain);
      setApex(project.customDomainApex);
      setStatus(project.customDomainStatus);
      setErrorMsg(project.customDomainError);
      setEditing(false);
      onChange?.(project);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [draft, projectId, onChange]);

  const remove = useCallback(async () => {
    if (!domain) return;
    if (!window.confirm(`Remove ${domain}? Visitors using it will see a 404 until DNS is removed.`)) {
      return;
    }
    setSaving(true);
    try {
      const project = await clearProjectCustomDomain(projectId);
      setDomain(null);
      setApex(false);
      setStatus(null);
      setErrorMsg(null);
      setTxt(null);
      onChange?.(project);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setSaving(false);
    }
  }, [domain, projectId, onChange]);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      const data = await pollProjectCustomDomainStatus(projectId);
      if (data.project) {
        setDomain(data.project.customDomain);
        setApex(data.project.customDomainApex);
        setStatus(data.project.customDomainStatus);
        setErrorMsg(data.project.customDomainError);
        onChange?.(data.project);
      }
      setTxt(data.verification ? { name: data.verification.txtName, value: data.verification.txtValue } : null);
    } catch {
      // swallow — UI keeps last-known state, user can hit Recheck again.
    } finally {
      setChecking(false);
    }
  }, [projectId, onChange]);

  // Auto-poll while we're in a non-terminal state. Stops as soon as ready /
  // error / unset to avoid hammering Vercel.
  useEffect(() => {
    if (!domain) return;
    if (status === 'ready' || status === 'error' || status === null) return;
    pollRef.current = window.setInterval(() => { void recheck(); }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [domain, status, recheck]);

  return (
    <CustomDomainPickerView
      domain={domain} apex={apex} status={status} errorMsg={errorMsg}
      editing={editing} draft={draft} draftError={draftError} saving={saving}
      checking={checking} txt={txt}
      onDraftChange={setDraft} onStartEdit={startEdit} onCancelEdit={cancelEdit}
      onSave={save} onRemove={remove} onRecheck={recheck}
    />
  );
}
