'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Mail, ShieldCheck, User as UserIcon, Loader2, Plus, KeyRound, X } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 8;

export interface AdminUserRowDTO {
  userId: string;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  ownedCount: number;
  collabCount: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export default function UsersClient({
  initialUsers,
  currentUserId,
  totalAdmins: initialTotalAdmins,
}: {
  initialUsers: AdminUserRowDTO[];
  currentUserId: string;
  totalAdmins: number;
}) {
  const [users, setUsers] = useState<AdminUserRowDTO[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [inviting, setInviting] = useState(false);

  // Set-password modal state
  const [pwTarget, setPwTarget] = useState<AdminUserRowDTO | null>(null);

  const totalAdmins = useMemo(
    () => users.filter((u) => u.role === 'admin').length || initialTotalAdmins,
    [users, initialTotalAdmins]
  );

  async function handleRoleChange(u: AdminUserRowDTO, next: 'admin' | 'user') {
    if (u.role === next) return;
    setBusyId(u.userId);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`/api/admin/users/${u.userId}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Update failed (${res.status})`);
      setUsers((prev) => prev.map((x) => (x.userId === u.userId ? { ...x, role: next } : x)));
      setInfo(`${u.email ?? 'User'} is now ${next}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Invite failed (${res.status})`);
      const u = json.user as { id: string; email: string; role: 'admin' | 'user' };
      setUsers((prev) => {
        if (prev.some((x) => x.userId === u.id)) {
          return prev.map((x) => (x.userId === u.id ? { ...x, role: u.role } : x));
        }
        return [
          { userId: u.id, email: u.email, role: u.role, createdAt: new Date().toISOString(), ownedCount: 0, collabCount: 0 },
          ...prev,
        ];
      });
      setInviteEmail('');
      setInviteRole('user');
      setInfo(json.alreadyExisted ? `Updated existing account ${u.email}.` : `Invite sent to ${u.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-6">
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

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Invite a user</h2>
        </div>
        <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            disabled={inviting}
            className="flex-1 min-w-[14rem] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')}
            disabled={inviting}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Send invite
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Supabase sends a magic-link invite. Existing accounts are role-updated instead of re-invited.
        </p>
      </section>

      <UserTable
        users={users}
        currentUserId={currentUserId}
        totalAdmins={totalAdmins}
        busyId={busyId}
        onRoleChange={handleRoleChange}
        onSetPassword={(u) => {
          setError('');
          setInfo('');
          setPwTarget(u);
        }}
      />

      {pwTarget && (
        <SetPasswordModal
          target={pwTarget}
          onClose={() => setPwTarget(null)}
          onSuccess={(email) => {
            setPwTarget(null);
            setInfo(`Password updated for ${email}.`);
          }}
        />
      )}
    </div>
  );
}

function UserTable({
  users,
  currentUserId,
  totalAdmins,
  busyId,
  onRoleChange,
  onSetPassword,
}: {
  users: AdminUserRowDTO[];
  currentUserId: string;
  totalAdmins: number;
  busyId: string | null;
  onRoleChange: (u: AdminUserRowDTO, next: 'admin' | 'user') => void;
  onSetPassword: (u: AdminUserRowDTO) => void;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Pages owned</th>
              <th className="px-4 py-3 font-medium">Memberships</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isMe = u.userId === currentUserId;
                const wouldStrandAdmins =
                  isMe && u.role === 'admin' && totalAdmins <= 1;
                const isBusy = busyId === u.userId;
                return (
                  <tr key={u.userId} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <span className="truncate">{u.email ?? '—'}</span>
                        {isMe && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isBusy || wouldStrandAdmins}
                        onChange={(e) => onRoleChange(u, e.target.value as 'admin' | 'user')}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        title={wouldStrandAdmins ? 'Promote another admin first' : ''}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {isBusy && (
                        <Loader2 className="inline ml-2 w-3 h-3 animate-spin text-gray-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.ownedCount}</td>
                    <td className="px-4 py-3 text-gray-700">{u.collabCount}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => onSetPassword(u)}
                          disabled={isBusy}
                          title="Set password"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Set password
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function SetPasswordModal({
  target,
  onClose,
  onSuccess,
}: {
  target: AdminUserRowDTO;
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErr(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/admin/users/${target.userId}/password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Update failed (${res.status})`);
      onSuccess(target.email ?? 'user');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-orange-600" />
            <h2 className="font-semibold text-gray-900">Set password</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Setting password for <span className="font-medium text-gray-900">{target.email ?? '—'}</span>.
          They&apos;ll be able to sign in immediately with this password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="admin-pw" className="block text-sm font-medium text-gray-700 mb-1.5">
              New password
            </label>
            <input
              id="admin-pw"
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="admin-pw-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm password
            </label>
            <input
              id="admin-pw-confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={busy}
            />
          </div>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {err}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !password || !confirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Save password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
